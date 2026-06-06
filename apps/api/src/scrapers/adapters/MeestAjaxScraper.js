// apps/api/src/scrapers/adapters/MeestAjaxScraper.js
// Pure HTTP scraper з checksum caching та hybrid fallback

const axios = require('axios');
const xml2js = require('xml2js');
const CacheManager = require('../../services/CacheManager');

/**
 * MeestAjaxScraper - HTTP-only scraping з checksum cache
 * 
 * Стратегія:
 * 1. Перевірити checksum cache
 * 2. Якщо є - використати для HTTP request (5KB)
 * 3. Якщо немає - fallback до MeestHybridScraper (5MB один раз)
 * 4. Кешувати checksum на 30 днів
 */
class MeestAjaxScraper {
    constructor(config = {}) {
        this.name = 'MeestAjaxScraper';
        this.ajaxEndpoint = 'https://t.meest-group.com/get.php';
        this.timeout = config.timeout || 15000;
        
        // Checksum cache (Redis через CacheManager)
        this.cacheManager = config.cacheManager || null;
        this.checksumTTL = 30 * 24 * 60 * 60; // 30 днів
        
        // Fallback scraper для нових номерів
        this.fallbackScraper = null; // Буде встановлено ззовні
        
        // Hardcoded checksums для популярних номерів
        this.knownChecksums = {
            '2508205FM9K077RC': 'd7cacadc34c7a36a5351377327f095c3',
            'CV906075125CA': '72d9224b6381ae7e274ebb8a1d261268'
        };
        
        // Metrics
        this.metrics = {
            totalRequests: 0,
            cacheHits: 0,
            fallbackUsed: 0,
            successfulRequests: 0,
            failedRequests: 0
        };
        
        console.log('MeestAjaxScraper initialized (pure HTTP with checksum cache)');
    }

    /**
     * Main scraping method
     */
    async scrape(trackingNumber, options = {}) {
        console.log(`[MeestAjax] Scraping ${trackingNumber}`);
        
        this.metrics.totalRequests++;
        const startTime = Date.now();

        try {
            // STEP 1: Спробувати отримати checksum
            let chk = await this.getChecksum(trackingNumber);
            
            if (!chk) {
                console.log(`[MeestAjax] No checksum available for ${trackingNumber}`);
                
                // STEP 2: Fallback до hybrid scraper (браузер)
                if (this.fallbackScraper) {
                    console.log(`[MeestAjax] Using fallback scraper...`);
                    this.metrics.fallbackUsed++;
                    
                    const fallbackResult = await this.fallbackScraper.scrape(trackingNumber, options);
                    
                    // Витягти checksum з fallback (якщо він його перехопив)
                    if (fallbackResult.checksum) {
                        await this.cacheChecksum(trackingNumber, fallbackResult.checksum);
                    }
                    
                    return fallbackResult;
                }
                
                throw new Error('No checksum available and no fallback scraper configured');
            }

            // STEP 3: Scrape через HTTP з checksum
            const result = await this.scrapeViaHttp(trackingNumber, chk);
            
            this.metrics.successfulRequests++;
            
            return {
                ...result,
                source: 'ajax',
                responseTime: Date.now() - startTime
            };

        } catch (error) {
            this.metrics.failedRequests++;
            console.error(`[MeestAjax] Scraping failed:`, error.message);
            
            return {
                error: error.message,
                trackingNumber,
                source: 'ajax'
            };
        }
    }

    /**
     * Get checksum from cache or hardcoded
     */
    async getChecksum(trackingNumber) {
        // 1. Hardcoded checksums
        if (this.knownChecksums[trackingNumber]) {
            console.log(`[MeestAjax] Using hardcoded checksum`);
            return this.knownChecksums[trackingNumber];
        }

        // 2. Cache
        if (this.cacheManager) {
            const cacheKey = `meest:checksum:${trackingNumber}`;
            const cached = await this.cacheManager.get(cacheKey);
            
            if (cached) {
                console.log(`[MeestAjax] Checksum cache hit`);
                this.metrics.cacheHits++;
                return cached;
            }
        }

        return null;
    }

    /**
     * Cache checksum for future use
     */
    async cacheChecksum(trackingNumber, chk) {
        if (!this.cacheManager) return;

        const cacheKey = `meest:checksum:${trackingNumber}`;
        await this.cacheManager.set(cacheKey, chk, this.checksumTTL);
        
        console.log(`[MeestAjax] Checksum cached for ${trackingNumber}`);
    }

    /**
     * Scrape via HTTP with known checksum
     */
    async scrapeViaHttp(trackingNumber, chk) {
        console.log(`[MeestAjax] HTTP request with checksum`);

        try {
            const response = await axios.get(this.ajaxEndpoint, {
                params: {
                    what: 'tracking',
                    number: trackingNumber,
                    lang: 'uk',
                    chk: chk
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json, text/javascript, */*',
                    'Referer': 'https://ua.meest.com/',
                    'Origin': 'https://ua.meest.com'
                },
                timeout: this.timeout
            });

            // Parse XML response
            return await this.parseXmlResponse(response.data, trackingNumber);

        } catch (error) {
            console.error(`[MeestAjax] HTTP request failed:`, error.message);
            throw error;
        }
    }

    /**
     * Parse XML response to standard format
     */
    async parseXmlResponse(xmlData, trackingNumber) {
        try {
            const parser = new xml2js.Parser({ 
                explicitArray: false,
                mergeAttrs: true 
            });
            
            const result = await parser.parseStringPromise(xmlData);
            
            if (!result.return || !result.return.result_table) {
                throw new Error('Invalid XML structure');
            }

            const items = result.return.result_table.items;
            
            // items може бути object (1 подія) або array (>1 події)
            const eventsArray = Array.isArray(items) ? items : [items];
            
            // Build events
            const events = eventsArray.map(item => ({
                date: item.DateTimeAction || new Date().toISOString(),
                status: item.ActionMessages_EN || item.ActionMessages || 'Unknown',
                description: item.DetailMessages_EN || item.DetailMessages || '',
                location: item.City_EN || item.City || '',
                country: item.Country_EN || item.Country || '',
                statusCode: item.StatusCode || null
            }));

            // Sort by date
            events.sort((a, b) => new Date(a.date) - new Date(b.date));

            const lastEvent = events[events.length - 1];

            return {
                trackingNumber,
                status: lastEvent?.status || 'Unknown',
                statusCode: lastEvent?.statusCode,
                lastUpdate: lastEvent?.date || new Date().toISOString(),
                events: events,
                estimatedDelivery: null,
                raw: result
            };

        } catch (error) {
            console.error(`[MeestAjax] XML parse error:`, error.message);
            throw new Error(`Failed to parse Meest XML response: ${error.message}`);
        }
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            name: this.name,
            ...this.metrics,
            cacheHitRate: this.metrics.totalRequests > 0 
                ? `${((this.metrics.cacheHits / this.metrics.totalRequests) * 100).toFixed(2)}%`
                : '0%',
            fallbackRate: this.metrics.totalRequests > 0
                ? `${((this.metrics.fallbackUsed / this.metrics.totalRequests) * 100).toFixed(2)}%`
                : '0%'
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        return {
            status: 'ok',
            scraper: this.name,
            note: 'HTTP-only scraper with checksum cache',
            metrics: this.getMetrics(),
            knownChecksums: Object.keys(this.knownChecksums).length,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = MeestAjaxScraper;
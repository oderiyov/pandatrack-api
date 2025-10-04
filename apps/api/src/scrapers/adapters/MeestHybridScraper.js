// apps/api/src/scrapers/adapters/MeestHybridScraper.js
// HYBRID: Browser тільки для отримання chk, потім HTTP requests

const PlaywrightScraperCore = require('../PlaywrightScraperCore');
const axios = require('axios');

class MeestHybridScraper extends PlaywrightScraperCore {
    constructor(config = {}) {
        super({
            name: 'MeestHybridScraper',
            baseUrl: 'https://ua.meest.com',
            timeout: 30000,
            headless: config.headless !== false,
            useProxies: config.useProxies !== false,
            ...config
        });
        
        this.trackingUrl = 'https://ua.meest.com/parcel-track';
        this.ajaxEndpoint = 'https://t.meest-group.com/get.php';
        
        // Cache для chk checksums (можливо pattern повторюється)
        this.checksumCache = new Map();
    }

    /**
     * Main scraping method - HYBRID approach
     */
    async scrape(trackingNumber, options = {}) {
        console.log(`[MeestHybrid] Starting hybrid scrape for ${trackingNumber}`);
        
        const startTime = Date.now();

        try {
            // PHASE 1: Try cached checksum
            const cachedChk = this.checksumCache.get(trackingNumber);
            if (cachedChk) {
                console.log(`[MeestHybrid] Using cached checksum`);
                return await this.scrapeViaAjax(trackingNumber, cachedChk);
            }

            // PHASE 2: Use browser to intercept chk parameter
            const chk = await this.interceptChecksum(trackingNumber);
            
            if (!chk) {
                throw new Error('Failed to intercept checksum from browser');
            }

            // Cache it
            this.checksumCache.set(trackingNumber, chk);
            console.log(`[MeestHybrid] Checksum intercepted: ${chk}`);

            // PHASE 3: Use AJAX with intercepted checksum
            const result = await this.scrapeViaAjax(trackingNumber, chk);

            this.updateMetrics(true, Date.now() - startTime);
            return result;

        } catch (error) {
            this.updateMetrics(false, Date.now() - startTime);
            console.error(`[MeestHybrid] Scraping failed:`, error.message);
            
            return {
                error: error.message,
                trackingNumber
            };
        }
    }

    /**
     * Intercept checksum parameter from browser request
     */
    async interceptChecksum(trackingNumber) {
        console.log(`[MeestHybrid] Intercepting checksum via browser...`);
        
        let page = null;
        let interceptedChk = null;

        try {
            await this.checkRateLimit();
            await this.initBrowser();
            await this.createContext();
            
            page = await this.createPage();

            // Set up request interception
            page.on('request', request => {
                const url = request.url();
                
                // Intercept tracking API call
                if (url.includes('t.meest-group.com/get.php') && url.includes('what=tracking')) {
                    console.log(`[MeestHybrid] Intercepted request: ${url}`);
                    
                    // Extract chk parameter
                    const urlObj = new URL(url);
                    const chk = urlObj.searchParams.get('chk');
                    
                    if (chk) {
                        interceptedChk = chk;
                        console.log(`[MeestHybrid] ✓ Checksum found: ${chk}`);
                    }
                }
            });

            // Navigate to tracking page
            const trackingUrlWithNumber = `${this.trackingUrl}?parcel_number=${encodeURIComponent(trackingNumber)}`;
            
            await page.goto(trackingUrlWithNumber, {
                waitUntil: 'domcontentloaded',
                timeout: this.timeout
            });

            // Wait for AJAX requests to complete
            await this.delay(3000);

            // Wait for network idle to ensure AJAX completed
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

            return interceptedChk;

        } finally {
            if (page) await page.close().catch(() => {});
            await this.close();
        }
    }

    /**
     * Scrape via AJAX with known checksum
     */
    async scrapeViaAjax(trackingNumber, chk) {
        console.log(`[MeestHybrid] Scraping via AJAX with checksum`);

        try {
            // Request 1: Main tracking data
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
                timeout: 15000
            });

            if (!response.data) {
                throw new Error('Empty response from Meest AJAX API');
            }

            console.log(`[MeestHybrid] AJAX response:`, JSON.stringify(response.data).substring(0, 200));

            // Parse response
            return this.parseAjaxResponse(response.data, trackingNumber);

        } catch (error) {
            console.error(`[MeestHybrid] AJAX request failed:`, error.message);
            throw error;
        }
    }

    /**
     * Parse AJAX response to standard format
     */
    parseAjaxResponse(data, trackingNumber) {
        try {
            // Структура Meest API response (треба адаптувати під реальну)
            const events = [];
            
            // Припустима структура tracking events
            if (data.tracking && Array.isArray(data.tracking)) {
                data.tracking.forEach(event => {
                    events.push({
                        date: event.date || event.timestamp,
                        status: event.status || event.description,
                        description: event.description || event.status,
                        location: event.location || event.city || '',
                        statusCode: event.code
                    });
                });
            } else if (data.events && Array.isArray(data.events)) {
                data.events.forEach(event => {
                    events.push({
                        date: event.date,
                        status: event.status,
                        description: event.description || event.status,
                        location: event.location || '',
                        statusCode: null
                    });
                });
            }

            // Якщо події не знайдено
            if (events.length === 0) {
                console.warn(`[MeestHybrid] No events in response, raw data:`, data);
            }

            return {
                trackingNumber,
                status: data.status || data.currentStatus || 'Unknown',
                statusCode: data.statusCode,
                lastUpdate: events.length > 0 
                    ? events[events.length - 1].date 
                    : new Date().toISOString(),
                events: events,
                estimatedDelivery: data.estimatedDelivery || data.pdd,
                source: 'ajax',
                raw: data
            };

        } catch (error) {
            console.error(`[MeestHybrid] Parse error:`, error.message);
            throw new Error(`Failed to parse Meest AJAX response: ${error.message}`);
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        return {
            status: 'ok',
            scraper: this.name,
            note: 'Hybrid scraper: Browser for checksum, AJAX for data',
            checksumCacheSize: this.checksumCache.size,
            metrics: this.getMetrics(),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = MeestHybridScraper;
// apps/api/src/providers/MeestProvider.js - HYBRID VERSION
const BaseProvider = require('./BaseProvider');
const MeestAjaxScraper = require('../scrapers/adapters/MeestAjaxScraper');
const MeestHybridScraper = require('../scrapers/adapters/MeestHybridScraper');
const { translateStatus, translateLocation } = require('../utils/meestTranslations');

class MeestProvider extends BaseProvider {
    constructor(config) {
        super(config);
        
        // API Config
        this.apiToken = process.env.MEEST_API_TOKEN;
        this.contractId = process.env.MEEST_CONTRACT_ID;
        this.baseUrl = 'https://api.meest.com/v3.0';
        
        // HYBRID CONFIG
        this.scrapingEnabled = process.env.MEEST_SCRAPING_ENABLED === 'true';
        this.apiReliability = 0.2; // API працює тільки для власних контрактів (~20%)
        
        // Ініціалізуємо scraper
        if (this.scrapingEnabled) {
            // Основний scraper - HTTP only
            this.scraper = new MeestAjaxScraper({
                cacheManager: this.cacheManager
            });

            // Fallback для нових номерів без checksum
            this.scraper.fallbackScraper = new MeestHybridScraper({
                useProxies: true,
                headless: true
            });
                
            console.log('Meest Provider: Ajax scraper initialized (HTTP with hybrid fallback)');
        }
        
        console.log('Meest Provider (Hybrid) initialized:', {
            hasApiToken: !!this.apiToken,
            scrapingEnabled: this.scrapingEnabled,
            apiReliability: `${this.apiReliability * 100}%`
        });
    }

    /**
     * HYBRID LOGIC: Meest-специфічна стратегія
     * Priority: Cache → API (спроба) → Scraping (основний метод)
     */
    getTrackingStrategies() {
        const strategies = [];
        
        // 1. Cache завжди перший
        if (this.cacheManager) {
            strategies.push({
                name: 'cache',
                priority: 1,
                method: 'trackViaCache'
            });
        }
        
        // 2. API пробуємо (може спрацювати для власних номерів)
        if (this.apiToken) {
            strategies.push({
                name: 'native_api',
                priority: 2,
                method: 'trackViaAPI'
            });
        }
        
        // 3. Scraping як основний fallback
        if (this.scrapingEnabled && this.scraper) {
            strategies.push({
                name: 'web_scraping',
                priority: 3,
                method: 'trackViaScraping'
            });
        }
        
        return strategies;
    }

    /**
     * HYBRID STRATEGY: Meest API (обмежений)
     */
    async trackViaAPI(trackingNumber, options = {}) {
        console.log(`[Meest] Trying API for ${trackingNumber}`);
        
        try {
            const response = await this.makeRequest(`${this.baseUrl}/track`, {
                method: 'GET',
                params: {
                    number: trackingNumber
                },
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            console.log('[Meest] API Response:', JSON.stringify(response.data, null, 2));

            // API може повернути пустий масив для зовнішніх посилок
            if (!response.data || response.data.length === 0) {
                throw new Error('API returned empty result (external tracking number)');
            }

            const trackingData = this.parseAPIResponse(response.data, trackingNumber);
            
            // Зберігаємо в cache
            if (this.cacheManager && trackingData.success) {
                const ttl = this.calculateTTL(trackingData.data?.status);
                await this.saveToCacheAsync(trackingNumber, trackingData, ttl);
            }
            
            return {
                ...trackingData,
                source: 'api'
            };
            
        } catch (error) {
            console.log(`[Meest] API failed:`, error.message);
            // Падаємо до scraping
            throw error;
        }
    }

    /**
     * HYBRID STRATEGY: Web Scraping (основний метод)
     */
    async trackViaScraping(trackingNumber, options = {}) {
        console.log(`[Meest] Starting web scraping for ${trackingNumber}`);
        
        if (!this.scraper) {
            throw new Error('Meest scraper not initialized');
        }
        
        const scrapedData = await this.scraper.scrape(trackingNumber, options);
        
        if (!scrapedData || scrapedData.error) {
            throw new Error(scrapedData?.error || 'Scraping failed');
        }
        
        // Нормалізуємо scraped data
        const normalized = this.normalizeScrapedData(scrapedData, trackingNumber);
        
        // Зберігаємо в cache
        if (this.cacheManager && normalized.success) {
            const ttl = this.calculateTTL(normalized.data?.status);
            await this.saveToCacheAsync(trackingNumber, normalized, ttl);
        }
        
        return {
            ...normalized,
            source: 'scraping'
        };
    }

    /**
     * Parse Meest API response
     */
    parseAPIResponse(data, trackingNumber) {
        try {
            // Припустима структура API (треба адаптувати)
            const item = Array.isArray(data) ? data[0] : data;
            
            if (!item) {
                throw new Error('Invalid API response structure');
            }
            
            const events = this.buildEventsFromAPI(item);
            const currentStatus = item.status || item.currentStatus || 'Unknown';
            
            return {
                success: true,
                data: {
                    trackingNumber,
                    carrier: 'Meest Express',
                    status: translateStatus(currentStatus),
                    statusCode: item.statusCode || null,
                    lastUpdate: item.lastUpdate || new Date().toISOString(),
                    events: events,
                    estimatedDelivery: item.estimatedDelivery,
                    raw: item
                },
                provider: this.name,
                cost: 0
            };
            
        } catch (error) {
            console.error('[Meest] API response parse error:', error.message);
            return {
                success: false,
                error: `Failed to parse Meest API response: ${error.message}`,
                provider: this.name,
                trackingNumber
            };
        }
    }

    /**
     * Normalize scraped data from MeestScraper
     */
    normalizeScrapedData(scrapedData, trackingNumber) {
        try {
            // Перекладаємо події
            const translatedEvents = scrapedData.events.map(event => ({
                date: event.date,
                status: translateStatus(event.status),
                description: translateStatus(event.description || event.status),
                location: translateLocation(event.location),
                statusCode: event.statusCode,
                originalStatus: event.status
            }));
            
            return {
                success: true,
                data: {
                    trackingNumber,
                    carrier: 'Meest Express',
                    status: translateStatus(scrapedData.status),
                    statusCode: scrapedData.statusCode,
                    lastUpdate: scrapedData.lastUpdate,
                    events: translatedEvents,
                    estimatedDelivery: scrapedData.estimatedDelivery,
                    raw: scrapedData
                },
                provider: this.name,
                cost: 0, // Scraping безкоштовний (тільки proxy $3/міс)
                supportsInternational: true
            };
            
        } catch (error) {
            console.error('[Meest] Scraped data normalization error:', error.message);
            return {
                success: false,
                error: `Failed to normalize Meest scraped data: ${error.message}`,
                provider: this.name,
                trackingNumber
            };
        }
    }

    /**
     * Build events from API response
     */
    buildEventsFromAPI(item) {
        const events = [];
        
        // Припустима структура (треба адаптувати під реальний API)
        if (item.tracking && Array.isArray(item.tracking)) {
            item.tracking.forEach(event => {
                events.push({
                    date: event.date || event.timestamp,
                    status: translateStatus(event.status || event.description),
                    description: translateStatus(event.description || event.status),
                    location: translateLocation(event.location || event.place || ''),
                    statusCode: event.code || event.statusCode,
                    originalStatus: event.status || event.description
                });
            });
        }
        
        // Сортуємо події по даті
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return events;
    }

    /**
     * Can handle tracking number
     */
    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().replace(/\s/g, '');
        
        // Meest Express formats
        // Міжнародні: 59001234567890UA
        if (/^\d{14}[A-Z]{2}$/.test(number)) return true;
        
        // Внутрішні: MExxxxxx або різні цифрові формати
        if (/^ME\d{6,}$/.test(number.toUpperCase())) return true;
        if (/^\d{10,13}$/.test(number)) return true;
        
        return false;
    }

    /**
     * Health check
     */
    async healthCheck() {
        return {
            status: 'ok',
            provider: this.name,
            features: {
                api: !!this.apiToken,
                scraping: this.scrapingEnabled,
                cache: !!this.cacheManager
            },
            note: 'Browser health check disabled to save proxy bandwidth',
            timestamp: new Date().toISOString()
        };
        
    }
}

module.exports = MeestProvider;
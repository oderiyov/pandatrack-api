// apps/api/src/providers/MeestProvider.js - COMPLETE WITH MOBILE API v3.0

const BaseProvider = require('./BaseProvider');
const MeestAjaxScraper = require('../scrapers/adapters/MeestAjaxScraper');
const MeestHybridScraper = require('../scrapers/adapters/MeestHybridScraper');
const MeestMobileAPI = require('./adapters/MeestMobileAPI');
const { translateStatus, translateLocation } = require('../utils/meestTranslations');

class MeestProvider extends BaseProvider {
    constructor(config) {
        super(config);
        
        // Legacy API Config (optional, low reliability ~20%)
        this.apiToken = process.env.MEEST_API_TOKEN;
        this.contractId = process.env.MEEST_CONTRACT_ID;
        this.baseUrl = 'https://api.meest.com/v3.0';
        this.apiReliability = 0.2;
        
        // Mobile API v3.0 (PRIMARY - 100% coverage)
        this.useMobileAPI = process.env.MEEST_USE_MOBILE_API === 'true';
        if (this.useMobileAPI) {
            try {
                this.mobileAPI = new MeestMobileAPI();
                console.log('✅ Meest Mobile API v3.0 enabled');
            } catch (error) {
                console.error('❌ Failed to initialize Meest Mobile API:', error.message);
                this.mobileAPI = null;
            }
        }
        
        // Web Scraping (FALLBACK)
        this.scrapingEnabled = process.env.MEEST_SCRAPING_ENABLED === 'true';
        if (this.scrapingEnabled) {
            this.scraper = new MeestAjaxScraper({
                cacheManager: this.cacheManager
            });
            this.scraper.fallbackScraper = new MeestHybridScraper({
                useProxies: true,
                headless: true
            });
        }
        
        console.log('Meest Provider initialized:', {
            mobileAPI: !!this.mobileAPI,
            legacyAPI: !!this.apiToken,
            scraping: this.scrapingEnabled,
            apiReliability: `${this.apiReliability * 100}%`
        });
    }

    /**
     * HYBRID STRATEGY with Mobile API Priority
     * 1. Cache (always first)
     * 2. Mobile API v3.0 (PRIMARY - 100% coverage, free)
     * 3. Legacy API (fallback - 20% success, own contracts only)
     * 4. Web Scraping (last resort - 100% but slow)
     */
    getTrackingStrategies() {
        const strategies = [];
        
        // 1. Cache
        if (this.cacheManager) {
            strategies.push({
                name: 'cache',
                priority: 1,
                method: 'trackViaCache'
            });
        }
        
        // 2. Mobile API v3.0 (HIGHEST PRIORITY)
        if (this.mobileAPI) {
            strategies.push({
                name: 'mobile_api',
                priority: 2,
                method: 'trackViaMobileAPI'
            });
        }
        
        // 3. Legacy API (medium priority)
        if (this.apiToken) {
            strategies.push({
                name: 'native_api',
                priority: 3,
                method: 'trackViaAPI'
            });
        }
        
        // 4. Web Scraping (lowest priority)
        if (this.scrapingEnabled && this.scraper) {
            strategies.push({
                name: 'web_scraping',
                priority: 4,
                method: 'trackViaScraping'
            });
        }
        
        return strategies;
    }

    /**
     * NEW: Mobile API v3.0 tracking
     */
    async trackViaMobileAPI(trackingNumber, options = {}) {
        console.log(`📱 [Meest Mobile API v3.0] Tracking: ${trackingNumber}`);
        
        if (!this.mobileAPI) {
            throw new Error('Mobile API not initialized');
        }
        
        try {
            const result = await this.mobileAPI.track(trackingNumber);
            
            console.log(`📱 [Mobile API] Result:`, {
                success: result.success,
                hasData: !!result.data,
                eventsCount: result.data?.events?.length || 0,
                status: result.data?.status,
                error: result.error
            });
            
            if (!result.success) {
                throw new Error(result.error || 'Mobile API failed');
            }
            
            // MeestMobileAPI.normalizeResponse() вже повертає готову структуру
            const normalized = {
                success: true,
                data: result.data, // Вже має: trackingNumber, carrier, status, events, etc.
                provider: this.name,
                cost: 0,
                source: 'mobile_api_v3',
                cached: false,
                supportsInternational: true
            };
            
            // Cache result
            if (this.cacheManager && normalized.success && normalized.data.events.length > 0) {
                const ttl = this.calculateTTL(normalized.data.status);
                await this.saveToCacheAsync(trackingNumber, normalized, ttl);
                console.log(`✅ [Mobile API] Cached: ${normalized.data.events.length} events, TTL=${ttl}s`);
            } else if (normalized.data.events.length === 0) {
                console.warn(`⚠️ [Mobile API] No events returned for ${trackingNumber}`);
            }
            
            return normalized;
            
        } catch (error) {
            console.error('❌ [Meest Mobile API] Failed:', error.message);
            throw error;
        }
    }

    /**
     * Legacy API (keep for backward compatibility)
     */
    async trackViaAPI(trackingNumber, options = {}) {
        console.log(`[Meest Legacy API] Tracking: ${trackingNumber}`);
        
        try {
            const response = await this.makeRequest(`${this.baseUrl}/track`, {
                method: 'GET',
                params: { number: trackingNumber },
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            if (!response.data || response.data.length === 0) {
                throw new Error('API returned empty result (external tracking number)');
            }

            const trackingData = this.parseAPIResponse(response.data, trackingNumber);
            
            if (this.cacheManager && trackingData.success) {
                const ttl = this.calculateTTL(trackingData.data?.status);
                await this.saveToCacheAsync(trackingNumber, trackingData, ttl);
            }
            
            return {
                ...trackingData,
                source: 'legacy_api'
            };
            
        } catch (error) {
            console.log(`[Meest Legacy API] Failed:`, error.message);
            throw error;
        }
    }

    /**
     * Web Scraping fallback
     */
    async trackViaScraping(trackingNumber, options = {}) {
        console.log(`[Meest Scraping] Starting for ${trackingNumber}`);
        
        if (!this.scraper) {
            throw new Error('Scraper not initialized');
        }
        
        const scrapedData = await this.scraper.scrape(trackingNumber, options);
        
        if (!scrapedData || scrapedData.error) {
            throw new Error(scrapedData?.error || 'Scraping failed');
        }
        
        const normalized = this.normalizeScrapedData(scrapedData, trackingNumber);
        
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
     * Parse Legacy API response
     */
    parseAPIResponse(data, trackingNumber) {
        try {
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
     * Normalize scraped data
     */
    normalizeScrapedData(scrapedData, trackingNumber) {
        try {
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
                cost: 0,
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
     * Build events from Legacy API response
     */
    buildEventsFromAPI(item) {
        const events = [];
        
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
        
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return events;
    }

    /**
     * Check if can handle tracking number
     */
    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().replace(/\s/g, '');
        
        // Українські формати (Mobile API працює):
        // 2508205FM9K077RC - 16 символів буквоцифри
        if (/^\d{16}[A-Z]{0,4}$/i.test(number)) {
            this.isInternational = false;
            return true;
        }
        
        // Внутрішні короткі номери
        if (/^ME\d{6,}$/i.test(number)) {
            this.isInternational = false;
            return true;
        }
        
        if (/^\d{10,15}$/.test(number)) {
            this.isInternational = false;
            return true;
        }
        
        // Міжнародні формати (Mobile API НЕ працює - 401):
        // CV925242617US, RR123456789US тощо
        if (/^[A-Z]{2}\d{9,11}[A-Z]{2}$/.test(number)) {
            this.isInternational = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Detect if tracking number is international format
     */
    isInternationalTracking(trackingNumber) {
        const number = trackingNumber.trim().replace(/\s/g, '');
        return /^[A-Z]{2}\d{9,11}[A-Z]{2}$/.test(number);
    }

    /**
     * Health check
     */
    async healthCheck() {
        const health = {
            status: 'ok',
            provider: this.name,
            features: {
                mobileAPI: !!this.mobileAPI,
                legacyAPI: !!this.apiToken,
                scraping: this.scrapingEnabled,
                cache: !!this.cacheManager
            },
            timestamp: new Date().toISOString()
        };
        
        // Add Mobile API stats
        if (this.mobileAPI) {
            try {
                const mobileStats = this.mobileAPI.getStats();
                health.mobileAPIStats = mobileStats;
            } catch (error) {
                health.mobileAPIError = error.message;
            }
        }
        
        return health;
    }
}

module.exports = MeestProvider;
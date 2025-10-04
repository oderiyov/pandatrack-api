// apps/api/src/providers/BaseProvider.js
const axios = require('axios');

class BaseProvider {
    constructor(config) {
        this.name = config.name;
        this.cost = config.cost || 0;
        this.quota = config.quota || { daily: Infinity, used: 0 };
        this.enabled = config.enabled !== false;
        this.supportsInternational = config.supportsInternational || false;
        this.stages = config.stages || ['domestic'];
        this.timeout = config.timeout || 15000;
        
        // Hybrid Logic Config
        this.scrapingEnabled = config.scrapingEnabled || false;
        this.quotaManager = config.quotaManager || null;
        this.cacheManager = config.cacheManager || null;
        this.scraper = null; // Ініціалізується в дочірніх класах
    }

    /**
     * HYBRID LOGIC: Головний метод відстеження
     * Автоматично вибирає оптимальну стратегію
     */
    async track(trackingNumber, options = {}) {
        const startTime = Date.now();
        const strategies = this.getTrackingStrategies();
        
        console.log(`[${this.name}] Executing ${strategies.length} strategies for ${trackingNumber}`);
        
        let lastError = null;
        
        for (const strategy of strategies) {
            try {
                console.log(`[${this.name}] Trying strategy: ${strategy.name} (priority ${strategy.priority})`);
                
                const result = await this.executeStrategy(strategy, trackingNumber, options);
                
                if (result && result.success) {
                    result.strategy = strategy.name;
                    result.responseTime = Date.now() - startTime;
                    return result;
                }
                
                lastError = result?.error || 'Strategy failed';
                
            } catch (error) {
                console.log(`[${this.name}] Strategy ${strategy.name} failed:`, error.message);
                lastError = error.message;
                continue;
            }
        }
        
        // Всі стратегії провалилися
        return {
            success: false,
            error: lastError || 'All tracking strategies failed',
            trackingNumber,
            provider: this.name,
            strategiesAttempted: strategies.map(s => s.name),
            responseTime: Date.now() - startTime
        };
    }

    /**
     * HYBRID LOGIC: Визначає пріоритети стратегій
     * Кожен провайдер може перевизначити цей метод
     */
    getTrackingStrategies() {
        const strategies = [];
        
        // 1. Cache завжди перший (найшвидший, безкоштовний)
        if (this.cacheManager) {
            strategies.push({
                name: 'cache',
                priority: 1,
                method: 'trackViaCache'
            });
        }
        
        // 2. Native API (якщо є quota або unlimited)
        if (this.hasAPIAccess() && this.hasQuota()) {
            strategies.push({
                name: 'native_api',
                priority: strategies.length === 0 ? 1 : 2,
                method: 'trackViaAPI'
            });
        }
        
        // 3. Web Scraping (fallback)
        if (this.scrapingEnabled && this.scraper) {
            strategies.push({
                name: 'web_scraping',
                priority: strategies.length + 1,
                method: 'trackViaScraping'
            });
        }
        
        return strategies.sort((a, b) => a.priority - b.priority);
    }

    /**
     * HYBRID LOGIC: Виконує конкретну стратегію
     */
    async executeStrategy(strategy, trackingNumber, options = {}) {
        const method = this[strategy.method];
        
        if (!method) {
            throw new Error(`Method ${strategy.method} not implemented in ${this.name}`);
        }
        
        return await method.call(this, trackingNumber, options);
    }

    /**
     * HYBRID STRATEGY 1: Cache
     */
    async trackViaCache(trackingNumber, options = {}) {
        if (!this.cacheManager) {
            throw new Error('CacheManager not initialized');
        }
        
        // CacheManager.get() потребує sources array
        const sources = [{ code: this.name }];
        const cached = await this.cacheManager.get(trackingNumber, sources);
        
        if (!cached) {
            throw new Error('Cache miss');
        }
        
        // Перевіряємо freshness
        if (this.isCacheStale(cached)) {
            throw new Error('Cache stale');
        }
        
        console.log(`[${this.name}] Cache hit for ${trackingNumber}`);
        
        return {
            ...cached,
            cached: true,
            source: 'cache'
        };
    }

    /**
     * HYBRID STRATEGY 2: Native API
     * Дочірні класи МАЮТЬ перевизначити цей метод
     */
    async trackViaAPI(trackingNumber, options = {}) {
        throw new Error(`trackViaAPI() must be implemented by ${this.name}Provider`);
    }

    /**
     * HYBRID STRATEGY 3: Web Scraping
     */
    async trackViaScraping(trackingNumber, options = {}) {
        if (!this.scraper) {
            throw new Error(`Scraper not initialized for ${this.name}`);
        }
        
        console.log(`[${this.name}] Starting web scraping for ${trackingNumber}`);
        
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
     * Нормалізація scraped data
     * Дочірні класи можуть перевизначити
     */
    normalizeScrapedData(scrapedData, trackingNumber) {
        return {
            success: true,
            data: {
                trackingNumber,
                carrier: this.name,
                status: scrapedData.status || 'Unknown',
                statusCode: scrapedData.statusCode,
                lastUpdate: scrapedData.lastUpdate || new Date().toISOString(),
                events: scrapedData.events || [],
                estimatedDelivery: scrapedData.estimatedDelivery,
                raw: scrapedData
            },
            provider: this.name,
            cost: 0
        };
    }

    /**
     * QUOTA MANAGEMENT
     */
    hasAPIAccess() {
        return !!this.config?.apiKey || !!process.env[`${this.name.toUpperCase()}_API_KEY`];
    }

    hasQuota() {
        if (!this.quotaManager) return true; // Unlimited
        
        const remaining = this.quotaManager.getLimit(this.name) - 
                         this.quotaManager.quotas.get(this.name) || 0;
        
        return remaining > 0;
    }

    async reserveQuota() {
        if (this.quotaManager) {
            await this.quotaManager.checkAndReserve(this.name);
        }
    }

    async releaseQuota() {
        if (this.quotaManager) {
            await this.quotaManager.releaseReservation(this.name);
        }
    }

    async recordQuotaUsage(cost = 0) {
        if (this.quotaManager) {
            await this.quotaManager.recordUsage(this.name, cost);
        }
    }

    /**
     * CACHE MANAGEMENT
     */
    isCacheStale(cached) {
        if (!cached.timestamp) return true;
        
        const ttl = this.calculateTTL(cached.data?.status);
        const age = Date.now() - cached.timestamp;
        
        return age > ttl * 1000; // TTL в секундах
    }

    async saveToCacheAsync(trackingNumber, data, ttl) {
        if (!this.cacheManager) return;
        
        try {
            // CacheManager очікує result з sources
            await this.cacheManager.set(trackingNumber, {
                ...data,
                sources: [this.name],
                timestamp: Date.now()
            }, ttl);
            
            console.log(`[${this.name}] Cached ${trackingNumber} with TTL ${ttl}s`);
        } catch (error) {
            console.warn(`[${this.name}] Cache save failed:`, error.message);
        }
    }

    calculateTTL(status) {
        const statusLower = (status || '').toLowerCase();
        
        if (statusLower.includes('delivered') || statusLower.includes('доставлен')) {
            return 86400; // 24 години
        }
        
        if (statusLower.includes('transit') || statusLower.includes('в пути')) {
            return 3600; // 1 година
        }
        
        if (statusLower.includes('created') || statusLower.includes('принят')) {
            return 14400; // 4 години
        }
        
        return 7200; // 2 години за замовчуванням
    }

    /**
     * LEGACY METHODS - залишаємо для backward compatibility
     */
    async healthCheck() {
        try {
            return { 
                status: 'ok', 
                provider: this.name, 
                timestamp: new Date().toISOString(),
                features: {
                    api: this.hasAPIAccess(),
                    scraping: this.scrapingEnabled,
                    cache: !!this.cacheManager,
                    quota: !!this.quotaManager
                }
            };
        } catch (error) {
            return { 
                status: 'error', 
                provider: this.name, 
                error: error.message 
            };
        }
    }

    normalizeResponse(data, trackingNumber) {
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: this.name,
                status: data.status || 'Unknown',
                statusCode: data.statusCode,
                lastUpdate: data.lastUpdate || new Date().toISOString(),
                events: data.events || [],
                estimatedDelivery: data.estimatedDelivery,
                raw: data
            },
            provider: this.name,
            cost: this.cost,
            timestamp: new Date().toISOString()
        };
    }

    async makeRequest(url, options = {}) {
        const startTime = Date.now();
        
        const config = {
            method: options.method || 'GET',
            url: url,
            timeout: options.timeout || this.timeout,
            headers: {
                'User-Agent': 'PandaTrack/2.0',
                'Accept': 'application/json',
                ...options.headers
            }
        };

        if (options.params) {
            config.params = options.params;
        }

        if (options.data) {
            config.data = options.data;
        }

        if (config.method === 'POST' && !config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await axios(config);
            response.responseTime = Date.now() - startTime;
            return response;
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            if (error.code === 'ECONNABORTED') {
                throw new Error(`${this.name} API timeout after ${options.timeout || this.timeout}ms`);
            }
            if (error.response) {
                const errorMsg = `${this.name} API error: ${error.response.status} ${error.response.statusText}`;
                const customError = new Error(errorMsg);
                customError.response = error.response;
                customError.responseTime = responseTime;
                throw customError;
            }
            
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

        // Додай в BaseProvider.js після методу makeRequest()

    async makeSimpleRequest(url, headers = {}) {
        const startTime = Date.now();
        
        try {
            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'PandaTrack/2.0',
                    'Accept': 'application/json',
                    ...headers
                }
            });
            
            response.responseTime = Date.now() - startTime;
            return response;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            if (error.code === 'ECONNABORTED') {
                throw new Error(`${this.name} API timeout after ${this.timeout}ms`);
            }
            if (error.response) {
                const errorMsg = `${this.name} API error: ${error.response.status}`;
                const customError = new Error(errorMsg);
                customError.response = error.response;
                customError.responseTime = responseTime;
                throw customError;
            }
            
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    canHandle(trackingNumber, carrierCode = null) {
        return true;
    }

    supportsStage(stage) {
        return this.stages.includes(stage) || this.stages.includes('all');
    }
}

module.exports = BaseProvider;
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
    }

    async track(trackingNumber, options = {}) {
        throw new Error(`track() method must be implemented by ${this.name}Provider`);
    }

    async healthCheck() {
        try {
            return { status: 'ok', provider: this.name, timestamp: new Date().toISOString() };
        } catch (error) {
            return { status: 'error', provider: this.name, error: error.message };
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

    async makeRequest(url, options = {}) {
        const startTime = Date.now();
        
        // ВИПРАВЛЕННЯ: Правильне формування axios config
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

        // ВИПРАВЛЕННЯ: Додаємо params для GET запитів
        if (options.params) {
            config.params = options.params;
        }

        // ВИПРАВЛЕННЯ: Додаємо data для POST запитів
        if (options.data) {
            config.data = options.data;
        }

        // ВИПРАВЛЕННЯ: Встановлюємо Content-Type для POST
        if (config.method === 'POST' && !config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await axios(config);
            
            // Додаємо responseTime для моніторингу
            response.responseTime = Date.now() - startTime;
            
            return response;
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            if (error.code === 'ECONNABORTED') {
                throw new Error(`${this.name} API timeout after ${options.timeout || this.timeout}ms`);
            }
            if (error.response) {
                // Додаємо більше інформації про помилку
                const errorMsg = `${this.name} API error: ${error.response.status} ${error.response.statusText}`;
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

    // НОВИЙ МЕТОД: Спрощений makeRequest для простих GET запитів
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
                const errorMsg = `${this.name} API error: ${error.response.status} ${error.response.statusText}`;
                const customError = new Error(errorMsg);
                customError.response = error.response;
                customError.responseTime = responseTime;
                throw customError;
            }
            
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }
}

module.exports = BaseProvider;
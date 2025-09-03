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
            // Базовий health check - спробувати трекінг з тестовим номером
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
        const config = {
            timeout: this.timeout,
            headers: {
                'User-Agent': 'PandaTrack/1.0',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await axios(url, config);
            return response;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                throw new Error(`${this.name} API timeout after ${this.timeout}ms`);
            }
            if (error.response) {
                throw new Error(`${this.name} API error: ${error.response.status} ${error.response.statusText}`);
            }
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    canHandle(trackingNumber, carrierCode = null) {
        // Override в дочірніх класах для специфічної логіки
        return true;
    }

    supportsStage(stage) {
        return this.stages.includes(stage) || this.stages.includes('all');
    }
}

module.exports = BaseProvider;
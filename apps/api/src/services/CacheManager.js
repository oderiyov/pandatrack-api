// apps/api/src/services/CacheManager.js
const { hashTrackingNumber } = require('../utils/encryption');

class CacheManager {
    constructor(redisClient) {
        this.redis = redisClient;
    }

    generateCacheKey(trackingNumber, sources) {
        const hash = hashTrackingNumber(trackingNumber);
        const sourceCodes = sources.map(s => s.code).sort().join(',');
        return `track:${sourceCodes}:${hash}`;
    }

    async get(trackingNumber, sources) {
        if (!this.redis || !this.redis.isReady) {
            return null;
        }

        try {
            const cacheKey = this.generateCacheKey(trackingNumber, sources);
            const cached = await this.redis.get(cacheKey);
            
            if (cached) {
                const data = JSON.parse(cached);
                return data;
            }
            
            return null;
        } catch (error) {
            console.warn('Cache read error:', error.message);
            return null;
        }
    }

    async set(trackingNumber, result, ttl = 7200) {
        if (!this.redis || !this.redis.isReady) {
            return false;
        }

        try {
            // Генеруємо ключ на основі sources з result
            const sources = result.sources ? result.sources.map(s => ({ code: s })) : [{ code: 'unknown' }];
            const cacheKey = this.generateCacheKey(trackingNumber, sources);
            
            await this.redis.setEx(cacheKey, ttl, JSON.stringify(result));
            return true;
        } catch (error) {
            console.warn('Cache write error:', error.message);
            return false;
        }
    }

    async delete(trackingNumber, sources) {
        if (!this.redis || !this.redis.isReady) {
            return false;
        }

        try {
            const cacheKey = this.generateCacheKey(trackingNumber, sources);
            await this.redis.del(cacheKey);
            return true;
        } catch (error) {
            console.warn('Cache delete error:', error.message);
            return false;
        }
    }

    async healthCheck() {
        if (!this.redis) {
            return { status: 'disabled', reason: 'Redis client not provided' };
        }

        if (!this.redis.isReady) {
            return { status: 'disconnected', reason: 'Redis not connected' };
        }

        try {
            await this.redis.ping();
            return { status: 'ok', provider: 'redis' };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async clearExpired() {
        // Redis автоматично очищує expired keys
        return true;
    }

    async getStats() {
        if (!this.redis || !this.redis.isReady) {
            return null;
        }

        try {
            const info = await this.redis.info('memory');
            return {
                status: 'ok',
                memoryUsage: info,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn('Cache stats error:', error.message);
            return null;
        }
    }
}

module.exports = CacheManager;
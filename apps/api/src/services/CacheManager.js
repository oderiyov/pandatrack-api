// apps/api/src/services/CacheManager.js - ОНОВЛЕНИЙ З МЕТОДАМИ ОЧИЩЕННЯ
const { hashTrackingNumber } = require('../utils/encryption');

class CacheManager {
    constructor(redisClient) {
        this.redis = redisClient;
    }

    generateCacheKey(trackingNumber, sources) {
        const hash = hashTrackingNumber(trackingNumber);
        const sourceCodes = sources.map(s => s.code).sort().join(',');
        return `tracking:${hash}:${sourceCodes}`;
    }

    // ДОДАНО: Простий ключ для backward compatibility
    generateSimpleCacheKey(trackingNumber) {
        const hash = hashTrackingNumber(trackingNumber);
        return `tracking:${hash}`;
    }

    async get(trackingNumber, sources) {
        if (!this.redis || !this.redis.isReady) {
            return null;
        }

        try {
            const cacheKey = this.generateCacheKey(trackingNumber, sources);
            let cached = await this.redis.get(cacheKey);
            
            // ДОДАНО: Fallback до простого ключа якщо не знайдено
            if (!cached) {
                const simpleCacheKey = this.generateSimpleCacheKey(trackingNumber);
                cached = await this.redis.get(simpleCacheKey);
            }
            
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
            
            // ДОДАНО: Також зберігаємо під простим ключем для backward compatibility
            const simpleCacheKey = this.generateSimpleCacheKey(trackingNumber);
            await this.redis.setEx(simpleCacheKey, ttl, JSON.stringify(result));
            
            return true;
        } catch (error) {
            console.warn('Cache write error:', error.message);
            return false;
        }
    }

    async delete(trackingNumber, sources = []) {
        if (!this.redis || !this.redis.isReady) {
            return false;
        }

        try {
            let deletedCount = 0;
            
            // Видаляємо основний ключ якщо є sources
            if (sources.length > 0) {
                const cacheKey = this.generateCacheKey(trackingNumber, sources);
                const deleted = await this.redis.del(cacheKey);
                deletedCount += deleted;
            }
            
            // ДОДАНО: Завжди видаляємо простий ключ
            const simpleCacheKey = this.generateSimpleCacheKey(trackingNumber);
            const simpleDeleted = await this.redis.del(simpleCacheKey);
            deletedCount += simpleDeleted;
            
            return deletedCount > 0;
        } catch (error) {
            console.warn('Cache delete error:', error.message);
            return false;
        }
    }

    // ДОДАНО: Метод для видалення всіх tracking записів
    async clearAllTracking() {
        if (!this.redis || !this.redis.isReady) {
            return false;
        }

        try {
            const keys = await this.redis.keys('tracking:*');
            if (keys.length > 0) {
                await this.redis.del(keys);
                console.log(`Cleared ${keys.length} tracking cache entries`);
                return keys.length;
            }
            return 0;
        } catch (error) {
            console.warn('Cache clear error:', error.message);
            return false;
        }
    }

    // ДОДАНО: Метод для видалення конкретного номера з усіх варіантів
    async clearTrackingNumber(trackingNumber) {
        if (!this.redis || !this.redis.isReady) {
            return false;
        }

        try {
            const hash = hashTrackingNumber(trackingNumber);
            const pattern = `tracking:${hash}*`;
            const keys = await this.redis.keys(pattern);
            
            // Також шукаємо за старим форматом
            const oldPattern = `tracking:${trackingNumber}`;
            const oldKeys = await this.redis.keys(oldPattern);
            
            const allKeys = [...keys, ...oldKeys];
            
            if (allKeys.length > 0) {
                await this.redis.del(allKeys);
                console.log(`Cleared ${allKeys.length} cache entries for ${trackingNumber}`);
                return allKeys.length;
            }
            return 0;
        } catch (error) {
            console.warn('Cache clear tracking number error:', error.message);
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
            const trackingKeys = await this.redis.keys('tracking:*');
            
            return {
                status: 'ok',
                memoryUsage: info,
                trackingCacheCount: trackingKeys.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn('Cache stats error:', error.message);
            return null;
        }
    }
}

module.exports = CacheManager;
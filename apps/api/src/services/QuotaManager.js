// apps/api/src/services/QuotaManager.js
class QuotaManager {
    constructor(redisClient) {
        this.redis = redisClient;
        this.quotas = new Map(); // In-memory fallback
    }

    async initialize() {
        const today = new Date().toISOString().split('T')[0];
        const quotaKey = `quota:${today}`;
        
        if (this.redis && this.redis.isReady) {
            try {
                const quotas = await this.redis.hGetAll(quotaKey);
                
                Object.entries(quotas).forEach(([key, value]) => {
                    this.quotas.set(key, parseInt(value) || 0);
                });
            } catch (error) {
                console.warn('Failed to initialize quotas from Redis:', error.message);
            }
        }
    }

    async checkAndReserve(providerName) {
        // Перевірити чи не перевищена квота
        const used = await this.getUsed(providerName);
        const limit = this.getLimit(providerName);
        
        if (used >= limit) {
            throw new Error(`Daily quota exceeded for ${providerName} (${used}/${limit})`);
        }
        
        // Резервуємо запит (збільшуємо лічильник)
        await this.increment(providerName);
        return true;
    }

    async releaseReservation(providerName) {
        // Якщо запит не вдався, зменшуємо лічильник
        await this.decrement(providerName);
    }

    async recordUsage(providerName, cost = 0) {
        // Записуємо успішне використання
        await this.setUsage(providerName, await this.getUsed(providerName));
        
        if (cost > 0) {
            await this.addCost(providerName, cost);
        }
    }

    async getUsed(providerName) {
        const today = new Date().toISOString().split('T')[0];
        const quotaKey = `quota:${today}`;
        
        if (this.redis && this.redis.isReady) {
            try {
                const used = await this.redis.hGet(quotaKey, providerName);
                return parseInt(used) || 0;
            } catch (error) {
                console.warn('Redis quota read error:', error.message);
            }
        }
        
        return this.quotas.get(providerName) || 0;
    }

    getLimit(providerName) {
        const limits = {
            'ukrposhta': 999999,
            'nova-poshta': 10000,
            'dhl': 250,
            'delivery-auto': 1000,
            'sat': 500,
            'trackingmore': parseInt(process.env.TRACKINGMORE_DAILY_LIMIT) || 100
        };
        
        return limits[providerName] || 100;
    }

    async increment(providerName) {
        const today = new Date().toISOString().split('T')[0];
        const quotaKey = `quota:${today}`;
        
        if (this.redis && this.redis.isReady) {
            try {
                await this.redis.hIncrBy(quotaKey, providerName, 1);
                
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                const secondsUntilMidnight = Math.floor((tomorrow - new Date()) / 1000);
                
                await this.redis.expire(quotaKey, secondsUntilMidnight);
            } catch (error) {
                console.warn('Redis quota increment error:', error.message);
            }
        }
        
        const current = this.quotas.get(providerName) || 0;
        this.quotas.set(providerName, current + 1);
    }

    async decrement(providerName) {
        const today = new Date().toISOString().split('T')[0];
        const quotaKey = `quota:${today}`;
        
        if (this.redis && this.redis.isReady) {
            try {
                await this.redis.hIncrBy(quotaKey, providerName, -1);
            } catch (error) {
                console.warn('Redis quota decrement error:', error.message);
            }
        }
        
        const current = this.quotas.get(providerName) || 0;
        this.quotas.set(providerName, Math.max(0, current - 1));
    }

    async setUsage(providerName, value) {
        const today = new Date().toISOString().split('T')[0];
        const quotaKey = `quota:${today}`;
        
        if (this.redis && this.redis.isReady) {
            try {
                await this.redis.hSet(quotaKey, providerName, value);
            } catch (error) {
                console.warn('Redis quota set error:', error.message);
            }
        }
        
        this.quotas.set(providerName, value);
    }

    async addCost(providerName, cost) {
        const costKey = `cost:${providerName}:${new Date().toISOString().split('T')[0]}`;
        
        if (this.redis && this.redis.isReady) {
            try {
                await this.redis.incrByFloat(costKey, cost);
                await this.redis.expire(costKey, 86400 * 30); // 30 днів
            } catch (error) {
                console.warn('Redis cost tracking error:', error.message);
            }
        }
    }

    async getStatus() {
        const today = new Date().toISOString().split('T')[0];
        const status = {
            date: today,
            providers: {},
            totalCost: 0
        };
        
        const providerNames = ['ukrposhta', 'nova-poshta', 'dhl', 'delivery-auto', 'sat', 'trackingmore'];
        
        for (const provider of providerNames) {
            const used = await this.getUsed(provider);
            const limit = this.getLimit(provider);
            
            status.providers[provider] = {
                used: used,
                limit: limit,
                remaining: Math.max(0, limit - used),
                percentage: Math.round((used / limit) * 100)
            };
        }
        
        return status;
    }

    async resetDaily() {
        this.quotas.clear();
        console.log('Daily quotas reset');
    }
}

module.exports = QuotaManager;
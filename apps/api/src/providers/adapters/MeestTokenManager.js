// apps/api/src/providers/adapters/MeestTokenManager.js

class MeestTokenManager {
    constructor(tokens) {
        if (!Array.isArray(tokens) || tokens.length === 0) {
            throw new Error('MeestTokenManager requires at least one token');
        }

        // Token pools (tier system)
        this.primaryPool = tokens.slice(0, Math.min(3, tokens.length));
        this.secondaryPool = tokens.slice(3, Math.min(6, tokens.length));
        this.reservePool = tokens.slice(6);

        // Token profiles (User-Agent per token)
        this.tokenProfiles = this.assignProfiles(tokens);

        // Usage tracking
        this.tokenUsage = new Map();
        this.tokenHealth = new Map();

        // Configuration
        this.maxRequestsPerHour = 50; // per token
        this.hourWindow = 3600000; // 1 hour in ms
        this.circuitBreakerThreshold = 5; // consecutive failures

        console.log(`✅ Token Manager: ${this.primaryPool.length} primary, ${this.secondaryPool.length} secondary, ${this.reservePool.length} reserve`);
    }

    assignProfiles(tokens) {
        const profiles = new Map();
        
        const variations = [
            { ios: '16.7.12', app: '1.1.7', build: '45', alamofire: '5.9.1' },
            { ios: '15.8.3', app: '1.1.7', build: '45', alamofire: '5.9.1' },
            { ios: '17.0.0', app: '1.1.7', build: '45', alamofire: '5.9.1' },
            { ios: '16.5.0', app: '1.1.6', build: '43', alamofire: '5.8.1' },
            { ios: '17.2.0', app: '1.1.8', build: '46', alamofire: '5.9.1' },
            { ios: '15.7.0', app: '1.1.6', build: '43', alamofire: '5.8.1' },
            { ios: '16.7.0', app: '1.1.7', build: '44', alamofire: '5.9.0' },
            { ios: '17.1.0', app: '1.1.7', build: '45', alamofire: '5.9.1' }
        ];

        tokens.forEach((token, index) => {
            const variation = variations[index % variations.length];
            profiles.set(token, {
                userAgent: `Meest/${variation.app} (ua.meest.com.Meest; build:${variation.build}; iOS ${variation.ios}) Alamofire/${variation.alamofire}`,
                device: `iOS ${variation.ios}`,
                appVersion: variation.app
            });
        });

        return profiles;
    }

    selectToken() {
        const random = Math.random();
        let pool;

        // Weighted selection
        if (random < 0.60 && this.primaryPool.length > 0) {
            pool = this.primaryPool;
        } else if (random < 0.90 && this.secondaryPool.length > 0) {
            pool = this.secondaryPool;
        } else if (this.reservePool.length > 0) {
            pool = this.reservePool;
        } else {
            pool = this.primaryPool; // fallback
        }

        // Random selection from pool
        const availableTokens = pool.filter(token => 
            this.canUseToken(token) && !this.isCircuitOpen(token)
        );

        if (availableTokens.length === 0) {
            // All tokens exhausted/broken - try any available
            console.warn('⚠️ All preferred tokens unavailable, trying fallback');
            const anyAvailable = [...this.primaryPool, ...this.secondaryPool, ...this.reservePool]
                .filter(token => !this.isCircuitOpen(token));
            
            if (anyAvailable.length === 0) {
                throw new Error('All tokens circuit broken or rate limited');
            }
            
            return anyAvailable[0];
        }

        return availableTokens[Math.floor(Math.random() * availableTokens.length)];
    }

    canUseToken(token) {
        const now = Date.now();
        const usage = this.tokenUsage.get(token);

        if (!usage) {
            this.tokenUsage.set(token, { count: 0, windowStart: now });
            return true;
        }

        // Reset window if expired
        if (now - usage.windowStart > this.hourWindow) {
            usage.count = 0;
            usage.windowStart = now;
            return true;
        }

        // Check rate limit
        if (usage.count >= this.maxRequestsPerHour) {
            const resetIn = Math.ceil((usage.windowStart + this.hourWindow - now) / 60000);
            console.warn(`⚠️ Token ${token.substring(0, 8)}... rate limited (resets in ${resetIn}min)`);
            return false;
        }

        return true;
    }

    recordTokenUsage(token) {
        const usage = this.tokenUsage.get(token) || { count: 0, windowStart: Date.now() };
        usage.count++;
        this.tokenUsage.set(token, usage);
    }

    recordTokenResult(token, success, error = null) {
        const health = this.tokenHealth.get(token) || {
            successCount: 0,
            failCount: 0,
            consecutiveFails: 0,
            lastError: null,
            lastUsed: Date.now()
        };

        health.lastUsed = Date.now();

        if (success) {
            health.successCount++;
            health.consecutiveFails = 0;
        } else {
            health.failCount++;
            health.consecutiveFails++;
            health.lastError = error;

            if (health.consecutiveFails >= this.circuitBreakerThreshold) {
                console.error(`🔴 Circuit breaker OPEN for token ${token.substring(0, 8)}... (${health.consecutiveFails} consecutive fails)`);
            }
        }

        this.tokenHealth.set(token, health);
    }

    isCircuitOpen(token) {
        const health = this.tokenHealth.get(token);
        return health && health.consecutiveFails >= this.circuitBreakerThreshold;
    }

    getTokenProfile(token) {
        return this.tokenProfiles.get(token);
    }

    getHealthStats() {
        const stats = {
            primary: this.getPoolStats(this.primaryPool),
            secondary: this.getPoolStats(this.secondaryPool),
            reserve: this.getPoolStats(this.reservePool)
        };
        return stats;
    }

    getPoolStats(pool) {
        return pool.map(token => {
            const usage = this.tokenUsage.get(token) || { count: 0 };
            const health = this.tokenHealth.get(token) || { successCount: 0, failCount: 0, consecutiveFails: 0 };
            return {
                token: token.substring(0, 8) + '...',
                usageThisHour: usage.count,
                successRate: health.successCount / (health.successCount + health.failCount) || 0,
                circuitOpen: this.isCircuitOpen(token)
            };
        });
    }
}

module.exports = MeestTokenManager;
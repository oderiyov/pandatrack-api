// apps/api/src/scrapers/utils/RequestManager.js

const axios = require('axios');

/**
 * Manages HTTP requests з rate limiting та retry logic
 */
class RequestManager {
    constructor(config) {
        this.rateLimit = config.rateLimit || { requests: 10, per: 60000 };
        this.timeout = config.timeout || 30000;
        
        // Rate limiting state
        this.requestTimestamps = [];
        this.retryConfig = {
            maxRetries: 3,
            backoffMultiplier: 2,
            initialDelay: 1000
        };
        
        // Axios instance
        this.axios = axios.create({
            timeout: this.timeout,
            maxRedirects: 5,
            validateStatus: (status) => status < 500
        });
    }

    async waitForSlot() {
        const now = Date.now();
        const windowStart = now - this.rateLimit.per;
        
        // Видаляємо старі timestamps
        this.requestTimestamps = this.requestTimestamps.filter(
            ts => ts > windowStart
        );
        
        // Якщо досягли ліміту - чекаємо
        if (this.requestTimestamps.length >= this.rateLimit.requests) {
            const oldestTimestamp = this.requestTimestamps[0];
            const waitTime = oldestTimestamp + this.rateLimit.per - now;
            
            if (waitTime > 0) {
                console.log(`Rate limit: waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.waitForSlot(); // Recursive check
            }
        }
        
        // Додаємо поточний timestamp
        this.requestTimestamps.push(now);
    }

    async request(options, attempt = 1) {
        try {
            const response = await this.axios(options);
            return response;
            
        } catch (error) {
            // Retry logic
            if (attempt < this.retryConfig.maxRetries) {
                const shouldRetry = this.shouldRetry(error);
                
                if (shouldRetry) {
                    const delay = this.calculateBackoff(attempt);
                    console.log(`Request failed, retry ${attempt}/${this.retryConfig.maxRetries} after ${delay}ms`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.request(options, attempt + 1);
                }
            }
            
            throw error;
        }
    }

    shouldRetry(error) {
        // Network errors - retry
        if (!error.response) return true;
        
        const status = error.response.status;
        
        // Server errors (5xx) - retry
        if (status >= 500) return true;
        
        // Rate limit (429) - retry з backoff
        if (status === 429) return true;
        
        // Timeout - retry
        if (error.code === 'ECONNABORTED') return true;
        
        // Client errors (4xx) - не retry (крім 429)
        return false;
    }

    calculateBackoff(attempt) {
        const delay = this.retryConfig.initialDelay * 
                     Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        
        // Add jitter (±20%)
        const jitter = delay * 0.2 * (Math.random() * 2 - 1);
        
        return Math.round(delay + jitter);
    }

    getRateLimitStatus() {
        const now = Date.now();
        const windowStart = now - this.rateLimit.per;
        
        const recentRequests = this.requestTimestamps.filter(
            ts => ts > windowStart
        ).length;
        
        return {
            limit: this.rateLimit.requests,
            used: recentRequests,
            remaining: Math.max(0, this.rateLimit.requests - recentRequests),
            resetIn: recentRequests > 0 ? 
                (this.requestTimestamps[0] + this.rateLimit.per - now) : 0
        };
    }
}

module.exports = RequestManager;
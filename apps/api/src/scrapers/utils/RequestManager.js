// apps/api/src/scrapers/utils/RequestManager.js

const axios = require('axios');
const ProxyManager = require('./ProxyManager');

class RequestManager {
    constructor(config = {}) {
        this.rateLimit = config.rateLimit || { requests: 10, per: 60000 };
        this.requestTimestamps = [];
        
        this.retryConfig = {
            maxRetries: 3,
            backoffMultiplier: 2,
            initialDelay: 1000
        };
        
        // Initialize proxy manager
        this.proxyManager = new ProxyManager();
        
        // Axios instance
        this.axios = axios.create({
            timeout: config.timeout || 30000,
            maxRedirects: 5,
            validateStatus: (status) => status < 500 // Don't throw on 4xx
        });
    }
    
    /**
     * Wait for available rate limit slot
     */
    async waitForSlot() {
        const now = Date.now();
        const windowStart = now - this.rateLimit.per;
        
        // Remove old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(
            ts => ts > windowStart
        );
        
        // Check if we're at limit
        if (this.requestTimestamps.length >= this.rateLimit.requests) {
            const oldestTimestamp = this.requestTimestamps[0];
            const waitTime = oldestTimestamp + this.rateLimit.per - now;
            
            if (waitTime > 0) {
                console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.waitForSlot(); // Recursive call
            }
        }
        
        // Add current timestamp
        this.requestTimestamps.push(now);
    }
    
    /**
     * Make HTTP request with retry logic and proxy support
     */
    async request(url, options = {}, attempt = 1) {
        // Wait for rate limit
        await this.waitForSlot();
        
        // Get proxy if enabled
        let currentProxy = null;
        if (this.proxyManager.enabled) {
            currentProxy = this.proxyManager.getNext();
            
            if (currentProxy) {
                options.proxy = this.proxyManager.formatForAxios(currentProxy);
                console.log('Proxy config:', JSON.stringify(options.proxy, null, 2));
                console.log(`Using proxy: ${currentProxy.split('@')[1] || currentProxy}`);
            }
        }
        
        try {
            const requestConfig = {
                url,
                method: options.method || 'GET',
                headers: options.headers || {},
                data: options.data,
                params: options.params,
                timeout: options.timeout || this.axios.defaults.timeout
            };

            // Add proxy if exists
            if (options.proxy) {
                requestConfig.proxy = options.proxy;
            }
            
            const response = await this.axios.request(requestConfig);
            
            // Report proxy success
            if (currentProxy) {
                this.proxyManager.reportSuccess(currentProxy);
            }
            
            return response;
            
        } catch (error) {
            // Report proxy failure
            if (currentProxy && this.isProxyError(error)) {
                this.proxyManager.reportFailure(currentProxy);
            }
            
            // Check if should retry
            if (this.shouldRetry(error, attempt)) {
                const delay = this.calculateBackoff(attempt);
                console.log(`Request failed (attempt ${attempt}/${this.retryConfig.maxRetries}). Retrying in ${delay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.request(url, options, attempt + 1);
            }
            
            // Max retries reached or non-retryable error
            throw error;
        }
    }
    
    /**
     * Check if error is proxy-related
     */
    isProxyError(error) {
        const proxyErrors = [
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'ECONNRESET',
            'socket hang up',
            'tunneling socket could not be established'
        ];
        
        return proxyErrors.some(errCode => 
            error.message?.includes(errCode) || 
            error.code === errCode
        );
    }
    
    /**
     * Determine if request should be retried
     */
    shouldRetry(error, attempt) {
        // Check retry count
        if (attempt >= this.retryConfig.maxRetries) {
            return false;
        }
        
        // Retry on network errors
        if (error.code === 'ECONNABORTED' || 
            error.code === 'ETIMEDOUT' ||
            error.code === 'ECONNRESET') {
            return true;
        }
        
        // Retry on 5xx errors
        if (error.response?.status >= 500) {
            return true;
        }
        
        // Retry on 429 (rate limit)
        if (error.response?.status === 429) {
            return true;
        }
        
        // Retry on proxy errors
        if (this.isProxyError(error)) {
            return true;
        }
        
        // Don't retry on 4xx (except 429)
        if (error.response?.status >= 400 && error.response?.status < 500) {
            return false;
        }
        
        return false;
    }
    
    /**
     * Calculate exponential backoff with jitter
     */
    calculateBackoff(attempt) {
        const exponentialDelay = this.retryConfig.initialDelay * 
            Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
        
        // Add jitter (±20%)
        const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
        
        return Math.floor(exponentialDelay + jitter);
    }
    
    /**
     * Get rate limit status
     */
    getRateLimitStatus() {
        const now = Date.now();
        const windowStart = now - this.rateLimit.per;
        const validTimestamps = this.requestTimestamps.filter(ts => ts > windowStart);
        
        return {
            limit: this.rateLimit.requests,
            used: validTimestamps.length,
            remaining: this.rateLimit.requests - validTimestamps.length,
            resetIn: validTimestamps.length > 0 
                ? validTimestamps[0] + this.rateLimit.per - now
                : 0
        };
    }
    
    /**
     * Get proxy statistics
     */
    getProxyStats() {
        return this.proxyManager.getStats();
    }
    
    /**
     * Test proxy connectivity
     */
    async testProxies() {
        return await this.proxyManager.testAll();
    }
}

module.exports = RequestManager;
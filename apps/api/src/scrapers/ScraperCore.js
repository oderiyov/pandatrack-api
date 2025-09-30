// apps/api/src/scrapers/ScraperCore.js

const cheerio = require('cheerio');
const RequestManager = require('./utils/RequestManager');
const UserAgentPool = require('./utils/UserAgentPool');
const HeaderGenerator = require('./utils/HeaderGenerator');
const CaptchaDetector = require('./utils/CaptchaDetector');

/**
 * Base class для всіх scrapers
 * Provides anti-detection, rate limiting, metrics
 */
class ScraperCore {
    constructor(config) {
        this.name = config.name;
        this.baseUrl = config.baseUrl;
        this.timeout = config.timeout || 30000;
        
        this.rateLimit = config.rateLimit || { 
            requests: 10,
            per: 60000
        };
        
        // Dependencies
        this.requestManager = new RequestManager({
            rateLimit: this.rateLimit,
            timeout: this.timeout
        });
        this.userAgentPool = new UserAgentPool();
        this.headerGenerator = new HeaderGenerator();
        this.captchaDetector = new CaptchaDetector();
        
        // Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            blockedRequests: 0,
            captchaEncountered: 0,
            averageResponseTime: 0,
            lastSuccessfulRequest: null,
            lastBlockedRequest: null
        };
        
        console.log(`${this.name} ScraperCore initialized:`, {
            baseUrl: this.baseUrl,
            rateLimit: `${this.rateLimit.requests} req/${this.rateLimit.per}ms`
        });
    }

    async scrape(trackingNumber, options = {}) {
        throw new Error(`${this.name}: scrape() method must be implemented`);
    }

    async makeRequest(url, options = {}) {
        const startTime = Date.now();
        
        try {
            // Rate limiting
            await this.requestManager.waitForSlot();
            
            // Generate headers
            const headers = this.headerGenerator.generate({
                userAgent: this.userAgentPool.getRandom(),
                referer: options.referer || this.baseUrl,
                ...options.headers
            });
            
            // Random delay
            await this.randomDelay(2000, 7000);
            
            console.log(`${this.name}: Making request to ${url}`);
            
            // Execute request
            const response = await this.requestManager.request({
                url: url,
                method: options.method || 'GET',
                headers: headers,
                data: options.data,
                timeout: this.timeout,
                validateStatus: (status) => status < 500
            });
            
            const responseTime = Date.now() - startTime;
            
            // Check for blocking
            const blockingCheck = this.captchaDetector.check(response);
            
            if (blockingCheck.isBlocked) {
                this.metrics.blockedRequests++;
                if (blockingCheck.isCaptcha) {
                    this.metrics.captchaEncountered++;
                }
                this.metrics.lastBlockedRequest = new Date().toISOString();
                
                throw new Error(
                    `Request blocked: ${blockingCheck.reason}. ` +
                    `Type: ${blockingCheck.type || 'unknown'}`
                );
            }
            
            // Update metrics
            this.updateMetrics(true, responseTime);
            
            return response;
            
        } catch (error) {
            this.updateMetrics(false, Date.now() - startTime);
            
            console.error(`${this.name}: Request failed:`, error.message);
            throw error;
        }
    }

    parseHTML(html) {
        return cheerio.load(html, {
            normalizeWhitespace: true,
            decodeEntities: true
        });
    }

    async randomDelay(min, max) {
        const delay = this.gaussianRandom(min, max);
        console.log(`${this.name}: Waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    gaussianRandom(min, max) {
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        
        const mean = (min + max) / 2;
        const stdDev = (max - min) / 6;
        
        let value = Math.round(mean + z * stdDev);
        return Math.max(min, Math.min(max, value));
    }

    updateMetrics(success, responseTime) {
        this.metrics.totalRequests++;
        
        if (success) {
            this.metrics.successfulRequests++;
            this.metrics.lastSuccessfulRequest = new Date().toISOString();
        } else {
            this.metrics.failedRequests++;
        }
        
        // Rolling average
        const alpha = 0.1;
        this.metrics.averageResponseTime = 
            alpha * responseTime + (1 - alpha) * this.metrics.averageResponseTime;
    }

    getSuccessRate() {
        if (this.metrics.totalRequests === 0) return 100;
        return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
    }

    getBlockRate() {
        if (this.metrics.totalRequests === 0) return 0;
        return (this.metrics.blockedRequests / this.metrics.totalRequests) * 100;
    }

    getMetrics() {
        return {
            name: this.name,
            ...this.metrics,
            successRate: `${this.getSuccessRate().toFixed(2)}%`,
            blockRate: `${this.getBlockRate().toFixed(2)}%`,
            averageResponseTime: `${Math.round(this.metrics.averageResponseTime)}ms`
        };
    }

    async healthCheck() {
        try {
            const response = await this.makeRequest(this.baseUrl);
            
            return {
                status: 'ok',
                scraper: this.name,
                baseUrl: this.baseUrl,
                metrics: this.getMetrics(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                scraper: this.name,
                error: error.message,
                metrics: this.getMetrics(),
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = ScraperCore;
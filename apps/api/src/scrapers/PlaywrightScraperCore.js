// apps/api/src/scrapers/PlaywrightScraperCore.js

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());
const ProxyManager = require('./utils/ProxyManager');

/**
 * PlaywrightScraperCore - Base class для browser-based scraping
 * 
 * Використовує Playwright для повної browser emulation:
 * - JavaScript rendering
 * - Cookie handling
 * - Realistic browser fingerprint
 * - Mobile emulation
 * - Anti-detection stealth mode
 */
class PlaywrightScraperCore {
    constructor(config) {
        this.name = config.name;
        this.baseUrl = config.baseUrl;
        this.timeout = config.timeout || 30000;
        
        // Browser config
        this.headless = config.headless !== false; // Default true
        this.browserType = config.browserType || 'chromium';
        this.deviceEmulation = config.deviceEmulation || 'desktop'; // desktop | mobile
        
        // Proxy
        this.useProxies = config.useProxies || false;
        this.proxyManager = this.useProxies ? new ProxyManager() : null;
        
        // Browser pool
        this.browser = null;
        this.context = null;
        
        // Rate limiting
        this.rateLimit = config.rateLimit || {
            requests: 5,
            per: 60000 // 5 req/min (conservative для browser)
        };
        this.requestTimestamps = [];
        
        // Metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            blockedRequests: 0,
            averageResponseTime: 0,
            lastSuccessfulRequest: null,
            lastBlockedRequest: null,
            browserRestarts: 0
        };
        
        console.log(`${this.name} PlaywrightScraperCore initialized:`, {
            baseUrl: this.baseUrl,
            headless: this.headless,
            deviceEmulation: this.deviceEmulation,
            useProxies: this.useProxies,
            rateLimit: `${this.rateLimit.requests} req/${this.rateLimit.per}ms`
        });
    }

    /**
     * Initialize browser with stealth settings
     */
    async initBrowser(options = {}) {
        if (this.browser && this.browser.isConnected()) {
            return; // Browser вже запущений
        }

        console.log(`[${this.name}] Starting Playwright browser...`);
        
        const launchOptions = {
            headless: this.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--disable-blink-features=AutomationControlled'
            ],
            ...options
        };

        // Proxy configuration
        if (this.useProxies && this.proxyManager) {
            const proxy = this.proxyManager.getNext();
            if (proxy) {
                const proxyConfig = this.proxyManager.formatForPlaywright(proxy);
                launchOptions.proxy = proxyConfig;
                console.log(`[${this.name}] Using proxy:`, proxyConfig.server);
            }
        }

        try {
            this.browser = await chromium.launch(launchOptions);
            console.log(`[${this.name}] Browser started successfully`);
        } catch (error) {
            console.error(`[${this.name}] Browser launch failed:`, error.message);
            throw error;
        }
    }

    /**
     * Create browser context with realistic settings
     */
    async createContext(options = {}) {
        if (!this.browser) {
            await this.initBrowser();
        }

        const contextOptions = {
            viewport: this.getViewport(),
            userAgent: this.getUserAgent(),
            locale: 'uk-UA',
            timezoneId: 'Europe/Kiev',
            permissions: [],
            acceptDownloads: false,
            ignoreHTTPSErrors: true,
            ...options
        };

        // Device emulation для mobile
        if (this.deviceEmulation === 'mobile') {
            contextOptions.isMobile = true;
            contextOptions.hasTouch = true;
            contextOptions.deviceScaleFactor = 2;
        }

        this.context = await this.browser.newContext(contextOptions);
        
        // Anti-detection: Override navigator properties
        await this.context.addInitScript(() => {
            // Remove webdriver flag
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            });
            
            // Add realistic plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            
            // Add realistic languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['uk-UA', 'uk', 'en-US', 'en']
            });
        });

        console.log(`[${this.name}] Browser context created`);
        return this.context;
    }

    /**
     * Create new page with anti-detection
     */
    async createPage() {
        if (!this.context) {
            await this.createContext();
        }

        const page = await this.context.newPage();

        // Block domains and resources
        await page.route('**/*', (route) => {
            const url = route.request().url();
            const type = route.request().resourceType();
            
            // Blocked domains
            const blockedDomains = [
                'google-analytics.com',
                'googletagmanager.com',
                'facebook.net',
                'cloudflareinsights.com',
                'claspo.io',
                'webpushs.com',
                'doubleclick.net',
                'googlesyndication.com'
            ];
            
            if (blockedDomains.some(domain => url.includes(domain))) {
                return route.abort();
            }
            
            if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
                return route.abort();
            }
            
            route.continue();
        });
        
        // Set headers (ПІСЛЯ route setup)
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        });

        page.setDefaultTimeout(this.timeout);
        page.setDefaultNavigationTimeout(this.timeout);

        return page;
    }

    /**
     * Navigate to URL with retry logic
     */
    async navigateWithRetry(page, url, options = {}) {
        const maxRetries = options.retries || 2;
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                console.log(`[${this.name}] Navigating to ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);
                
                await page.goto(url, {
                    waitUntil: options.waitUntil || 'domcontentloaded',
                    timeout: this.timeout
                });

                // Wait for network idle (no more than 2 connections for 500ms)
                await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
                    // Ignore timeout - page may still be useful
                });

                return page;

            } catch (error) {
                attempt++;
                
                if (attempt > maxRetries) {
                    throw error;
                }

                console.log(`[${this.name}] Navigation attempt ${attempt} failed, retrying...`);
                await this.delay(2000 * attempt); // Exponential backoff
            }
        }
    }

        /**
     * Wait for Cloudflare challenge to complete
     */
    async waitForCloudflare(page, maxWaitTime = 30000) {
        console.log(`[${this.name}] Checking for Cloudflare challenge...`);
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            const content = await page.content();
            const title = await page.title();
            
            // Check if still on challenge page
            const isChallenge = /just a moment|cloudflare|checking your browser/i.test(content) ||
                            /just a moment|cloudflare/i.test(title);
            
            if (!isChallenge) {
                console.log(`[${this.name}] Cloudflare challenge passed`);
                return true;
            }
            
            console.log(`[${this.name}] Waiting for Cloudflare... (${Math.round((Date.now() - startTime) / 1000)}s)`);
            await this.delay(2000);
        }
        
        throw new Error('Cloudflare challenge timeout');
    }


    /**
     * Check if page is blocked/captcha
     */
    async isPageBlocked(page) {
        const content = await page.content();
        const title = await page.title();
        const url = page.url();

        // Meest-specific blocking patterns
        const blockingPatterns = [
            /captcha/i,
            /robot/i,
            /access denied/i,
            /forbidden/i,
            /cloudflare/i,
            /just a moment/i,
            /проверка/i,
            /перевірка/i
        ];

        const isBlocked = blockingPatterns.some(pattern => 
            pattern.test(content) || 
            pattern.test(title) ||
            pattern.test(url)
        );

        if (isBlocked) {
            this.metrics.blockedRequests++;
            this.metrics.lastBlockedRequest = new Date().toISOString();
            
            console.log(`[${this.name}] Page blocked detected:`, {
                title,
                url,
                hasCloudflare: /cloudflare/i.test(content)
            });
        }

        return isBlocked;
    }

    /**
     * Human-like random delay
     */
    async delay(ms) {
        const jitter = Math.random() * 1000; // Random 0-1s jitter
        const totalDelay = ms + jitter;
        console.log(`[${this.name}] Waiting ${Math.round(totalDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
    }

    /**
     * Rate limiting check
     */
    async checkRateLimit() {
        const now = Date.now();
        
        // Remove old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < this.rateLimit.per
        );

        if (this.requestTimestamps.length >= this.rateLimit.requests) {
            const oldestTimestamp = this.requestTimestamps[0];
            const waitTime = this.rateLimit.per - (now - oldestTimestamp);
            
            if (waitTime > 0) {
                console.log(`[${this.name}] Rate limit reached, waiting ${waitTime}ms...`);
                await this.delay(waitTime);
            }
        }

        this.requestTimestamps.push(now);
    }

    /**
     * Get realistic viewport based on device
     */
    getViewport() {
        if (this.deviceEmulation === 'mobile') {
            return {
                width: 375,
                height: 812
            };
        }
        
        return {
            width: 1920,
            height: 1080
        };
    }

    /**
     * Get realistic user agent
     */
    getUserAgent() {
        if (this.deviceEmulation === 'mobile') {
            return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
        }
        
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    /**
     * Update metrics
     */
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

    /**
     * Get success rate
     */
    getSuccessRate() {
        if (this.metrics.totalRequests === 0) return 100;
        return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            name: this.name,
            ...this.metrics,
            successRate: `${this.getSuccessRate().toFixed(2)}%`,
            averageResponseTime: `${Math.round(this.metrics.averageResponseTime)}ms`
        };
    }

    /**
     * Cleanup browser resources
     */
    async close() {
        console.log(`[${this.name}] Closing browser...`);
        
        if (this.context) {
            await this.context.close().catch(err => 
                console.warn(`Context close error:`, err.message)
            );
            this.context = null;
        }
        
        if (this.browser) {
            await this.browser.close().catch(err => 
                console.warn(`Browser close error:`, err.message)
            );
            this.browser = null;
        }
    }

    /**
     * Restart browser (for recovery from errors)
     */
    async restart() {
        console.log(`[${this.name}] Restarting browser...`);
        await this.close();
        this.metrics.browserRestarts++;
        await this.delay(3000); // Wait before restart
        await this.initBrowser();
        await this.createContext();
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.initBrowser();
            const page = await this.createPage();
            
            await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
            const isBlocked = await this.isPageBlocked(page);
            
            await page.close();
            
            return {
                status: isBlocked ? 'blocked' : 'ok',
                scraper: this.name,
                browser: 'chromium',
                headless: this.headless,
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
        } finally {
            await this.close();
        }
    }
}

module.exports = PlaywrightScraperCore;
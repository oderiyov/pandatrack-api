// apps/api/src/scrapers/utils/ProxyManager.js

class ProxyManager {
    constructor(config = {}) {
        this.enabled = process.env.USE_PROXIES === 'true';
        this.proxyList = this.loadProxyList();
        this.currentIndex = 0;
        this.failedProxies = new Map(); // Track failed proxies
        this.cleanupInterval = 300000; // 5 minutes
        
        // Rotating settings
        this.rotateOnEachRequest = process.env.PROXY_ROTATE_EACH_REQUEST === 'true';
        
        // Start cleanup interval
        if (this.enabled) {
            this.startCleanup();
        }
    }
    
    loadProxyList() {
        const proxyString = process.env.PROXY_LIST || '';
        
        if (!proxyString) {
            return [];
        }
        
        // Format: http://user:pass@host:port,http://user:pass@host:port,...
        return proxyString.split(',').map(p => p.trim()).filter(p => p);
    }
    
    /**
     * Get next proxy with round-robin rotation
     */
    getNext() {
        if (!this.enabled || this.proxyList.length === 0) {
            return null;
        }
        
        // Find healthy proxy
        let attempts = 0;
        const maxAttempts = this.proxyList.length;
        
        while (attempts < maxAttempts) {
            const proxy = this.proxyList[this.currentIndex];
            
            // Move to next
            this.currentIndex = (this.currentIndex + 1) % this.proxyList.length;
            
            // Check if proxy is not failed recently
            const failCount = this.failedProxies.get(proxy) || 0;
            if (failCount < 3) { // Allow 3 failures before skipping
                return proxy;
            }
            
            attempts++;
        }
        
        // All proxies failed - reset and return first
        this.failedProxies.clear();
        return this.proxyList[0];
    }
    
    /**
     * Format proxy for axios
     */
    formatForAxios(proxyUrl) {
        if (!proxyUrl) return null;
        
        try {
            const url = new URL(proxyUrl);
            
            return {
                host: url.hostname,
                port: parseInt(url.port) || 80,
                auth: url.username && url.password ? {
                    username: url.username,
                    password: url.password
                } : undefined,
                protocol: url.protocol.replace(':', '')
            };
        } catch (error) {
            console.error('Invalid proxy URL:', proxyUrl);
            return null;
        }
    }
    
    /**
     * Format proxy for Puppeteer
     */
    formatForPuppeteer(proxyUrl) {
        if (!proxyUrl) return null;
        
        try {
            const url = new URL(proxyUrl);
            // Puppeteer format: http://host:port
            return `${url.protocol}//${url.hostname}:${url.port}`;
        } catch (error) {
            console.error('Invalid proxy URL:', proxyUrl);
            return null;
        }
    }
    
    /**
     * Format proxy for Playwright
     */
    formatForPlaywright(proxyUrl) {
        if (!proxyUrl) return null;
        
        try {
            const url = new URL(proxyUrl);
            
            return {
                server: `${url.protocol}//${url.hostname}:${url.port}`,
                username: url.username || undefined,
                password: url.password || undefined
            };
        } catch (error) {
            console.error('Invalid proxy URL:', proxyUrl);
            return null;
        }
    }

        /**
     * Switch to next proxy immediately after failure
     */
    switchAfterFailure(failedProxy) {
        this.reportFailure(failedProxy);
        
        // Mark as temporary blacklist
        const blacklistUntil = Date.now() + 60000; // 1 minute
        this.failedProxies.set(failedProxy, { count: 999, until: blacklistUntil });
        
        console.log(`Proxy ${failedProxy} blacklisted for 1 minute`);
        
        return this.getNext(); // Return fresh proxy
    }

    /**
     * Report proxy failure
     */
    reportFailure(proxyUrl) {
        if (!proxyUrl) return;
        
        const currentCount = this.failedProxies.get(proxyUrl) || 0;
        this.failedProxies.set(proxyUrl, currentCount + 1);
        
        console.log(`Proxy failure reported: ${proxyUrl} (${currentCount + 1} failures)`);
    }
    
    /**
     * Report proxy success
     */
    reportSuccess(proxyUrl) {
        if (!proxyUrl) return;
        
        // Reset failure count on success
        this.failedProxies.delete(proxyUrl);
    }
    
    /**
     * Cleanup old failure records
     */
    startCleanup() {
        setInterval(() => {
            // Reset failures every 5 minutes
            this.failedProxies.clear();
            console.log('ProxyManager: Failure records cleared');
        }, this.cleanupInterval);
    }
    
    /**
     * Get proxy statistics
     */
    getStats() {
        return {
            enabled: this.enabled,
            totalProxies: this.proxyList.length,
            failedProxies: this.failedProxies.size,
            currentIndex: this.currentIndex,
            rotationEnabled: this.rotateOnEachRequest
        };
    }
    
    /**
     * Test proxy connectivity
     */
    async testProxy(proxyUrl) {
        const axios = require('axios');
        
        try {
            const proxyConfig = this.formatForAxios(proxyUrl);
            
            const response = await axios.get('https://httpbin.org/ip', {
                proxy: proxyConfig,
                timeout: 10000
            });
            
            return {
                working: true,
                ip: response.data.origin,
                proxy: proxyUrl
            };
        } catch (error) {
            return {
                working: false,
                error: error.message,
                proxy: proxyUrl
            };
        }
    }
    
    /**
     * Test all proxies
     */
    async testAll() {
        console.log('Testing all proxies...');
        
        const results = await Promise.all(
            this.proxyList.map(proxy => this.testProxy(proxy))
        );
        
        const working = results.filter(r => r.working);
        const failed = results.filter(r => !r.working);
        
        console.log(`Working: ${working.length}/${this.proxyList.length}`);
        
        return {
            total: this.proxyList.length,
            working: working.length,
            failed: failed.length,
            results
        };
    }
}

module.exports = ProxyManager;
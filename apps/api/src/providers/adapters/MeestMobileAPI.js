// apps/api/src/providers/adapters/MeestMobileAPI.js

const axios = require('axios');
const MeestTokenManager = require('./MeestTokenManager');
const RequestQueue = require('../../utils/RequestQueue');

class MeestMobileAPI {
    constructor(config = {}) {
        this.baseURL = process.env.MEEST_MOBILE_API_URL || 'https://api.meest.com/v3.0/app';
        
        // Parse tokens from env
        const tokensStr = process.env.MEEST_AUTH_TOKENS || '';
        const tokens = tokensStr.split(',').map(t => t.trim()).filter(t => t);
        
        if (tokens.length === 0) {
            throw new Error('MEEST_AUTH_TOKENS not configured');
        }
        
        // Initialize token manager
        this.tokenManager = new MeestTokenManager(tokens);
        
        // Initialize request queue (anti-burst)
        this.requestQueue = new RequestQueue({
            meanDelay: 3000,      // 3s average
            stdDeviation: 1000,   // ±1s variance
            minDelay: 1000        // minimum 1s
        });
        
        // Stats
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0
        };
        
        console.log(`✅ Meest Mobile API v3.0 initialized with ${tokens.length} tokens`);
    }

    async track(trackingNumber) {
        this.stats.totalRequests++;
        const startTime = Date.now();
        
        // Select token (weighted random + rate limiting)
        let token;
        try {
            token = this.tokenManager.selectToken();
        } catch (error) {
            console.error('❌ No available tokens:', error.message);
            throw new Error('All Meest tokens exhausted or circuit broken');
        }
        
        // Record token usage
        this.tokenManager.recordTokenUsage(token);
        
        // Queue request (anti-burst)
        const result = await this.requestQueue.add(async () => {
            return await this.makeRequest(token, trackingNumber);
        });
        
        // Update stats
        const responseTime = Date.now() - startTime;
        this.updateStats(result.success, responseTime);
        
        // Record token health
        this.tokenManager.recordTokenResult(token, result.success, result.error);
        
        return result;
    }

    async makeRequest(token, trackingNumber) {
        const profile = this.tokenManager.getTokenProfile(token);
        
        try {
            const response = await axios.get(
                `${this.baseURL}/trackAPP/${trackingNumber}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Localization': 'ua',
                        'token': token,
                        'User-Agent': profile.userAgent,
                        'Accept': '*/*',
                        'Accept-Language': 'uk-UA,uk;q=0.9,en-UA;q=0.8'
                    },
                    timeout: 15000
                }
            );

            // Validate response
            if (!response.data || response.data.status !== 'OK') {
                throw new Error(`API returned status: ${response.data?.status || 'unknown'}`);
            }

            return {
                success: true,
                data: this.normalizeResponse(response.data, trackingNumber),
                source: 'mobile_api_v3',
                token: token.substring(0, 8) + '...'
            };

        } catch (error) {
            console.error('Meest Mobile API error:', error.message);
            
            return {
                success: false,
                error: error.message,
                token: token.substring(0, 8) + '...'
            };
        }
    }

    normalizeResponse(data, trackingNumber) {
        const events = (data.result || []).map(event => ({
            date: event.eventDateTime,
            location: [event.city, event.country].filter(Boolean).join(', '),
            status: event.messages,
            description: event.messageDetails || event.messages,
            statusCode: this.mapAppCode(event.appCode),
            originalStatus: event.messages
        }));

        // Reverse - newest first
        events.reverse();

        // Determine final status from latest event
        const latestEvent = events[0];
        const finalStatus = latestEvent ? latestEvent.statusCode : 'transit';

        return {
            trackingNumber,
            carrier: 'Meest Express',
            status: finalStatus,
            lastUpdate: latestEvent?.date || new Date().toISOString(),
            events,
            estimatedDelivery: null,
            raw: data
        };
    }

    mapAppCode(appCode) {
        const mapping = {
            0: 'transit',
            1: 'processing',
            2: 'ready',
            3: 'delivered'
        };
        return mapping[appCode] || 'transit';
    }

    updateStats(success, responseTime) {
        if (success) {
            this.stats.successfulRequests++;
        } else {
            this.stats.failedRequests++;
        }
        
        // Update rolling average
        const totalCompleted = this.stats.successfulRequests + this.stats.failedRequests;
        this.stats.averageResponseTime = 
            (this.stats.averageResponseTime * (totalCompleted - 1) + responseTime) / totalCompleted;
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRequests > 0 
                ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
                : 'N/A',
            queueLength: this.requestQueue.getQueueLength(),
            tokenHealth: this.tokenManager.getHealthStats()
        };
    }

    async healthCheck() {
        const stats = this.getStats();
        return {
            status: 'ok',
            provider: 'meest_mobile_api_v3',
            ...stats,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = MeestMobileAPI;
// apps/api/src/scrapers/adapters/DHLScraper.js

const ScraperCore = require('../ScraperCore');

class DHLScraper extends ScraperCore {
    constructor(config = {}) {
        super({
            name: 'DHLScraper',
            baseUrl: 'https://www.dhl.com',
            timeout: config.timeout || 15000,
            rateLimit: config.rateLimit || { requests: 10, per: 60000 }
        });
        
        this.apiBaseUrl = 'https://www.dhl.com/utapi';
        this.euApiBaseUrl = 'https://api-eu.dhl.com/track/shipments';
    }

    /**
     * Main scraping method using DHL's public API
     */
    async scrape(trackingNumber, options = {}) {
        const startTime = Date.now();
        
        try {
            // Random delay before request (anti-detection)
            await this.randomDelay(2000, 5000);
            
            // Build API URL
            const apiUrl = this.buildApiUrl(trackingNumber, options);
            
            console.log(`${this.name}: Fetching ${apiUrl}`);
            
            // Make request to public API
            const response = await this.makeRequest(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Referer': 'https://www.dhl.com/ua-en/home/tracking.html',
                    'Origin': 'https://www.dhl.com'
                }
            });
            
            // Check if blocked
            const captchaCheck = this.captchaDetector.check(response);
            if (captchaCheck.isBlocked) {
                throw new Error(`Blocked: ${captchaCheck.reason}`);
            }
            
            // Parse JSON response
            const data = typeof response.data === 'string' 
                ? JSON.parse(response.data) 
                : response.data;
            
            // Extract tracking data
            const trackingData = this.extractTrackingData(data, trackingNumber);
            
            // Update metrics
            this.updateMetrics(true, Date.now() - startTime);
            
            return {
                success: true,
                ...trackingData,
                url: apiUrl,
                scrapedAt: new Date().toISOString(),
                responseTime: Date.now() - startTime
            };
            
        } catch (error) {
            this.updateMetrics(false, Date.now() - startTime);
            
            console.error(`${this.name} error:`, error.message);
            
            return {
                success: false,
                error: error.message,
                trackingNumber,
                scrapedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Build API URL with parameters
     */
    buildApiUrl(trackingNumber, options = {}) {
        const params = new URLSearchParams({
            trackingNumber: trackingNumber,
            language: options.language || 'en',
            requesterCountryCode: options.countryCode || 'UA',
            source: 'tt'
        });
        
        return `${this.apiBaseUrl}?${params.toString()}`;
    }

    /**
     * Extract tracking data from API response
     */
    extractTrackingData(data, trackingNumber) {
        // Check if shipments exist
        if (!data.shipments || data.shipments.length === 0) {
            throw new Error('No shipments found in response');
        }
        
        const shipment = data.shipments[0];
        
        // Extract basic info
        const result = {
            trackingNumber: shipment.id || trackingNumber,
            service: this.mapService(shipment.service),
            division: shipment.division,
            status: shipment.status?.status || 'unknown',
            statusCode: shipment.status?.statusCode,
            description: shipment.status?.description,
        };
        
        // Extract origin/destination
        if (shipment.origin) {
            result.origin = this.formatLocation(shipment.origin.address);
        }
        
        if (shipment.destination) {
            result.destination = this.formatLocation(shipment.destination.address);
        }
        
        // Extract delivery info
        if (shipment.details) {
            result.weight = shipment.details.weight;
            result.dimensions = shipment.details.dimensions;
            result.pieces = shipment.details.totalNumberOfPieces;
        }
        
        // Extract estimated delivery
        if (shipment.estimatedTimeOfDelivery) {
            result.estimatedDelivery = shipment.estimatedTimeOfDelivery;
        }
        
        // Extract events
        result.events = this.extractEvents(shipment.events || []);
        
        // Add API URLs for reference
        if (data.url) {
            result.apiUrl = data.url;
        }
        
        return result;
    }

    /**
     * Extract and normalize events
     */
    extractEvents(events) {
        if (!events || events.length === 0) {
            return [];
        }
        
        return events.map(event => ({
            timestamp: event.timestamp,
            date: new Date(event.timestamp).toISOString(),
            status: event.description || event.statusCode,
            statusCode: event.statusCode,
            location: this.formatLocation(event.location?.address),
            description: event.description,
            // Additional fields
            pieceId: event.pieceIds?.[0],
            remark: event.remark
        })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // Oldest first
    }

    /**
     * Format location from address object
     */
    formatLocation(address) {
        if (!address) return null;
        
        const parts = [];
        
        if (address.addressLocality) parts.push(address.addressLocality);
        if (address.countryCode) parts.push(address.countryCode);
        
        return parts.join(', ') || null;
    }

    /**
     * Map service codes to readable names
     */
    mapService(serviceCode) {
        const serviceMap = {
            'express': 'DHL Express',
            'parcel-uk': 'DHL Parcel UK',
            'parcel-de': 'DHL Parcel Germany',
            'ecommerce': 'DHL eCommerce',
            'freight': 'DHL Freight',
            'global-mail': 'DHL Global Mail'
        };
        
        return serviceMap[serviceCode] || serviceCode || 'DHL';
    }

    /**
     * Health check - test if API is accessible
     */
    async healthCheck() {
        try {
            // Test with a known tracking number
            const testNumber = '60120213284055';
            const result = await this.scrape(testNumber, { skipDelay: true });
            
            return {
                healthy: result.success,
                metrics: this.getMetrics(),
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }
}

module.exports = DHLScraper;
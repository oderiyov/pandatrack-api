// apps/api/src/providers/TrackingMoreProvider.js
const BaseProvider = require('./BaseProvider');

class TrackingMoreProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.TRACKINGMORE_API_KEY;
        
        if (!this.apiKey) {
            throw new Error('TrackingMore API key not found in environment variables');
        }
    }

    async track(trackingNumber, carrierCode = null, options = {}) {
        try {
            let endpoint;
            if (carrierCode && carrierCode !== 'auto-detect-numeric' && carrierCode !== 'unknown') {
                endpoint = `https://api.trackingmore.com/v3/trackings/${carrierCode}/${trackingNumber}`;
            } else {
                endpoint = `https://api.trackingmore.com/v3/trackings/detect/${trackingNumber}`;
            }

            const response = await this.makeRequest(endpoint, {
                method: 'GET',
                headers: {
                    'Tracking-Api-Key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.code === 200 && response.data.data) {
                return this.normalizeTrackingMoreResponse(response.data.data, trackingNumber);
            }

            return {
                success: false,
                error: response.data.message || 'Tracking number not found',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    normalizeTrackingMoreResponse(data, trackingNumber) {
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: data.carrier_code || 'unknown',
                status: data.delivery_status || 'Unknown',
                statusCode: data.status_code,
                lastUpdate: new Date().toISOString(),
                events: data.origin_info?.trackinfo || [],
                estimatedDelivery: data.scheduled_delivery_date,
                raw: data
            },
            provider: this.name,
            cost: this.cost, // $0.019 per request
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        // TrackingMore може обробляти майже будь-які номери
        return trackingNumber && trackingNumber.length >= 8;
    }

    async healthCheck() {
        try {
            const response = await this.makeRequest('https://api.trackingmore.com/v3/trackings/detect/test123456789', {
                method: 'GET',
                headers: {
                    'Tracking-Api-Key': this.apiKey
                }
            });
            
            return {
                status: response.status < 500 ? 'ok' : 'error',
                provider: this.name,
                apiKeyValid: !!this.apiKey,
                responseCode: response.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                provider: this.name,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = TrackingMoreProvider;
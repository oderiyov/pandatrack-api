// apps/api/src/providers/DHLProvider.js
const BaseProvider = require('./BaseProvider');

class DHLProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.DHL_API_KEY;
        this.apiSecret = process.env.DHL_API_SECRET;
        
        if (!this.apiKey || !this.apiSecret) {
            console.warn('DHL API credentials not found in environment variables');
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            const response = await this.makeRequest(
                'https://api-eu.dhl.com/track/shipments',
                {
                    method: 'GET',
                    params: {
                        trackingNumber: trackingNumber
                    },
                    headers: {
                        'DHL-API-Key': this.apiKey,
                        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.shipments && response.data.shipments.length > 0) {
                const shipment = response.data.shipments[0];
                return this.normalizeDHLResponse(shipment, trackingNumber);
            }

            return {
                success: false,
                error: 'DHL tracking number not found',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    normalizeDHLResponse(shipment, trackingNumber) {
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'dhl',
                status: shipment.status?.description || 'Unknown',
                statusCode: shipment.status?.statusCode,
                lastUpdate: shipment.status?.timestamp || new Date().toISOString(),
                events: shipment.events?.map(event => ({
                    date: event.timestamp,
                    status: event.description,
                    location: event.location?.address?.addressLocality || '',
                    description: event.description
                })) || [],
                estimatedDelivery: shipment.estimatedTimeOfDelivery,
                raw: shipment
            },
            provider: this.name,
            cost: 0, // 250 безкоштовних запитів/день
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().replace(/\s/g, '');
        
        // DHL формати
        if (/^\d{10}$/.test(number)) return true;
        if (/^\d{11}$/.test(number)) return true;
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) return true;
        if (/^JD\d{18}$/.test(number)) return true;
        if (/^\d{12}$/.test(number)) return true; // Може конфліктувати з іншими
        
        return false;
    }

    async healthCheck() {
        if (!this.apiKey || !this.apiSecret) {
            return {
                status: 'error',
                provider: this.name,
                error: 'API credentials missing',
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Тестовий запит до DHL API
            const response = await this.makeRequest(
                'https://api-eu.dhl.com/track/shipments',
                {
                    method: 'GET',
                    params: { trackingNumber: '00340434161536070000' }, // DHL test number
                    headers: {
                        'DHL-API-Key': this.apiKey,
                        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`
                    }
                }
            );
            
            return {
                status: response.status < 500 ? 'ok' : 'error',
                provider: this.name,
                apiKeyValid: !!this.apiKey,
                quotaRemaining: 250, // DHL дає 250/день
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

module.exports = DHLProvider;
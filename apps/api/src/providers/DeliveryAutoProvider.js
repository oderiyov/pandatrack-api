// apps/api/src/providers/DeliveryAutoProvider.js
const BaseProvider = require('./BaseProvider');

class DeliveryAutoProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.publicKey = process.env.DELIVERY_AUTO_PUBLIC_KEY;
        this.secretKey = process.env.DELIVERY_AUTO_SECRET_KEY;
        
        if (!this.publicKey || !this.secretKey) {
            console.warn('Delivery Auto API credentials not found in environment variables');
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            const response = await this.makeRequest(
                'https://www.delivery-auto.com/api/track',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.secretKey}`
                    },
                    data: {
                        public_key: this.publicKey,
                        tracking_number: trackingNumber
                    }
                }
            );

            if (response.data.success && response.data.data) {
                return this.normalizeDeliveryAutoResponse(response.data.data, trackingNumber);
            }

            return {
                success: false,
                error: response.data.message || 'Delivery Auto tracking not found',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    normalizeDeliveryAutoResponse(data, trackingNumber) {
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'delivery-auto',
                status: data.status || 'Unknown',
                statusCode: data.status_code,
                lastUpdate: data.last_update || new Date().toISOString(),
                events: data.events?.map(event => ({
                    date: event.date,
                    status: event.status,
                    location: event.location || '',
                    description: event.description || event.status
                })) || [],
                estimatedDelivery: data.estimated_delivery,
                raw: data
            },
            provider: this.name,
            cost: 0, // Припущення що безкоштовно
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Delivery Auto формати (українська служба)
        if (/^DA\d{8,12}$/.test(number)) return true;
        if (/^\d{8,10}DA$/.test(number)) return true;
        if (/^DELIVERY\d{6,10}$/.test(number)) return true;
        if (/^DLV\d{8,12}$/.test(number)) return true;
        
        return false;
    }

    async healthCheck() {
        if (!this.publicKey || !this.secretKey) {
            return {
                status: 'error',
                provider: this.name,
                error: 'API credentials missing',
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Тестовий запит до Delivery Auto API
            const response = await this.makeRequest(
                'https://www.delivery-auto.com/api/status',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.secretKey}`
                    }
                }
            );
            
            return {
                status: response.status === 200 ? 'ok' : 'error',
                provider: this.name,
                credentialsValid: !!(this.publicKey && this.secretKey),
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

module.exports = DeliveryAutoProvider;
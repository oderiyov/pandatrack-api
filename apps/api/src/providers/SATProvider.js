// apps/api/src/providers/SATProvider.js
const BaseProvider = require('./BaseProvider');

class SATProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.SAT_API_KEY;
        this.baseUrl = process.env.SAT_BASE_URL_PROD || process.env.SAT_BASE_URL_TEST || 'http://urm.sat.ua/study/hs/api/v1.0';
        
        if (!this.apiKey) {
            console.warn('SAT API key not found in environment variables');
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            const response = await this.makeRequest(
                `${this.baseUrl}/tracking/${trackingNumber}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `ApiKey ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success !== false && response.data.tracking) {
                return this.normalizeSATResponse(response.data.tracking, trackingNumber);
            }

            return {
                success: false,
                error: response.data.message || 'SAT tracking number not found',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    normalizeSATResponse(data, trackingNumber) {
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'sat',
                status: data.status || 'Unknown',
                statusCode: data.status_code,
                lastUpdate: data.last_update || new Date().toISOString(),
                events: data.history?.map(event => ({
                    date: event.date,
                    status: event.status,
                    location: event.office || event.location || '',
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
        
        // SAT (Satellite Express) формати
        if (/^SAT\d{8,12}$/.test(number)) return true;
        if (/^ST\d{10,12}$/.test(number)) return true;
        if (/^SATELLITE\d{6,10}$/.test(number)) return true;
        
        return false;
    }

    async healthCheck() {
        if (!this.apiKey) {
            return {
                status: 'error',
                provider: this.name,
                error: 'API key missing',
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Тестовий запит до SAT API
            const response = await this.makeRequest(
                `${this.baseUrl}/ping`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `ApiKey ${this.apiKey}`
                    }
                }
            );
            
            return {
                status: response.status === 200 ? 'ok' : 'error',
                provider: this.name,
                apiKeyValid: !!this.apiKey,
                baseUrl: this.baseUrl,
                responseCode: response.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                provider: this.name,
                error: error.message,
                baseUrl: this.baseUrl,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = SATProvider;
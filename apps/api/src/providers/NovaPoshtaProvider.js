// apps/api/src/providers/NovaPoshtaProvider.js
const BaseProvider = require('./BaseProvider');

class NovaPoshtaProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.NOVAPOSHTA_API_KEY;
        
        if (!this.apiKey) {
            console.warn('Nova Poshta API key not found in environment variables');
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            const response = await this.makeRequest('https://api.novaposhta.ua/v2.0/json/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    apiKey: this.apiKey,
                    modelName: "TrackingDocument",
                    calledMethod: "getStatusDocuments",
                    methodProperties: {
                        Documents: [{
                            DocumentNumber: trackingNumber,
                            Phone: ""
                        }]
                    }
                }
            });

            if (response.data.success && response.data.data.length > 0) {
                const tracking = response.data.data[0];
                return this.normalizeNovaPoshtaResponse(tracking, trackingNumber);
            }

            return {
                success: false,
                error: 'Nova Poshta tracking number not found',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    normalizeNovaPoshtaResponse(data, trackingNumber) {
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'nova-poshta',
                status: data.Status || 'Unknown',
                statusCode: data.StatusCode,
                lastUpdate: data.DateCreated || new Date().toISOString(),
                events: [{
                    date: data.DateCreated,
                    status: data.Status,
                    location: data.CitySender || '',
                    description: data.Status
                }],
                estimatedDelivery: null,
                raw: data
            },
            provider: this.name,
            cost: 0,
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim();
        return /^20\d{12}$/.test(number) || /^59\d{12}$/.test(number);
    }
}

module.exports = NovaPoshtaProvider;
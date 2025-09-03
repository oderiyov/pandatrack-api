// apps/api/src/providers/UkrposhtaProvider.js
const BaseProvider = require('./BaseProvider');

class UkrposhtaProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.bearer = process.env.UKRPOSHTA_STATUS_BEARER;
        this.token = process.env.UKRPOSHTA_TOKEN;
        this.contragentUuid = process.env.UKRPOSHTA_CONTRAGENT_UUID;
        
        if (!this.bearer || !this.token) {
            throw new Error('Ukrposhta credentials not found in environment variables');
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            const response = await this.makeRequest(
                `https://www.ukrposhta.ua/status-tracking/0.0.1/statuses/${trackingNumber}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.bearer}`,
                        'token': this.token,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.statuses) {
                return this.normalizeUkrposhtaResponse(response.data, trackingNumber);
            }

            return {
                success: false,
                error: 'Ukrposhta tracking number not found',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    async trackBulk(trackingNumbers) {
        try {
            // Перевірити в документації чи підтримується bulk endpoint
            const response = await this.makeRequest(
                'https://www.ukrposhta.ua/status-tracking/0.0.1/statuses/bulk',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.bearer}`,
                        'token': this.token,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        tracking_numbers: trackingNumbers
                    }
                }
            );

            // Обробити bulk відповідь
            return trackingNumbers.map(number => {
                const numberData = response.data[number];
                if (numberData && numberData.statuses) {
                    return this.normalizeUkrposhtaResponse(numberData, number);
                }
                return {
                    success: false,
                    error: 'Not found in bulk response',
                    provider: this.name,
                    trackingNumber: number
                };
            });

        } catch (error) {
            // Fallback до індивідуальних запитів
            console.warn('Bulk request failed, falling back to individual requests:', error.message);
            return await Promise.allSettled(
                trackingNumbers.map(number => this.track(number))
            );
        }
    }

    normalizeUkrposhtaResponse(data, trackingNumber) {
        const latestStatus = data.statuses && data.statuses[0];
        
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'ukrposhta',
                status: latestStatus?.name || 'Unknown',
                statusCode: latestStatus?.code,
                lastUpdate: latestStatus?.date || new Date().toISOString(),
                events: data.statuses?.map(status => ({
                    date: status.date,
                    status: status.name,
                    location: status.office_name || status.address || '',
                    description: status.description || '',
                    statusCode: status.code
                })) || [],
                estimatedDelivery: data.estimated_delivery,
                // Міжнародні дані якщо є
                internationalEvents: data.international_statuses || [],
                raw: data
            },
            provider: this.name,
            cost: 0, // Безкоштовно
            supportsInternational: true,
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Українські внутрішні номери
        if (/^[0-9]{14}$/.test(number)) return true;
        
        // Міжнародні UPU формати що закінчуються на UA
        if (/^[A-Z]{2}\d{9}UA$/.test(number)) return true;
        
        // Міжнародні формати (через UPU Global Track & Trace)
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) return true;
        
        // Експрес форми
        if (/^EM\d{9}UA$/.test(number)) return true;
        if (/^CP\d{9}UA$/.test(number)) return true;
        if (/^RG\d{9}UA$/.test(number)) return true;
        
        return false;
    }

    async healthCheck() {
        try {
            // Тестовий запит до API
            const response = await this.makeRequest(
                'https://www.ukrposhta.ua/status-tracking/0.0.1/ping',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.bearer}`,
                        'token': this.token
                    }
                }
            );
            
            return {
                status: 'ok',
                provider: this.name,
                bearerValid: !!this.bearer,
                tokenValid: !!this.token,
                apiResponse: response.status === 200,
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

module.exports = UkrposhtaProvider;
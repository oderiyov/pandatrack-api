const BaseProvider = require('./BaseProvider');

class UkrposhtaProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.bearer = process.env.UKRPOSHTA_STATUS_BEARER;
        
        if (!this.bearer) {
            console.warn('Ukrposhta Bearer token not configured');
        }
    }

    async track(trackingNumber, options = {}) {
        if (!this.bearer) {
            throw new Error('Ukrposhta Bearer token not configured');
        }

        try {
            // Використовуємо /statuses/last endpoint для кращої стабільності
            const url = `https://www.ukrposhta.ua/status-tracking/0.0.1/statuses/last?barcode=${trackingNumber}&lang=en`;
            
            const response = await this.makeRequest(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.bearer}`,
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                timeout: 25000
            });

            if (response.data && response.data.barcode) {
                // Якщо отримали один об'єкт, перетворюємо в масив
                const dataArray = Array.isArray(response.data) ? response.data : [response.data];
                return this.normalizeUkrposhtaResponse(dataArray, trackingNumber);
            }

            return {
                success: false,
                error: 'Укрпошта: Номер не знайдено або не зареєстрований',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.response?.status, error.message);
            
            if (error.response?.status === 502 || error.response?.status === 504) {
                throw new Error(`${this.name}: API тимчасово недоступний`);
            }
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error(`${this.name}: Помилка авторизації - Bearer токен недійсний`);
            }
            if (error.response?.status === 400) {
                throw new Error(`${this.name}: Некоректний формат номера відправлення`);
            }
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'Номер відправлення не знайдено',
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            throw new Error(`${this.name}: ${error.message}`);
        }
    }

    async healthCheck() {
        if (!this.bearer) {
            return {
                status: 'error',
                provider: this.name,
                error: 'Bearer token not configured',
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Використовуємо валідний номер з документації
            const response = await this.makeRequest(
                'https://www.ukrposhta.ua/status-tracking/0.0.1/statuses/last?barcode=0500100031143&lang=en',
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.bearer}`,
                        'Accept': 'application/json',
                        'User-Agent': 'PandaTrack/2.0'
                    },
                    timeout: 10000
                }
            );
            
            return {
                status: 'ok',
                provider: this.name,
                bearerValid: true,
                responseCode: response.status,
                endpoint: '/statuses/last',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            if (error.response?.status === 404) {
                return {
                    status: 'ok',
                    provider: this.name,
                    note: 'API працює (404 для тестового номера - нормально)',
                    responseCode: 404,
                    timestamp: new Date().toISOString()
                };
            }
            
            return {
                status: 'error',
                provider: this.name,
                error: `${error.response?.status || 'Unknown'}: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    normalizeUkrposhtaResponse(data, trackingNumber) {
        const events = data.map(status => ({
            date: status.date,
            status: status.eventName,
            location: status.name || '',
            description: status.eventName || '',
            statusCode: status.event,
            country: status.country,
            reason: status.eventReason,
            step: status.step
        }));

        events.sort((a, b) => b.step - a.step);
        
        const latestStatus = data.find(s => s.step === Math.max(...data.map(s => s.step)));
        
        const statusMapping = {
            41000: 'delivered',
            48000: 'delivered',
            41010: 'returned',
            31200: 'returning',
            31300: 'forwarding',
            31400: 'exception',
            21700: 'in_transit',
            21500: 'in_transit',
            20700: 'in_transit',
            20800: 'in_transit',
            10100: 'accepted',
            10600: 'cancelled',
            10602: 'cancelled',
            21400: 'storage'
        };

        const statusCode = latestStatus?.event;
        const normalizedStatus = statusMapping[statusCode] || 'in_transit';
        
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'ukrposhta',
                status: latestStatus?.eventName || 'Unknown',
                statusCode: statusCode,
                normalizedStatus: normalizedStatus,
                lastUpdate: latestStatus?.date || new Date().toISOString(),
                events: events,
                estimatedDelivery: null,
                mailType: latestStatus?.mailType,
                country: latestStatus?.country,
                raw: data
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        if (/^[0-9]{14}$/.test(number)) return true;
        if (/^[A-Z]{2}\d{9}UA$/.test(number)) return true;
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) return true;
        if (/^(EM|CP|RG)\d{9}UA$/.test(number)) return true;
        
        return false;
    }
}

module.exports = UkrposhtaProvider;
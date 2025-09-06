const BaseProvider = require('./BaseProvider');
const crypto = require('crypto');

class DeliveryAutoProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.publicKey = process.env.DELIVERY_AUTO_PUBLIC_KEY;
        this.secretKey = process.env.DELIVERY_AUTO_SECRET_KEY;
        
        // Використовуємо правильний endpoint
        this.trackingUrl = 'https://delivery-auto.com/api/track';
        this.apiUrl = 'https://www.delivery-auto.com.ua/api/';
        
        if (!this.publicKey || !this.secretKey) {
            console.warn('Delivery Auto API credentials not configured');
        }
    }

    async track(trackingNumber, options = {}) {
        if (!this.publicKey || !this.secretKey) {
            throw new Error('Delivery Auto API credentials not configured');
        }

        try {
            // Спочатку пробуємо простий GET запит
            const simpleResponse = await this.trySimpleTracking(trackingNumber);
            if (simpleResponse.success) {
                return simpleResponse;
            }

            // Fallback до POST з HMAC
            return await this.tryHMACTracking(trackingNumber);

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            
            if (error.response?.status === 401) {
                throw new Error('Delivery Auto: Помилка авторизації');
            }
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'Delivery Auto: Номер не знайдено',
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            throw new Error(`${this.name}: ${error.message}`);
        }
    }

    async trySimpleTracking(trackingNumber) {
        try {
            const response = await this.makeRequest(`${this.trackingUrl}/${trackingNumber}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0',
                    'X-API-Key': this.publicKey
                },
                timeout: 15000
            });

            if (response.data && response.data.success !== false) {
                return this.normalizeDeliveryAutoResponse(response.data, trackingNumber);
            }

            return { success: false };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async tryHMACTracking(trackingNumber) {
        try {
            const timestamp = Date.now();
            const signature = this.generateHMACSignature(this.publicKey, timestamp);
            
            const requestData = {
                "culture": "uk-UA",
                "apiKey": this.publicKey,
                "timestamp": timestamp,
                "signature": signature,
                "methodName": "trackReceipt",
                "receiptNumber": trackingNumber
            };

            const response = await this.makeRequest(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                data: requestData,
                timeout: 20000
            });

            if (response.data?.success && response.data?.data) {
                return this.normalizeDeliveryAutoResponse(response.data.data, trackingNumber);
            }

            return {
                success: false,
                error: response.data?.message || 'Delivery Auto: Номер не знайдено',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            return {
                success: false,
                error: `Delivery Auto HMAC: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber
            };
        }
    }

    generateHMACSignature(apiKey, timestamp) {
        const dataToSign = apiKey + timestamp.toString();
        return crypto
            .createHmac('sha1', this.secretKey)
            .update(dataToSign)
            .digest('hex');
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
            // Простий тест доступності
            const response = await this.makeRequest('https://delivery-auto.com/', {
                method: 'GET',
                headers: {
                    'User-Agent': 'PandaTrack/2.0'
                },
                timeout: 8000
            });
            
            return {
                status: response.status < 500 ? 'ok' : 'error',
                provider: this.name,
                credentialsValid: true,
                responseCode: response.status,
                note: 'Website accessible',
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

    normalizeDeliveryAutoResponse(data, trackingNumber) {
        const events = [];
        
        if (data.statusHistory && Array.isArray(data.statusHistory)) {
            data.statusHistory.forEach(item => {
                events.push({
                    date: item.dateTime || item.date || new Date().toISOString(),
                    status: item.status || item.statusName || 'Невідомо',
                    location: this.buildLocation(item),
                    description: item.description || item.status || '',
                    statusCode: item.statusCode || item.id
                });
            });
        }
        
        if (events.length === 0 && data.currentStatus) {
            events.push({
                date: data.lastUpdate || new Date().toISOString(),
                status: data.currentStatus,
                location: this.buildLocation(data),
                description: data.currentStatus,
                statusCode: data.currentStatusCode
            });
        }

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'delivery-auto',
                status: data.currentStatus || data.status || 'Невідомо',
                normalizedStatus: this.mapStatus(data.currentStatus),
                statusCode: data.currentStatusCode || data.statusCode,
                lastUpdate: data.lastUpdate || new Date().toISOString(),
                events: events,
                estimatedDelivery: data.estimatedDelivery,
                senderCity: data.senderCity,
                recipientCity: data.recipientCity,
                weight: data.weight,
                cost: data.declaredValue,
                raw: data
            },
            provider: this.name,
            cost: 0,
            supportsInternational: false,
            timestamp: new Date().toISOString()
        };
    }

    buildLocation(data) {
        const parts = [];
        if (data.currentCity || data.city) parts.push(data.currentCity || data.city);
        if (data.currentWarehouse || data.warehouse) parts.push(data.currentWarehouse || data.warehouse);
        return parts.join(', ') || '';
    }

    mapStatus(status) {
        if (!status) return 'unknown';
        
        const s = status.toLowerCase();
        
        if (s.includes('доставлен') || s.includes('вручен')) return 'delivered';
        if (s.includes('прийнят') || s.includes('створен')) return 'accepted';
        if (s.includes('в дорозі') || s.includes('транспорт')) return 'in_transit';
        if (s.includes('на відділенн') || s.includes('прибув')) return 'at_destination';
        if (s.includes('неуспішн') || s.includes('проблем')) return 'exception';
        if (s.includes('повернен')) return 'returning';
        
        return 'in_transit';
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        if (/^DA\d{8,12}$/.test(number)) return true;
        if (/^\d{8,10}DA$/.test(number)) return true;
        if (/^DELIVERY\d{6,10}$/.test(number)) return true;
        if (/^\d{10,14}$/.test(number)) return true;
        
        return false;
    }
}

module.exports = DeliveryAutoProvider;
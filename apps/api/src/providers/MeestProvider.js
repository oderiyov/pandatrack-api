// /apps/api/src/providers/MeestProvider.js
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation } = require('../utils/meestTranslations');

class MeestProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiToken = process.env.MEEST_API_TOKEN; // Використовуємо готовий токен
        this.baseUrl = 'https://api.meest.com/v3.0/openAPI';
        
        if (!this.apiToken) {
            console.warn('Meest API token not configured');
        }
    }

    async track(trackingNumber, options = {}) {
        if (!this.apiToken) {
            throw new Error('Meest API token not configured');
        }

        try {
            // Спробуємо різні методи tracking
            const strategies = [
                () => this.tryTrackingByNumber(trackingNumber),
                () => this.trySearchByNumber(trackingNumber),
                () => this.tryTrackingByOrderId(trackingNumber)
            ];

            let lastError = null;

            for (const strategy of strategies) {
                try {
                    const result = await strategy();
                    if (result.success) {
                        console.log(`Meest: успішний запит стратегією ${strategy.name}`);
                        return result;
                    }
                } catch (error) {
                    console.warn(`Meest strategy failed: ${error.message}`);
                    lastError = error;
                    
                    // Якщо 401/403 - не пробуємо інші стратегії
                    if (error.response?.status === 401 || error.response?.status === 403) {
                        throw error;
                    }
                }
            }

            if (lastError) {
                throw lastError;
            }

            return {
                success: false,
                error: 'Meest: Номер не знайдено в жодному endpoint',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            
            if (error.response) {
                return {
                    success: false,
                    error: `Meest API HTTP ${error.response.status}: ${error.response.statusText}`,
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    async tryTrackingByNumber(trackingNumber) {
        const trackingData = {
            function: 'Tracking',
            tracking_number: trackingNumber
        };

        const response = await this.makeRequest(this.baseUrl, {
            method: 'POST',
            headers: {
                'token': this.apiToken, // Простий токен в header
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: trackingData,
            timeout: 15000
        });

        if (response.data && (response.data.result || response.data.tracking_info)) {
            return this.normalizeMeestResponse(response.data, trackingNumber);
        }

        return { success: false };
    }

    async trySearchByNumber(trackingNumber) {
        const searchData = {
            function: 'Search',
            filter: {
                number: trackingNumber
            }
        };

        const response = await this.makeRequest(this.baseUrl, {
            method: 'POST',
            headers: {
                'token': this.apiToken, // Простий токен в header
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: searchData,
            timeout: 15000
        });

        if (response.data && response.data.result && response.data.result.length > 0) {
            return this.normalizeMeestResponse(response.data.result[0], trackingNumber);
        }

        return { success: false };
    }

    async tryTrackingByOrderId(trackingNumber) {
        const orderData = {
            function: 'GetOrderInfo',
            order_id: trackingNumber
        };

        const response = await this.makeRequest(this.baseUrl, {
            method: 'POST',
            headers: {
                'token': this.apiToken, // Простий токен в header
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: orderData,
            timeout: 15000
        });

        if (response.data && response.data.order_info) {
            return this.normalizeMeestResponse(response.data.order_info, trackingNumber);
        }

        return { success: false };
    }

    normalizeMeestResponse(data, trackingNumber) {
        try {
            // Витягуємо події відстеження
            const events = this.extractTrackingEvents(data);
            const currentStatus = this.getCurrentStatus(data, events);
            const metadata = this.extractMetadata(data);

            return {
                success: true,
                data: {
                    trackingNumber: trackingNumber,
                    carrier: 'Meest Express',
                    status: currentStatus.status,
                    normalizedStatus: this.mapMeestStatus(currentStatus.statusCode),
                    statusCode: currentStatus.statusCode,
                    lastUpdate: currentStatus.date || new Date().toISOString(),
                    events: events,
                    estimatedDelivery: data.estimated_delivery || null,
                    actualDelivery: data.actual_delivery || null,
                    deliveryType: data.delivery_type || 'Unknown',
                    destinationCountry: data.destination_country || 'UKRAINE',
                    daysInTransit: this.calculateDaysInTransit(events),
                    totalEvents: events.length,
                    ...metadata,
                    raw: data
                },
                provider: this.name,
                cost: 0, // Нативний API безкоштовний
                supportsInternational: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Meest response normalization error:', error.message);
            return {
                success: false,
                error: `Failed to process Meest response: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber
            };
        }
    }

    extractTrackingEvents(data) {
        const events = [];

        // Спробуємо різні можливі структури даних
        const trackingData = data.tracking_info || data.tracking_events || data.events || data.history || [];
        
        if (Array.isArray(trackingData)) {
            trackingData.forEach((event, index) => {
                const originalStatus = event.status || event.event_name || event.description || 'Unknown Event';
                const originalLocation = this.buildLocationFromEvent(event);

                events.push({
                    date: this.parseISODate(event.date || event.event_date || event.timestamp),
                    status: translateStatus(originalStatus),
                    description: translateStatus(originalStatus),
                    location: translateLocation(originalLocation),
                    statusCode: event.status_code || event.code || index + 1,
                    eventType: event.event_type || 'tracking',
                    source: 'Meest Express',
                    confidence: 1
                });
            });
        }

        // Якщо немає подій, створимо базову подію з основного статусу
        if (events.length === 0 && data.status) {
            events.push({
                date: this.parseISODate(data.status_date || data.last_update),
                status: translateStatus(data.status),
                description: translateStatus(data.status),
                location: translateLocation(data.location || 'Unknown'),
                statusCode: data.status_code || '1',
                eventType: 'status',
                source: 'Meest Express',
                confidence: 1
            });
        }

        // Сортуємо за датою (від старіших до новіших)
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getCurrentStatus(data, events) {
        // Якщо є поточний статус в даних
        if (data.current_status || data.status) {
            return {
                status: translateStatus(data.current_status || data.status),
                statusCode: data.current_status_code || data.status_code || '1',
                date: data.current_status_date || data.status_date || data.last_update
            };
        }

        // Інакше беремо останню подію
        if (events.length > 0) {
            const latestEvent = events[events.length - 1];
            return {
                status: latestEvent.status,
                statusCode: latestEvent.statusCode,
                date: latestEvent.date
            };
        }

        // Fallback
        return {
            status: 'Невідомий статус',
            statusCode: '999',
            date: new Date().toISOString()
        };
    }

    extractMetadata(data) {
        const metadata = {};

        // Інформація про посилку
        if (data.weight) metadata.weight = data.weight;
        if (data.declared_value) metadata.declaredValue = data.declared_value;
        if (data.currency) metadata.currency = data.currency;
        if (data.description) metadata.description = data.description;
        if (data.service_type) metadata.serviceType = data.service_type;

        // Адреси
        if (data.sender) metadata.sender = data.sender;
        if (data.receiver) metadata.receiver = data.receiver;
        if (data.origin_address) metadata.originAddress = data.origin_address;
        if (data.destination_address) metadata.destinationAddress = data.destination_address;

        return metadata;
    }

    buildLocationFromEvent(event) {
        const locationParts = [];
        
        if (event.city) locationParts.push(event.city);
        if (event.region) locationParts.push(event.region);
        if (event.country) locationParts.push(event.country);
        if (event.location) locationParts.push(event.location);
        if (event.facility) locationParts.push(event.facility);
        
        return locationParts.join(', ') || 'Невідоме місце';
    }

    parseISODate(dateString) {
        if (!dateString) return new Date().toISOString();
        
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    calculateDaysInTransit(events) {
        if (!events || events.length === 0) return 0;

        const firstEvent = events[0];
        const lastEvent = events[events.length - 1];
        
        if (!firstEvent?.date) return 0;
        
        const startDate = new Date(firstEvent.date);
        const endDate = lastEvent?.date ? new Date(lastEvent.date) : new Date();
        
        if (isNaN(startDate.getTime())) return 0;
        
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    mapMeestStatus(statusCode) {
        const statusMap = {
            '1': 'accepted',      // Прийнято
            '2': 'in_transit',    // В дорозі
            '3': 'out_for_delivery', // Доставляється
            '4': 'delivered',     // Доставлено
            '5': 'exception',     // Проблема
            '6': 'returned',      // Повернуто
            '7': 'cancelled',     // Скасовано
            '8': 'storage',       // На складі
            '9': 'customs',       // Митниця
            '10': 'at_pickup',    // Готово до отримання
            '999': 'unknown'      // Невідомо
        };

        return statusMap[String(statusCode)] || 'unknown';
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Формати номерів Meest Express
        const patterns = [
            /^ME\d{10,12}$/,              // Meest Express формат ME + цифри
            /^MEE\d{8,10}$/,              // Meest Express Extended
            /^\d{10,14}$/,                // Числові номери 10-14 цифр
            /^[A-Z]{2}\d{9}[A-Z]{2}$/,    // Міжнародні формати
            /^M[0-9A-Z]{8,12}$/,          // Починається з M
            /^[0-9]{8}-[0-9]{3}$/,        // Формат з тире (xxxxxxxx-xxx)
        ];

        // Специфічні ознаки Meest номерів
        const meestIndicators = [
            number.startsWith('ME'),
            number.startsWith('MEE'),
            /^M\d/.test(number),
            carrierCode === 'meest',
            carrierCode === 'meest-express'
        ];

        return patterns.some(pattern => pattern.test(number)) || 
               meestIndicators.some(indicator => indicator);
    }

    async healthCheck() {
        if (!this.apiToken) {
            return {
                status: 'error',
                provider: this.name,
                error: 'API token not configured',
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Простий тест з готовим токеном
            const testData = {
                function: 'Search',
                filter: {
                    number: 'TEST123'
                }
            };

            const response = await this.makeRequest(this.baseUrl, {
                method: 'POST',
                headers: {
                    'token': this.apiToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: testData,
                timeout: 10000
            });
            
            return {
                status: 'ok',
                provider: this.name,
                apiVersion: 'v3.0',
                features: ['Direct Token Auth', 'Tracking', 'Search'],
                tokenValid: true,
                endpoint: this.baseUrl,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            // Навіть якщо тестовий номер не знайдено, API працює
            if (error.response?.status === 404 || error.response?.status === 400) {
                return {
                    status: 'ok',
                    provider: this.name,
                    note: 'API доступний (404/400 для тестового номера нормально)',
                    responseCode: error.response.status,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                status: 'error',
                provider: this.name,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = MeestProvider;
// apps/api/src/providers/DHLProvider.js - ПОВНІСТЮ ВИПРАВЛЕНО з Unified API
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation } = require('../utils/dhlTranslations');

class DHLProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.DHL_API_KEY;
        this.apiSecret = process.env.DHL_API_SECRET;
        
        // ВИПРАВЛЕНО: Unified API endpoint для всіх DHL сервісів
        this.unifiedUrl = 'https://api-eu.dhl.com/track/shipments';
        
        console.log('DHL Provider initialized:', {
            hasApiKey: !!this.apiKey,
            hasApiSecret: !!this.apiSecret,
            endpoint: this.unifiedUrl
        });
        
        if (!this.apiKey) {
            console.warn('DHL API key not configured');
        }
    }

    detectServiceType(trackingNumber) {
        const number = trackingNumber.trim().toUpperCase().replace(/\s/g, '');
        
        // КРИТИЧНО: DHL eCommerce 14-digit patterns (найвищий пріоритет)
        if (/^[3-6]\d{13}$/.test(number)) {
            // 31549478013000, 60120213284055 тощо
            console.log(`DHL: 14-digit eCommerce pattern detected for ${number}`);
            return 'ecommerce';
        }
        
        if (/^4\d{13}$/.test(number)) {
            // 41903751719763 тощо  
            console.log(`DHL: 4-prefix eCommerce pattern detected for ${number}`);
            return 'ecommerce';
        }
        
        // DHL Global Mail/eCommerce patterns (міжнародні)
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            const prefix = number.substring(0, 2);
            // RG, GM, LM, EM префікси для eCommerce
            if (['RG', 'GM', 'LM', 'EM', 'LK', 'LZ'].includes(prefix)) {
                return 'ecommerce';
            }
            return 'global-mail';
        }
        
        // DHL Express patterns 
        if (/^\d{10}$/.test(number)) {
            return 'express';
        }
        
        if (/^\d{11}$/.test(number)) {
            return 'express';
        }
        
        if (/^JD\d{18}$/.test(number)) {
            return 'express';
        }
        
        // DHL Freight/Forwarding patterns
        if (/^\d{9}$/.test(number)) {
            return 'freight';
        }
        
        if (/^[A-Z]{4}\d{7,10}$/.test(number)) {
            return 'freight';
        }
        
        // За замовчуванням - ecommerce для нових форматів
        console.log(`DHL: Unknown pattern, defaulting to ecommerce for ${number}`);
        return 'ecommerce';
    }

    async track(trackingNumber, options = {}) {
        if (!this.apiKey) {
            throw new Error('DHL API key not configured');
        }

        console.log(`DHL Provider: Tracking ${trackingNumber} via Unified API`);
        const startTime = Date.now();

        try {
            // Визначаємо тип DHL сервісу
            const serviceType = this.detectServiceType(trackingNumber);
            console.log(`DHL: Detected service type: ${serviceType} for ${trackingNumber}`);

            // Пробуємо різні DHL сервіси в порядку пріоритету
            const serviceStrategies = this.getServiceStrategies(serviceType);
            
            for (const strategy of serviceStrategies) {
                console.log(`DHL: Trying ${strategy.name} service...`);
                
                const result = await this.tryUnifiedAPI(trackingNumber, strategy.service);
                
                if (result.success) {
                    console.log(`DHL: ${strategy.name} service успішний (${Date.now() - startTime}ms)`);
                    return result;
                }
                
                // КРИТИЧНО: Якщо rate limit - зупиняємо спроби
                if (result.httpStatus === 429) {
                    console.log(`DHL: Rate limit reached, stopping further attempts`);
                    return result;
                }
                
                console.log(`DHL: ${strategy.name} service не знайшов: ${result.error}`);
            }

            // Якщо жоден сервіс не спрацював (але не rate limit)
            return {
                success: false,
                error: 'DHL: Номер не знайдено у жодній DHL системі',
                provider: this.name,
                trackingNumber: trackingNumber,
                serviceTypeDetected: serviceType,
                servicesAttempted: serviceStrategies.map(s => s.name),
                responseTime: Date.now() - startTime,
                suggestion: 'Перевірити на https://www.dhl.com/tracking або спробувати пізніше'
            };

        } catch (error) {
            console.error(`DHL Provider error for ${trackingNumber}:`, error.message);
            
            if (error.response) {
                const status = error.response.status;
                
                if (status === 401 || status === 403) {
                    return {
                        success: false,
                        error: 'DHL: Недійсний API ключ або доступ заборонено',
                        provider: this.name,
                        trackingNumber: trackingNumber,
                        httpStatus: status
                    };
                }
                
                if (status === 429) {
                    return {
                        success: false,
                        error: 'DHL: Перевищено ліміт запитів (250/день). Спробуйте пізніше.',
                        provider: this.name,
                        trackingNumber: trackingNumber,
                        httpStatus: status,
                        suggestion: 'Перевірити на офіційному сайті: https://www.dhl.com/tracking'
                    };
                }
            }
            
            throw new Error(`DHL API unavailable: ${error.message}`);
        }
    }

    getServiceStrategies(detectedType) {
        // ОПТИМІЗАЦІЯ: Тільки 1-2 спроби замість 5
        const strategies = [
            // Почніть з детектованого типу
            { name: detectedType, service: detectedType, priority: 1 }
        ];
        
        // Додайте тільки 1 fallback для економії запитів
        if (detectedType === 'ecommerce') {
            strategies.push({ name: 'express', service: 'express', priority: 2 });
        } else if (detectedType === 'express') {
            strategies.push({ name: 'ecommerce', service: 'ecommerce', priority: 2 });
        } else {
            strategies.push({ name: 'ecommerce', service: 'ecommerce', priority: 2 });
        }
        
        return strategies;
    }

    /**
     * НОВИЙ МЕТОД: Unified DHL API для всіх сервісів
     */
    async tryUnifiedAPI(trackingNumber, service) {
        console.log(`DHL Unified API: Trying service "${service}" for ${trackingNumber}`);
        
        try {
            const response = await this.makeRequest(this.unifiedUrl, {
                method: 'GET',
                params: {
                    trackingNumber: trackingNumber,
                    service: service,
                    requesterCountryCode: 'UA',
                    originCountryCode: this.guessOriginCountry(trackingNumber),
                    language: 'en'
                },
                headers: {
                    'DHL-API-Key': this.apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0',
                    'Content-Type': 'application/json'
                },
                timeout: 20000
            });

            console.log(`DHL ${service} API Response:`, JSON.stringify(response.data, null, 2));

            // Перевіряємо структуру відповіді згідно з OpenAPI v1.5.6
            if (response.data?.shipments?.length > 0) {
                const shipment = response.data.shipments[0];
                return this.normalizeUnifiedResponse(shipment, trackingNumber, service);
            }

            // Якщо немає shipments але є інша структура
            if (response.data?.data?.shipments?.length > 0) {
                const shipment = response.data.data.shipments[0];
                return this.normalizeUnifiedResponse(shipment, trackingNumber, service);
            }

            return {
                success: false,
                error: `DHL ${service}: Номер не знайдено`,
                service: service,
                responseStructure: Object.keys(response.data || {})
            };

        } catch (error) {
            console.log(`DHL Unified API (${service}) error:`, error.response?.status, error.message);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: `DHL ${service}: Номер не знайдено`,
                    service: service,
                    httpStatus: 404
                };
            }
            
            // Інші помилки кидаємо далі
            throw error;
        }
    }

    guessOriginCountry(trackingNumber) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Якщо міжнародний формат з країною
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            const countryCode = number.slice(-2);
            return countryCode;
        }
        
        // За замовчуванням - найпопулярніші для українців
        return 'CN'; // Китай для більшості eCommerce посилок
    }

    normalizeUnifiedResponse(shipment, trackingNumber, service) {
        try {
            // Будуємо події згідно з OpenAPI v1.5.6 структурою
            const events = this.buildEventsFromShipment(shipment);
            
            // Поточний статус з shipment.status
            const currentStatus = shipment.status?.description || 
                                shipment.status?.status || 
                                'Unknown';
            
            const statusCode = shipment.status?.statusCode || 
                              shipment.status?.code || 
                              'unknown';

            // Детальна інформація про посилку
            const shipmentInfo = {
                service: this.mapServiceName(service),
                productCode: shipment.details?.product?.productCode,
                productName: shipment.details?.product?.productName,
                totalWeight: shipment.details?.weight?.value,
                weightUnit: shipment.details?.weight?.unitText,
                dimensions: shipment.details?.dimensions,
                pieces: shipment.details?.pieces?.length || 0
            };

            // ВИПРАВЛЕНО: Адреси з реальних подій замість API fields
            const origin = this.extractOriginFromEvents(events) || this.buildAddressFromDetails(shipment.origin);
            const destination = this.extractDestinationFromEvents(events) || this.buildAddressFromDetails(shipment.destination);

            return {
                success: true,
                data: {
                    trackingNumber: trackingNumber,
                    carrier: `DHL ${this.mapServiceName(service)}`,
                    status: translateStatus(currentStatus),
                    normalizedStatus: this.mapDHLStatus(statusCode),
                    statusCode: statusCode,
                    lastUpdate: this.getLastEventDate(events),
                    events: events,
                    estimatedDelivery: shipment.details?.estimatedTimeOfDelivery || 
                                     shipment.details?.proofOfDelivery?.timestamp,
                    shipmentDate: shipment.details?.estimatedTimeOfDeliveryRemark,
                    origin: origin,
                    destination: destination,
                    ...shipmentInfo,
                    service: service,
                    apiVersion: 'unified',
                    raw: shipment
                },
                provider: this.name,
                cost: 0,
                supportsInternational: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('DHL response normalization error:', error.message);
            return {
                success: false,
                error: `Failed to process DHL response: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber,
                service: service
            };
        }
    }

    buildEventsFromShipment(shipment) {
        const events = [];
        
        // Події з shipment.events згідно з OpenAPI
        if (shipment.events && Array.isArray(shipment.events)) {
            shipment.events.forEach(event => {
                const location = this.buildLocationFromEvent(event);
                
                events.push({
                    date: event.timestamp || new Date().toISOString(),
                    status: translateStatus(event.description || event.status || 'Unknown event'),
                    description: translateStatus(event.description || event.status || 'Unknown event'),
                    location: translateLocation(location),
                    statusCode: this.mapDHLStatus(event.statusCode || event.code),
                    originalStatus: event.description || event.status,
                    eventType: event.typeCode || 'tracking',
                    source: 'DHL'
                });
            });
        }

        // Якщо немає подій, створюємо з основного статусу
        if (events.length === 0 && shipment.status) {
            events.push({
                date: new Date().toISOString(),
                status: translateStatus(shipment.status.description || 'Unknown'),
                description: translateStatus(shipment.status.description || 'Unknown'),
                location: this.buildAddressFromDetails(shipment.destination || shipment.origin),
                statusCode: this.mapDHLStatus(shipment.status.statusCode),
                originalStatus: shipment.status.description,
                eventType: 'status',
                source: 'DHL'
            });
        }

        // Сортуємо події по даті (найстаріші перші)
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        console.log(`DHL: Built ${events.length} events from shipment`);
        return events;
    }

    buildLocationFromEvent(event) {
        // Згідно з OpenAPI: event.location.address
        if (event.location?.address) {
            const addr = event.location.address;
            const parts = [];
            
            if (addr.addressLocality) parts.push(addr.addressLocality);
            if (addr.province) parts.push(addr.province);
            if (addr.countryCode) parts.push(addr.countryCode);
            
            return parts.join(', ');
        }
        
        // Fallback для інших форматів
        if (event.location?.city) {
            const parts = [];
            if (event.location.city) parts.push(event.location.city);
            if (event.location.country) parts.push(event.location.country);
            return parts.join(', ');
        }
        
        return '';
    }

    buildAddressFromDetails(addressDetails) {
        if (!addressDetails) return '';
        
        // Згідно з OpenAPI структурою
        if (addressDetails.address) {
            const addr = addressDetails.address;
            const parts = [];
            
            if (addr.addressLocality) parts.push(addr.addressLocality);
            if (addr.province) parts.push(addr.province);
            if (addr.countryCode) parts.push(addr.countryCode);
            
            return parts.join(', ');
        }
        
        // Fallback
        if (typeof addressDetails === 'string') {
            return addressDetails;
        }
        
        return '';
    }

    mapServiceName(service) {
        const serviceNames = {
            'express': 'Express',
            'ecommerce': 'Global Mail (eCommerce)',
            'parcel': 'Parcel',
            'freight': 'Global Forwarding',
            'dgf': 'Global Forwarding',
            'mail': 'Global Mail'
        };
        
        return serviceNames[service] || service;
    }

    mapDHLStatus(statusCode) {
        if (!statusCode) return 'unknown';
        
        const statusCodeLower = String(statusCode).toLowerCase();
        
        // DHL статуси згідно з документацією
        const statusMap = {
            'delivered': 'delivered',
            'with-delivery-courier': 'out_for_delivery',
            'transit': 'in_transit',
            'picked-up': 'accepted',
            'pre-transit': 'accepted',
            'processed': 'in_transit',
            'sorted': 'in_transit',
            'departed': 'in_transit',
            'arrived': 'at_destination',
            'customs': 'in_transit',
            'exception': 'exception',
            'delivery-attempt': 'delivery_attempt',
            'returned': 'returning',
            'cancelled': 'exception'
        };
        
        // Точний match
        if (statusMap[statusCodeLower]) {
            return statusMap[statusCodeLower];
        }
        
        // Pattern matching для складних статусів
        if (statusCodeLower.includes('deliver')) return 'delivered';
        if (statusCodeLower.includes('transit') || statusCodeLower.includes('transport')) return 'in_transit';
        if (statusCodeLower.includes('picked') || statusCodeLower.includes('accept')) return 'accepted';
        if (statusCodeLower.includes('attempt')) return 'delivery_attempt';
        if (statusCodeLower.includes('exception') || statusCodeLower.includes('problem')) return 'exception';
        if (statusCodeLower.includes('return')) return 'returning';
        if (statusCodeLower.includes('customs')) return 'in_transit';
        
        return 'in_transit'; // За замовчуванням
    }

    extractOriginFromEvents(events) {
        // Знаходимо першу подію (picked up/departure)
        if (events.length === 0) return null;
        
        const firstEvent = events[0];
        return firstEvent.location || null;
    }

    extractDestinationFromEvents(events) {
        // Знаходимо останню подію з локацією (delivery/arrival)
        if (events.length === 0) return null;
        
        const lastEvent = events[events.length - 1];
        return lastEvent.location || null;
    }

    getLastEventDate(events) {
        if (events.length === 0) return new Date().toISOString();
        
        // Події відсортовані, остання має найпізнішу дату
        return events[events.length - 1].date;
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().replace(/\s/g, '');
        
        // DHL Global Mail/eCommerce formats (найпопулярніші для українців)
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) return true; // RG123456789CN, LM123456789UK
        
        // DHL Express formats
        if (/^\d{10,11}$/.test(number)) return true; // 1234567890, 12345678901
        if (/^JD\d{18}$/.test(number)) return true;  // JD формат
        
        // DHL eCommerce formats (КРИТИЧНО - ці формати пропускались)
        if (/^[3-6]\d{13}$/.test(number)) return true; // 31549478013000, 60120213284055
        if (/^4\d{13}$/.test(number)) return true;     // 41903751719763
        
        // DHL Freight/Forwarding formats
        if (/^\d{9}$/.test(number)) return true;     // 123456789 
        if (/^[A-Z]{4}\d{7,10}$/.test(number)) return true; // ABCD1234567
        
        // DHL Parcel formats
        if (/^\d{4}\s?\d{4}\s?\d{4}$/.test(number)) return true; // 1234 5678 9012
        
        return false;
    }

    async healthCheck() {
        if (!this.apiKey) {
            return {
                status: 'error',
                provider: this.name,
                error: 'API key not configured',
                timestamp: new Date().toISOString()
            };
        }

        // НЕ робимо реальний health check для збереження quota
        return {
            status: 'ok',
            provider: this.name,
            note: 'API key configured (health check disabled to preserve quota)',
            quotaLimit: '250 requests/day',
            api: 'Unified Tracking API',
            services: ['Express', 'eCommerce/Global Mail', 'Freight/Forwarding', 'Parcel'],
            endpoint: this.unifiedUrl,
            features: [
                'Multi-service support',
                'International tracking',
                'Event timeline',
                'Estimated delivery',
                'Address details'
            ],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = DHLProvider;
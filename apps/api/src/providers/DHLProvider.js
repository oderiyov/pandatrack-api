// apps/api/src/providers/DHLProvider.js - ВИПРАВЛЕНО з dual API support
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation, translateDHLData } = require('../utils/dhlTranslations');

class DHLProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.DHL_API_KEY;
        this.apiSecret = process.env.DHL_API_SECRET;
        
        // ВИПРАВЛЕНО: Один Unified API endpoint для всіх DHL сервісів
        this.unifiedUrl = 'https://api-eu.dhl.com/track/shipments';
        
        if (!this.apiKey) {
            console.warn('DHL API key not configured');
        }
    }

    detectServiceType(trackingNumber) {
        const number = trackingNumber.trim().toUpperCase();
        
        // DHL Global Mail/eCommerce patterns (найпопулярніші для українців)
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            // Міжнародні формати: RG123456789CN, LM123456789UK, тощо
            return 'global-mail';
        }
        
        // DHL Express patterns 
        if (/^\d{10}$/.test(number)) {
            // 10-значні: 1234567890
            return 'express';
        }
        
        if (/^JD\d{18}$/.test(number)) {
            // JD формат Express
            return 'express';
        }
        
        // DHL Global Forwarding (freight) patterns
        if (/^[A-Z]{4}\d{7,10}$/.test(number)) {
            return 'forwarding';
        }
        
        // За замовчуванням - спробуємо всі
        return 'unknown';
    }

    async tryGlobalMailAPI(trackingNumber) {
        try {
            // Global Mail використовує той же endpoint що й Express, але з іншими параметрами
            const response = await this.makeRequest(this.globalMailUrl, {
                method: 'GET',
                params: {
                    trackingNumber: trackingNumber,
                    service: 'dgf,parcel,ecommerce,mail', // КЛЮЧОВА ВІДМІННІСТЬ - включаємо mail
                    requesterCountryCode: 'UA'
                },
                headers: {
                    'DHL-API-Key': this.apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                timeout: 15000
            });

            console.log(`DHL Global Mail API response:`, JSON.stringify(response.data, null, 2));

            if (response.data?.shipments?.length > 0) {
                return this.normalizeGlobalMailResponse(response.data.shipments[0], trackingNumber);
            }

            return {
                success: false,
                error: 'DHL Global Mail: Номер не знайдено',
                api: 'Global Mail'
            };

        } catch (error) {
            console.log(`DHL Global Mail API error: ${error.response?.status} - ${error.message}`);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'DHL Global Mail: Номер не знайдено',
                    api: 'Global Mail'
                };
            }
            
            throw error;
        }
    }

    async track(trackingNumber, options = {}) {
        if (!this.apiKey) {
            throw new Error('DHL API key not configured');
        }

        console.log(`DHL Provider: Tracking ${trackingNumber} - trying both Express and Global Forwarding APIs`);

        try {
            // Визначаємо тип DHL сервісу по номеру
            const serviceType = this.detectServiceType(trackingNumber);
            console.log(`DHL: Detected service type: ${serviceType} for ${trackingNumber}`);

            // Пробуємо APIs в порядку пріоритету
            let apiResults = [];

            if (serviceType === 'global-mail' || serviceType === 'unknown') {
                const globalMailResult = await this.tryUnifiedAPI(trackingNumber, 'ecommerce');
                apiResults.push({ type: 'Global Mail/eCommerce', result: globalMailResult });
                if (globalMailResult.success) {
                    console.log('DHL eCommerce service успішний');
                    return globalMailResult;
                }
            }

            if (serviceType === 'express' || serviceType === 'unknown') {
                const expressResult = await this.tryUnifiedAPI(trackingNumber, 'express');
                apiResults.push({ type: 'Express', result: expressResult });
                if (expressResult.success) {
                    console.log('DHL Express service успішний');
                    return expressResult;
                }
            }

            if (serviceType === 'forwarding' || serviceType === 'unknown') {
                const forwardingResult = await this.tryUnifiedAPI(trackingNumber, 'freight');
                apiResults.push({ type: 'Freight', result: forwardingResult });
                if (forwardingResult.success) {
                    console.log('DHL Freight service успішний');
                    return forwardingResult;
                }
                
                // Також пробуємо DGF окремо
                const dgfResult = await this.tryUnifiedAPI(trackingNumber, 'dgf');
                apiResults.push({ type: 'DGF', result: dgfResult });
                if (dgfResult.success) {
                    console.log('DHL DGF service успішний');
                    return dgfResult;
                }
            }

            // Якщо жоден API не спрацював
            return {
                success: false,
                error: 'DHL: Номер не знайдено у жодній DHL системі',
                provider: this.name,
                trackingNumber: trackingNumber,
                apisTried: apiResults.map(r => r.type),
                serviceTypeDetected: serviceType
            };

        } catch (error) {
            console.error(`DHL Provider error for ${trackingNumber}:`, error.message);
            throw error;
        }
    }

    async tryExpressAPI(trackingNumber) {
        try {
            const response = await this.makeRequest(this.expressUrl, {
                method: 'GET',
                params: {
                    trackingNumber: trackingNumber,
                    service: 'express,parcel,ecommerce',
                    requesterCountryCode: 'UA'
                },
                headers: {
                    // ВИПРАВЛЕНО: Новий header name (старий deprecated)
                    'DHL-API-Key': this.apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                timeout: 15000
            });

            console.log(`DHL Express API response:`, JSON.stringify(response.data, null, 2));

            if (response.data?.shipments?.length > 0) {
                return this.normalizeExpressResponse(response.data.shipments[0], trackingNumber);
            }

            return {
                success: false,
                error: 'DHL Express: Номер не знайдено',
                api: 'Express'
            };

        } catch (error) {
            console.log(`DHL Express API error: ${error.response?.status} - ${error.message}`);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'DHL Express: Номер не знайдено',
                    api: 'Express'
                };
            }
            
            // Інші помилки пробросимо далі
            throw error;
        }
    }

    async tryGlobalForwardingAPI(trackingNumber) {
        try {
            // Global Forwarding використовує housebill number
            const response = await this.makeRequest(`${this.forwardingUrl}/${trackingNumber}`, {
                method: 'GET',
                headers: {
                    'DHL-API-Key': this.apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                timeout: 15000
            });

            console.log(`DHL Global Forwarding API response:`, JSON.stringify(response.data, null, 2));

            if (response.data?.shipment) {
                return this.normalizeForwardingResponse(response.data.shipment, trackingNumber);
            }

            return {
                success: false,
                error: 'DHL Global Forwarding: Номер не знайдено',
                api: 'Global Forwarding'
            };

        } catch (error) {
            console.log(`DHL Global Forwarding API error: ${error.response?.status} - ${error.message}`);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'DHL Global Forwarding: Номер не знайдено',
                    api: 'Global Forwarding'
                };
            }
            
            // Інші помилки пробросимо далі
            throw error;
        }
    }

    normalizeExpressResponse(shipment, trackingNumber) {
        const events = [];
        
        if (shipment.events && Array.isArray(shipment.events)) {
            shipment.events.forEach(event => {
                events.push({
                    date: event.timestamp || new Date().toISOString(),
                    status: event.description || 'Unknown event',
                    location: this.buildLocation(event.location),
                    description: event.description || 'Unknown event',
                    statusCode: event.statusCode || 'unknown'
                });
            });
        }

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'DHL Express',
                status: shipment.status?.description || 'Unknown',
                normalizedStatus: this.mapExpressStatus(shipment.status?.statusCode),
                statusCode: shipment.status?.statusCode || 'unknown',
                lastUpdate: shipment.status?.timestamp || new Date().toISOString(),
                events: events,
                estimatedDelivery: shipment.estimatedTimeOfDelivery,
                service: shipment.service || 'DHL Express',
                destination: shipment.destination,
                origin: shipment.origin,
                raw: shipment
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            apiType: 'Express',
            timestamp: new Date().toISOString()
        };
    }

    normalizeGlobalMailResponse(shipment, trackingNumber) {
        const events = [];
        
        if (shipment.events && Array.isArray(shipment.events)) {
            shipment.events.forEach(event => {
                events.push({
                    date: event.timestamp || new Date().toISOString(),
                    status: event.description || 'Unknown event',
                    location: this.buildLocation(event.location),
                    description: event.description || 'Unknown event',
                    statusCode: event.statusCode || 'unknown'
                });
            });
        }

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'DHL Global Mail (eCommerce)',
                status: shipment.status?.description || 'Unknown',
                normalizedStatus: this.mapGlobalMailStatus(shipment.status?.statusCode),
                statusCode: shipment.status?.statusCode || 'unknown',
                lastUpdate: shipment.status?.timestamp || new Date().toISOString(),
                events: events,
                estimatedDelivery: shipment.estimatedTimeOfDelivery,
                service: 'DHL Global Mail',
                destination: shipment.destination,
                origin: shipment.origin,
                raw: shipment
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            apiType: 'Global Mail',
            timestamp: new Date().toISOString()
        };
    }

    normalizeForwardingResponse(shipment, trackingNumber) {
        const events = [];
        
        // Global Forwarding має іншу структуру подій
        if (shipment.events && Array.isArray(shipment.events)) {
            shipment.events.forEach(event => {
                events.push({
                    date: event.timestamp || event.date || new Date().toISOString(),
                    status: event.statusText || event.description || 'Unknown event',
                    location: event.location || '',
                    description: event.statusText || event.description || 'Unknown event',
                    statusCode: event.statusCode || 'unknown'
                });
            });
        }

        // Якщо немає подій, створюємо з основного статусу
        if (events.length === 0 && shipment.status) {
            events.push({
                date: shipment.status.timestamp || new Date().toISOString(),
                status: shipment.status.description || 'Unknown',
                location: shipment.destination || '',
                description: shipment.status.description || 'Unknown',
                statusCode: shipment.status.statusCode || 'unknown'
            });
        }

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'DHL Global Forwarding',
                status: shipment.status?.description || shipment.statusText || 'Unknown',
                normalizedStatus: this.mapForwardingStatus(shipment.status?.statusCode || shipment.statusCode),
                statusCode: shipment.status?.statusCode || shipment.statusCode || 'unknown',
                lastUpdate: shipment.status?.timestamp || shipment.lastUpdate || new Date().toISOString(),
                events: events,
                estimatedDelivery: shipment.estimatedDelivery || shipment.estimatedTimeOfDelivery,
                service: 'DHL Global Forwarding',
                destination: shipment.destination,
                origin: shipment.origin,
                shipmentId: shipment.shipmentId,
                containerNumbers: shipment.containerNumbers,
                raw: shipment
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            apiType: 'Global Forwarding',
            timestamp: new Date().toISOString()
        };
    }

    buildLocationFromAddress(locationObj) {
        if (!locationObj) return '';
        
        // Згідно з OpenAPI: location.address.addressLocality, countryCode тощо
        if (locationObj.address) {
            const parts = [];
            if (locationObj.address.addressLocality) parts.push(locationObj.address.addressLocality);
            if (locationObj.address.countryCode) parts.push(locationObj.address.countryCode);
            return parts.join(', ');
        }
        
        // Fallback для інших форматів
        if (typeof locationObj === 'string') return locationObj;
        
        return '';
    }

    buildLocation(location) {
        // Застаріла функція - використовуємо нову
        return this.buildLocationFromAddress(location);
    }

    mapExpressStatus(statusCode) {
        if (!statusCode) return 'unknown';
        
        const statusMap = {
            'transit': 'in_transit',
            'delivered': 'delivered',
            'picked-up': 'accepted',
            'pre-transit': 'accepted',
            'out-for-delivery': 'out_for_delivery',
            'delivery-attempt': 'delivery_attempt',
            'exception': 'exception',
            'returned': 'returning',
            'processed': 'in_transit'
        };
        
        return statusMap[statusCode.toLowerCase()] || 'in_transit';
    }

    mapGlobalMailStatus(statusCode) {
        if (!statusCode) return 'unknown';
        
        const statusMap = {
            'delivered': 'delivered',
            'transit': 'in_transit',
            'picked-up': 'accepted',
            'pre-transit': 'accepted',
            'processed': 'in_transit',
            'out-for-delivery': 'out_for_delivery',
            'delivery-attempt': 'delivery_attempt',
            'exception': 'exception',
            'returned': 'returning',
            'customs': 'in_transit',
            'sorting': 'in_transit',
            'departed': 'in_transit',
            'arrived': 'at_destination'
        };
        
        return statusMap[statusCode.toLowerCase()] || 'in_transit';
    }

    mapForwardingStatus(statusCode) {
        if (!statusCode) return 'unknown';
        
        const statusMap = {
            'delivered': 'delivered',
            'in-transit': 'in_transit',
            'departed': 'in_transit',
            'arrived': 'at_destination',
            'booking-confirmed': 'accepted',
            'gated-in': 'accepted',
            'gated-out': 'in_transit',
            'vessel-departure': 'in_transit',
            'vessel-arrival': 'at_destination',
            'customs-cleared': 'in_transit',
            'exception': 'exception'
        };
        
        return statusMap[statusCode.toLowerCase()] || 'in_transit';
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

        // ВИПРАВЛЕННЯ: Не робимо health check для збереження лімітів
        return {
            status: 'ok',
            provider: this.name,
            note: 'API key configured (health check disabled to preserve quota)',
            quotaLimit: '250 requests/day',
            api: 'Unified Tracking API',
            services: ['Express', 'eCommerce/Global Mail', 'Freight/Forwarding', 'Parcel', 'Post'],
            endpoint: this.unifiedUrl,
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().replace(/\s/g, '');
        
        // DHL Global Mail formats (найпопулярніші для українців з AliExpress/eBay)
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) return true; // RG123456789CN, LM123456789UK
        
        // DHL Express formats
        if (/^\d{10,11}$/.test(number)) return true; // 1234567890
        if (/^JD\d{18}$/.test(number)) return true;
        
        // DHL Global Forwarding formats (freight)
        if (/^\d{9,10}$/.test(number)) return true; 
        if (/^[A-Z]{4}\d{7,10}$/.test(number)) return true;
        
        return false;
    }
}

module.exports = DHLProvider;
// apps/api/src/providers/DHLProvider.js - HYBRID VERSION
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation } = require('../utils/dhlTranslations');

class DHLProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.DHL_API_KEY;
        this.apiSecret = process.env.DHL_API_SECRET;
        this.unifiedUrl = 'https://api-eu.dhl.com/track/shipments';
        
        // HYBRID CONFIG
        this.dailyQuota = 250;
        this.scrapingEnabled = false; // DHL scraping неможливий через Akamai
        
        console.log('DHL Provider (Hybrid) initialized:', {
            hasApiKey: !!this.apiKey,
            endpoint: this.unifiedUrl,
            dailyQuota: this.dailyQuota,
            scrapingEnabled: this.scrapingEnabled
        });
        
        if (!this.apiKey) {
            console.warn('DHL API key not configured');
        }
    }

    /**
     * HYBRID LOGIC: DHL-специфічна стратегія
     * Priority: Cache → API (якщо є quota)
     */
    getTrackingStrategies() {
        const strategies = [];
        const remainingQuota = this.getRemainingQuota();
        
        // 1. Cache ЗАВЖДИ перший (економимо API calls)
        if (this.cacheManager) {
            strategies.push({
                name: 'cache',
                priority: 1,
                method: 'trackViaCache'
            });
        }
        
        // 2. API тільки якщо є quota
        if (remainingQuota > 0) {
            strategies.push({
                name: 'native_api',
                priority: 2,
                method: 'trackViaAPI'
            });
        } else {
            console.warn(`[DHL] Quota exceeded: 0/${this.dailyQuota}`);
        }
        
        // 3. Scraping disabled для DHL (Akamai Bot Manager блокує)
        
        return strategies;
    }

    /**
     * HYBRID STRATEGY: DHL API Implementation
     */
    async trackViaAPI(trackingNumber, options = {}) {
        // Перевіряємо quota перед запитом
        const remainingQuota = this.getRemainingQuota();
        if (remainingQuota <= 0) {
            throw new Error(`DHL API quota exceeded (${this.dailyQuota}/day)`);
        }

        console.log(`[DHL] Tracking ${trackingNumber} via Unified API (${remainingQuota}/${this.dailyQuota} quota remaining)`);
        const startTime = Date.now();

        try {
            // Резервуємо quota
            await this.reserveQuota();

            // Визначаємо тип DHL сервісу
            const serviceType = this.detectServiceType(trackingNumber);
            console.log(`[DHL] Detected service type: ${serviceType}`);

            // Пробуємо різні DHL сервіси
            const serviceStrategies = this.getServiceStrategies(serviceType);
            
            for (const strategy of serviceStrategies) {
                console.log(`[DHL] Trying ${strategy.name} service...`);
                
                const result = await this.tryUnifiedAPI(trackingNumber, strategy.service);
                
                if (result.success) {
                    console.log(`[DHL] ${strategy.name} service успішний (${Date.now() - startTime}ms)`);
                    
                    // Записуємо успішне використання quota
                    await this.recordQuotaUsage(0);
                    
                    // Зберігаємо в cache з aggressive TTL
                    if (this.cacheManager) {
                        const ttl = this.getDHLCacheTTL(result.data?.status);
                        await this.saveToCacheAsync(trackingNumber, result, ttl);
                    }
                    
                    return result;
                }
                
                // Rate limit - зупиняємо спроби
                if (result.httpStatus === 429) {
                    console.log(`[DHL] Rate limit reached, stopping attempts`);
                    await this.releaseQuota(); // Не витрачаємо quota на rate limit
                    return result;
                }
            }

            // Звільняємо quota якщо не знайдено
            await this.releaseQuota();

            return {
                success: false,
                error: 'DHL: Номер не знайдено у жодній DHL системі',
                provider: this.name,
                trackingNumber: trackingNumber,
                serviceTypeDetected: serviceType,
                servicesAttempted: serviceStrategies.map(s => s.name),
                responseTime: Date.now() - startTime
            };

        } catch (error) {
            console.error(`[DHL] API error for ${trackingNumber}:`, error.message);
            
            // Звільняємо quota при помилці
            await this.releaseQuota();
            
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
                        suggestion: 'Перевірити на https://www.dhl.com/tracking'
                    };
                }
            }
            
            throw error;
        }
    }

    /**
     * AGGRESSIVE CACHING: DHL-специфічні TTL правила
     */
    getDHLCacheTTL(status) {
        const statusLower = (status || '').toLowerCase();
        
        // Delivered = maximum cache (24h)
        if (statusLower.includes('delivered') || statusLower.includes('доставлен')) {
            return 86400; // 24 години
        }
        
        // In transit = moderate cache (4h)
        if (statusLower.includes('transit') || statusLower.includes('в пути')) {
            return 14400; // 4 години
        }
        
        // Exception = check more often (2h)
        if (statusLower.includes('exception') || statusLower.includes('проблем')) {
            return 7200; // 2 години
        }
        
        // Default = 6h
        return 21600;
    }

    /**
     * QUOTA MANAGEMENT: Get remaining quota
     */
    getRemainingQuota() {
        if (!this.quotaManager) return this.dailyQuota;
        
        const used = this.quotaManager.quotas.get(this.name) || 0;
        return Math.max(0, this.dailyQuota - used);
    }

    // === EXISTING DHL METHODS (без змін) ===

    detectServiceType(trackingNumber) {
        const number = trackingNumber.trim().toUpperCase().replace(/\s/g, '');
        
        if (/^[3-6]\d{13}$/.test(number)) {
            return 'ecommerce';
        }
        
        if (/^4\d{13}$/.test(number)) {
            return 'ecommerce';
        }
        
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            const prefix = number.substring(0, 2);
            if (['RG', 'GM', 'LM', 'EM', 'LK', 'LZ'].includes(prefix)) {
                return 'ecommerce';
            }
            return 'global-mail';
        }
        
        if (/^\d{10}$/.test(number)) {
            return 'express';
        }
        
        if (/^\d{11}$/.test(number)) {
            return 'express';
        }
        
        if (/^JD\d{18}$/.test(number)) {
            return 'express';
        }
        
        if (/^\d{9}$/.test(number)) {
            return 'freight';
        }
        
        if (/^[A-Z]{4}\d{7,10}$/.test(number)) {
            return 'freight';
        }
        
        return 'ecommerce';
    }

    getServiceStrategies(detectedType) {
        const strategies = [
            { name: detectedType, service: detectedType, priority: 1 }
        ];
        
        if (detectedType === 'ecommerce') {
            strategies.push({ name: 'express', service: 'express', priority: 2 });
        } else if (detectedType === 'express') {
            strategies.push({ name: 'ecommerce', service: 'ecommerce', priority: 2 });
        } else {
            strategies.push({ name: 'ecommerce', service: 'ecommerce', priority: 2 });
        }
        
        return strategies;
    }

    async tryUnifiedAPI(trackingNumber, service) {
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

            if (response.data?.shipments?.length > 0) {
                const shipment = response.data.shipments[0];
                return this.normalizeUnifiedResponse(shipment, trackingNumber, service);
            }

            if (response.data?.data?.shipments?.length > 0) {
                const shipment = response.data.data.shipments[0];
                return this.normalizeUnifiedResponse(shipment, trackingNumber, service);
            }

            return {
                success: false,
                error: `DHL ${service}: Номер не знайдено`,
                service: service
            };

        } catch (error) {
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: `DHL ${service}: Номер не знайдено`,
                    service: service,
                    httpStatus: 404
                };
            }
            
            throw error;
        }
    }

    guessOriginCountry(trackingNumber) {
        const number = trackingNumber.trim().toUpperCase();
        
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            const countryCode = number.slice(-2);
            return countryCode;
        }
        
        return 'CN';
    }

    normalizeUnifiedResponse(shipment, trackingNumber, service) {
        try {
            const events = this.buildEventsFromShipment(shipment);
            
            const currentStatus = shipment.status?.description || 
                                shipment.status?.status || 
                                'Unknown';
            
            const statusCode = shipment.status?.statusCode || 
                              shipment.status?.code || 
                              'unknown';

            const shipmentInfo = {
                service: this.mapServiceName(service),
                productCode: shipment.details?.product?.productCode,
                productName: shipment.details?.product?.productName,
                totalWeight: shipment.details?.weight?.value,
                weightUnit: shipment.details?.weight?.unitText,
                dimensions: shipment.details?.dimensions,
                pieces: shipment.details?.pieces?.length || 0
            };

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

        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return events;
    }

    buildLocationFromEvent(event) {
        if (event.location?.address) {
            const addr = event.location.address;
            const parts = [];
            
            if (addr.addressLocality) parts.push(addr.addressLocality);
            if (addr.province) parts.push(addr.province);
            if (addr.countryCode) parts.push(addr.countryCode);
            
            return parts.join(', ');
        }
        
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
        
        if (addressDetails.address) {
            const addr = addressDetails.address;
            const parts = [];
            
            if (addr.addressLocality) parts.push(addr.addressLocality);
            if (addr.province) parts.push(addr.province);
            if (addr.countryCode) parts.push(addr.countryCode);
            
            return parts.join(', ');
        }
        
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
        
        if (statusMap[statusCodeLower]) {
            return statusMap[statusCodeLower];
        }
        
        if (statusCodeLower.includes('deliver')) return 'delivered';
        if (statusCodeLower.includes('transit') || statusCodeLower.includes('transport')) return 'in_transit';
        if (statusCodeLower.includes('picked') || statusCodeLower.includes('accept')) return 'accepted';
        if (statusCodeLower.includes('attempt')) return 'delivery_attempt';
        if (statusCodeLower.includes('exception') || statusCodeLower.includes('problem')) return 'exception';
        if (statusCodeLower.includes('return')) return 'returning';
        if (statusCodeLower.includes('customs')) return 'in_transit';
        
        return 'in_transit';
    }

    extractOriginFromEvents(events) {
        if (events.length === 0) return null;
        const firstEvent = events[0];
        return firstEvent.location || null;
    }

    extractDestinationFromEvents(events) {
        if (events.length === 0) return null;
        const lastEvent = events[events.length - 1];
        return lastEvent.location || null;
    }

    getLastEventDate(events) {
        if (events.length === 0) return new Date().toISOString();
        return events[events.length - 1].date;
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().replace(/\s/g, '');
        
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) return true;
        if (/^\d{10,11}$/.test(number)) return true;
        if (/^JD\d{18}$/.test(number)) return true;
        if (/^[3-6]\d{13}$/.test(number)) return true;
        if (/^4\d{13}$/.test(number)) return true;
        if (/^\d{9}$/.test(number)) return true;
        if (/^[A-Z]{4}\d{7,10}$/.test(number)) return true;
        if (/^\d{4}\s?\d{4}\s?\d{4}$/.test(number)) return true;
        
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

        const remainingQuota = this.getRemainingQuota();

        return {
            status: 'ok',
            provider: this.name,
            note: 'API key configured (health check disabled to preserve quota)',
            quotaLimit: `${this.dailyQuota} requests/day`,
            quotaRemaining: remainingQuota,
            quotaUsed: this.dailyQuota - remainingQuota,
            api: 'Unified Tracking API',
            services: ['Express', 'eCommerce/Global Mail', 'Freight/Forwarding', 'Parcel'],
            endpoint: this.unifiedUrl,
            features: [
                'Multi-service support',
                'International tracking',
                'Event timeline',
                'Estimated delivery',
                'Address details',
                'Hybrid strategy (Cache → API)',
                'Aggressive caching (24h for delivered)'
            ],
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = DHLProvider;
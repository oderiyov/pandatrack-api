// apps/api/src/providers/DHLProvider.js - ВИПРАВЛЕННЯ ДЛЯ ЛІМІТІВ
const BaseProvider = require('./BaseProvider');

class DHLProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.DHL_API_KEY;
        this.baseUrl = 'https://api-eu.dhl.com/track/shipments';
        
        if (!this.apiKey) {
            console.warn('DHL API key not configured');
        }
    }

    async track(trackingNumber, options = {}) {
        if (!this.apiKey) {
            throw new Error('DHL API key not configured');
        }

        try {
            const response = await this.makeRequest(this.baseUrl, {
                method: 'GET',
                params: {
                    trackingNumber: trackingNumber,
                    service: 'express,parcel,ecommerce',
                    requesterCountryCode: 'UA'
                },
                headers: {
                    'DHL-API-Key': this.apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                timeout: 15000
            });

            if (response.data?.shipments?.length > 0) {
                return this.normalizeDHLResponse(response.data.shipments[0], trackingNumber);
            }

            return {
                success: false,
                error: 'DHL: Номер не знайдено',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.response?.status, error.message);
            
            if (error.response?.status === 429) {
                throw new Error(`${this.name}: Перевищено ліміт запитів (250/день)`);
            }
            if (error.response?.status === 401 || error.response?.status === 403) {
                throw new Error(`${this.name}: API ключ недійсний або немає доступу`);
            }
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'DHL номер не знайдено',
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            throw new Error(`${this.name}: ${error.message}`);
        }
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

        // ВИПРАВЛЕННЯ: Не робимо health check для DHL щоб не витрачати ліміти
        return {
            status: 'ok',
            provider: this.name,
            note: 'API key configured (health check disabled to preserve quota)',
            quotaLimit: '250 requests/day',
            timestamp: new Date().toISOString()
        };
    }

    normalizeDHLResponse(shipment, trackingNumber) {
        const events = [];
        
        if (shipment.events) {
            shipment.events.forEach(event => {
                events.push({
                    date: event.timestamp,
                    status: event.description,
                    location: this.buildLocation(event.location),
                    description: event.description,
                    statusCode: event.statusCode
                });
            });
        }

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'dhl',
                status: shipment.status?.description || 'Unknown',
                normalizedStatus: this.mapStatus(shipment.status?.statusCode),
                lastUpdate: shipment.status?.timestamp || new Date().toISOString(),
                events: events,
                estimatedDelivery: shipment.estimatedTimeOfDelivery,
                service: shipment.service,
                raw: shipment
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            timestamp: new Date().toISOString()
        };
    }

    buildLocation(location) {
        if (!location?.address) return '';
        const parts = [];
        if (location.address.addressLocality) parts.push(location.address.addressLocality);
        if (location.address.countryCode) parts.push(location.address.countryCode);
        return parts.join(', ');
    }

    mapStatus(statusCode) {
        if (!statusCode) return 'unknown';
        
        const statusMap = {
            'transit': 'in_transit',
            'delivered': 'delivered',
            'picked-up': 'accepted',
            'pre-transit': 'accepted',
            'out-for-delivery': 'out_for_delivery',
            'delivery-attempt': 'delivery_attempt',
            'exception': 'exception',
            'returned': 'returning'
        };
        
        return statusMap[statusCode.toLowerCase()] || 'in_transit';
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().replace(/\s/g, '');
        
        if (/^\d{10,11}$/.test(number)) return true;
        if (/^JD\d{18}$/.test(number)) return true;
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) return true;
        
        return false;
    }
}

module.exports = DHLProvider;
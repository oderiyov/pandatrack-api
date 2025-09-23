// apps/api/src/providers/NovaPoshtaProvider.js - ВИПРАВЛЕНА ВЕРСІЯ
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation } = require('../utils/novaPoshtaTranslations');

class NovaPoshtaProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.NOVAPOSHTA_API_KEY;
        this.jwtToken = null;
        this.jwtExpires = null;
        this.baseUrl = 'https://api.novapost.com/v.1.0';
        
        if (!this.apiKey) {
            console.warn('Nova Poshta API key not found in environment variables');
        }
    }

    async getJwtToken() {
        // Перевіряємо чи токен ще дійсний (з запасом 5 хвилин)
        if (this.jwtToken && this.jwtExpires && Date.now() < (this.jwtExpires - 5 * 60 * 1000)) {
            return this.jwtToken;
        }

        try {
            const response = await this.makeRequest(`${this.baseUrl}/clients/authorization`, {
                method: 'GET',
                params: {
                    apiKey: this.apiKey
                },
                timeout: 10000
            });

            if (response.data && response.data.jwt) {
                this.jwtToken = response.data.jwt;
                // JWT токени Nova Post діють 1 годину
                this.jwtExpires = Date.now() + (60 * 60 * 1000);
                
                console.log('Nova Poshta JWT token refreshed');
                return this.jwtToken;
            }

            throw new Error('Failed to get JWT token from Nova Post API');

        } catch (error) {
            console.error('Nova Poshta JWT error:', error.message);
            this.jwtToken = null;
            this.jwtExpires = null;
            throw new Error(`Nova Poshta authentication failed: ${error.message}`);
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            // Отримуємо JWT токен
            const jwt = await this.getJwtToken();

            // ВИПРАВЛЕНО: Authorization header без "Bearer " префіксу
            const response = await this.makeRequest(`${this.baseUrl}/shipments/tracking`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': jwt  // БЕЗ "Bearer " - як показано в відповіді підтримки
                },
                params: {
                    'numbers[]': trackingNumber,
                    // Включаємо додаткову інформацію як в прикладі підтримки
                    withUndeliveryReason: true,
                    withCreatedOnTheBasis: true,
                    external: 1
                    // countryCode видалено - не потрібен для українських номерів
                },
                timeout: 15000
            });

            console.log('Nova Poshta FullTracking API response:', JSON.stringify(response.data, null, 2));

            // Перевіряємо успішність відповіді
            if (response.data && response.data.items && response.data.items.length > 0) {
                const trackingData = response.data.items[0];
                return this.normalizeNovaPostResponse(trackingData, trackingNumber);
            } else {
                return {
                    success: false,
                    error: 'Nova Post: Tracking number not found or no tracking data available',
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            
            // Обробка помилок авторизації
            if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
                // Скидаємо JWT і спробуємо ще раз ОДИН РАЗ
                console.log('JWT token expired, refreshing...');
                this.jwtToken = null;
                this.jwtExpires = null;
                
                try {
                    const newJwt = await this.getJwtToken();
                    const retryResponse = await this.makeRequest(`${this.baseUrl}/shipments/tracking`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': newJwt
                        },
                        params: {
                            'numbers[]': trackingNumber,
                            withUndeliveryReason: true,
                            withCreatedOnTheBasis: true,
                            external: 1 
                        },
                        timeout: 15000
                    });

                    if (retryResponse.data && retryResponse.data.items && retryResponse.data.items.length > 0) {
                        const trackingData = retryResponse.data.items[0];
                        return this.normalizeNovaPostResponse(trackingData, trackingNumber);
                    }
                } catch (retryError) {
                    console.error('Retry after token refresh failed:', retryError.message);
                }
                
                return {
                    success: false,
                    error: 'Nova Post authorization failed. Token expired and refresh failed.',
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            if (error.response) {
                return {
                    success: false,
                    error: `Nova Post API HTTP ${error.response.status}: ${error.response.statusText}`,
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    normalizeNovaPostResponse(data, trackingNumber) {
        try {
            const events = this.buildEventsFromTracking(data);
            const currentStatus = this.getCurrentStatus(data);
            const metadata = this.extractMetadata(data);

            return {
                success: true,
                data: {
                    trackingNumber: trackingNumber,
                    carrier: 'Nova Poshta', // ВИПРАВЛЕНО: українська назва
                    status: currentStatus.status,
                    normalizedStatus: this.mapNovaPostStatus(currentStatus.statusCode),
                    statusCode: currentStatus.statusCode,
                    lastUpdate: currentStatus.statusDate || new Date().toISOString(),
                    events: events,
                    estimatedDelivery: currentStatus.scheduledDate,
                    actualDelivery: currentStatus.closingDate,
                    deliveryType: currentStatus.deliveryType,
                    destinationCountry: currentStatus.deliveryCountry,
                    daysInTransit: this.calculateDaysInTransit(
                        currentStatus.createdDate, 
                        currentStatus.closingDate
                    ),
                    ...metadata,
                    raw: data
                },
                provider: this.name,
                cost: 0, // Nova Post API безкоштовний
                supportsInternational: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Nova Post response normalization error:', error.message);
            return {
                success: false,
                error: `Failed to process Nova Post response: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber
            };
        }
    }

    buildEventsFromTracking(data) {
        const events = [];

        // ПРІОРИТЕТ: detailsTracking для повної історії
        if (data.detailsTracking && Array.isArray(data.detailsTracking)) {
            data.detailsTracking.forEach(event => {

                const originalStatus = event.eventName || event.event || 'Unknown Event';
                const originalLocation = this.buildLocationFromEvent(event);

                events.push({
                    date: this.parseISODate(event.date),
                    status: translateStatus(originalStatus),
                    description: translateStatus(originalStatus),
                    location: translateLocation(originalLocation),
                    statusCode: event.code,
                    eventType: event.event,
                    eventStatus: event.eventStatus,
                    countryCode: event.countryCode
                });
            });
        }

        // FALLBACK: historyOnlineTracking якщо detailsTracking пустий
        if (events.length === 0 && data.historyOnlineTracking && Array.isArray(data.historyOnlineTracking)) {
            data.historyOnlineTracking.forEach(event => {

                const originalStatus = event.eventName || event.event || 'Unknown Event';
                const originalLocation = this.buildLocationFromEvent(event);

                events.push({
                    date: this.parseISODate(event.date),
                    status: translateStatus(originalStatus),
                    description: translateStatus(originalStatus),
                    location: translateLocation(originalLocation),
                    statusCode: event.code,
                    eventType: event.event,
                    eventStatus: event.eventStatus,
                    countryCode: event.countryCode
                });
            });
        }

        console.log(`Nova Poshta: Built ${events.length} events with eventStatus from tracking data`);
        
        // НЕ сортуємо події по даті - залишаемо в порядку API для правильного timeline
        return events;
    }

    getCurrentStatus(data) {
        // Пріоритет: currentStatus масив
        if (data.currentStatus && Array.isArray(data.currentStatus) && data.currentStatus.length > 0) {
            const status = data.currentStatus[0];
            const originalStatus = status.status || status.eventName || 'Unknown Status';

            return {
                status: translateStatus(originalStatus),
                statusCode: status.code || status.statusCode || '999',
                statusDate: status.date || status.statusDate,
                scheduledDate: status.scheduledDate,
                closingDate: status.closingDate,
                createdDate: status.createdDate,
                deliveryType: status.deliveryType || 'Unknown',
                deliveryCountry: status.countryCode || 'UA'
            };
        }

        // Fallback: перша подія з detailsTracking
        if (data.detailsTracking && Array.isArray(data.detailsTracking) && data.detailsTracking.length > 0) {
            const latestEvent = data.detailsTracking[0]; // Припускаємо що перша = найновіша
            const originalStatus = latestEvent.eventName || latestEvent.event || 'Unknown Status';

            return {
                status: translateStatus(originalStatus),
                statusCode: latestEvent.code || '999',
                statusDate: latestEvent.date,
                scheduledDate: null,
                closingDate: null,
                createdDate: null,
                deliveryType: 'Unknown',
                deliveryCountry: latestEvent.countryCode || 'UA'
            };
        }

        // Останній fallback
        return {
            status: 'Невідомий статус',
            statusCode: '999',
            statusDate: new Date().toISOString(),
            scheduledDate: null,
            closingDate: null,
            createdDate: null,
            deliveryType: 'Unknown',
            deliveryCountry: 'UA'
        };
    }

    extractMetadata(data) {
        const metadata = {};

        // Інформація про посилки
        if (data.parcels && Array.isArray(data.parcels) && data.parcels.length > 0) {
            const parcel = data.parcels[0];
            metadata.weight = parcel.actualWeight;
            metadata.declaredValue = parcel.insuranceCost;
            metadata.currency = parcel.insuranceCostCurrencyCode;
            metadata.description = parcel.parcelDescription;
            metadata.dimensions = {
                length: parcel.length,
                width: parcel.width,
                height: parcel.height
            };
        }

        // Причини недоставки
        if (data.undeliveryReasons && Array.isArray(data.undeliveryReasons)) {
            metadata.undeliveryReasons = data.undeliveryReasons.map(reason => ({
                reason: reason.reasonName,
                date: this.parseISODate(reason.reasonDate),
                subtype: reason.subtypeOfReasonName
            }));
        }

        // Пов'язані відправлення
        if (data.alternativeNumbers && Array.isArray(data.alternativeNumbers)) {
            metadata.relatedShipments = data.alternativeNumbers;
        }

        return metadata;
    }

    parseISODate(dateString) {
        if (!dateString) return new Date().toISOString();
        
        try {
            // Nova Post повертає дати в ISO 8601 UTC форматі
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    buildLocationFromEvent(event) {
        const locationParts = [];
        
        if (event.settlementName) locationParts.push(event.settlementName);
        if (event.divisionName) locationParts.push(event.divisionName);
        if (event.countryCode && event.countryCode !== 'UA') locationParts.push(event.countryCode);
        
        return locationParts.join(', ') || 'Невідоме місце';
    }


    calculateDaysInTransit(createdDate, deliveredDate) {
        if (!createdDate) return 0;

        const startDate = new Date(createdDate);
        const endDate = deliveredDate ? new Date(deliveredDate) : new Date();
        
        if (isNaN(startDate.getTime())) return 0;
        if (deliveredDate && isNaN(endDate.getTime())) return 0;
        
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    mapNovaPostStatus(statusCode) {
        const statusMap = {
            '1': 'pending',      // Ready to send
            '4': 'accepted',     // Accepted for sending
            '5': 'in_transit',   // Sent from division
            '6': 'in_transit',   // Arrived in recipient city
            '7': 'at_pickup',    // Arrived at division
            '8': 'at_pickup',    // Arrived at postomat
            '9': 'delivered',    // Closed (delivered)
            '10': 'delivered',   // Closed with money transfer
            '11': 'delivered',   // Money transfer completed
            '13': 'in_transit',  // At sorting center
            '16': 'in_transit',  // Transferred to partner
            '101': 'out_for_delivery', // Uploaded to courier
            '102': 'returning',  // Returns
            '103': 'refused',    // Refusal
            '104': 'redirected', // Redirecting
            '105': 'disposed',   // Utilization
            '111': 'exception',  // Failed delivery
            '112': 'exception',  // Delivery postponed
            '999': 'unknown'     // Undetermined
        };

        return statusMap[String(statusCode)] || 'unknown';
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim();
        
        // Nova Post нові формати (SHPL префікс для міжнародних)
        if (/^SHPL\d{10}$/.test(number)) return true;
        
        // Стандартні Nova Poshta формати
        if (/^20\d{12,13}$/.test(number)) return true;
        if (/^59\d{12,13}$/.test(number)) return true;
        if (/^\d{13,15}$/.test(number)) return true;
        
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

        try {
            // Перевіряємо отримання JWT токену
            const jwt = await this.getJwtToken();
            
            return {
                status: 'ok',
                provider: this.name,
                apiVersion: 'v1.0 FullTracking',
                features: ['FullTracking', 'JWT Authentication', 'Detailed History'],
                jwtValid: !!jwt,
                jwtExpires: this.jwtExpires,
                endpoint: this.baseUrl,
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

module.exports = NovaPoshtaProvider;
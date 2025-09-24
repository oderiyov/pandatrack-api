// apps/api/src/providers/MeestProvider.js - ВИПРАВЛЕНО
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation } = require('../utils/meestTranslations');

class MeestProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.login = process.env.MEEST_LOGIN;
        this.password = process.env.MEEST_PASSWORD;
        this.contractId = process.env.MEEST_CONTRACT_ID;
        this.apiToken = process.env.MEEST_API_TOKEN; // Додатковий токен якщо є
        this.baseUrl = 'https://api.meest.com/v3.0/openAPI';
        
        // Кеш для session token
        this.sessionToken = null;
        this.tokenExpiry = null;
        this.refreshToken = null;
        
        console.log('MeestProvider initialized (fixed):', {
            hasCredentials: !!(this.login && this.password),
            hasApiToken: !!this.apiToken,
            contractId: this.contractId ? this.contractId.substring(0,8) + '...' : 'NOT SET'
        });
    }

    async track(trackingNumber, options = {}) {
        console.log(`Meest: Starting multi-strategy track for ${trackingNumber}`);
        const startTime = Date.now();
        
        try {
            // Стратегія 1: Якщо є готовий API токен - використовуємо його
            if (this.apiToken) {
                console.log('Meest: Trying strategy 1 - Direct API token');
                const result = await this.trackWithApiToken(trackingNumber);
                if (result.success) {
                    console.log(`Meest: Strategy 1 success in ${Date.now() - startTime}ms`);
                    return result;
                }
            }

            // Стратегія 2: Отримуємо session token через /auth
            console.log('Meest: Trying strategy 2 - Session token');
            const sessionToken = await this.getValidToken();
            const result = await this.trackWithMultipleEndpoints(trackingNumber, sessionToken);
            
            console.log(`Meest: Completed in ${Date.now() - startTime}ms`);
            return result;

        } catch (error) {
            console.error(`Meest error (${Date.now() - startTime}ms):`, error.message);
            return {
                success: false,
                error: `Meest API: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber,
                suggestions: [
                    'Перевірте права доступу до tracking endpoints',
                    'Можливо потрібен спеціальний тип контракту для tracking',
                    'Спробуйте зв\'язатися з техпідтримкою Meest'
                ]
            };
        }
    }

    async trackWithApiToken(trackingNumber) {
        console.log('Meest: Using direct API token approach');
        
        const trackingUrl = `${this.baseUrl}/tracking/${trackingNumber}`;
        
        try {
            const response = await this.makeRequest(trackingUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            if (response.data?.status === 'OK' && response.data?.result) {
                return this.normalizeTrackingResponse(response.data, trackingNumber);
            }

            throw new Error(`API token strategy failed: ${response.data?.info?.message || 'No data'}`);

        } catch (error) {
            console.warn('Meest: API token strategy failed:', error.message);
            throw error;
        }
    }

    async trackWithMultipleEndpoints(trackingNumber, token) {
        const strategies = [
            { name: 'tracking', url: `/tracking/${trackingNumber}` },
            { name: 'parcelStatus', url: `/parcelStatus/${trackingNumber}` },
            { name: 'getParcel', url: `/getParcel/${trackingNumber}/parcelNumber/objectData` },
            { name: 'parcelInfoTracking', url: `/parcelInfoTracking/${trackingNumber}` },
            // ДОДАНО: Спробуємо з contract ID параметром
            { name: 'trackingWithContract', url: `/tracking/${trackingNumber}?contractId=${this.contractId}` }
        ];

        let lastError = null;

        for (const strategy of strategies) {
            try {
                console.log(`Meest: Trying ${strategy.name} endpoint`);
                
                const response = await this.makeRequest(`${this.baseUrl}${strategy.url}`, {
                    method: 'GET',
                    headers: {
                        'token': token,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                });

                console.log(`Meest ${strategy.name} response:`, {
                    status: response.data?.status,
                    resultType: Array.isArray(response.data?.result) ? 'array' : typeof response.data?.result,
                    resultLength: response.data?.result?.length || 'N/A'
                });

                if (response.data?.status === 'OK') {
                    if (strategy.name === 'tracking' && Array.isArray(response.data.result) && response.data.result.length > 0) {
                        return this.normalizeTrackingResponse(response.data, trackingNumber);
                    } else if (strategy.name === 'getParcel' && response.data.result && typeof response.data.result === 'object') {
                        return this.normalizeParcelResponse(response.data, trackingNumber);
                    } else if (response.data.result && response.data.result.length > 0) {
                        return this.normalizeTrackingResponse(response.data, trackingNumber);
                    }
                }

            } catch (error) {
                console.warn(`Meest ${strategy.name} failed:`, error.message);
                lastError = error;
                
                // Якщо token expired, оновлюємо його
                if (error.response?.status === 401) {
                    console.log('Meest: Token expired, clearing cache');
                    this.sessionToken = null;
                    this.tokenExpiry = null;
                    // Не продовжуємо з іншими endpoints якщо токен недійсний
                    break;
                }
                
                continue; // Спробуємо наступний endpoint
            }
        }

        // Якщо жоден endpoint не спрацював
        throw new Error(`All tracking endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    async getValidToken() {
        // Перевіряємо чи токен ще валідний
        if (this.sessionToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.sessionToken;
        }

        console.log('Meest: Getting new session token via /auth endpoint');

        const authUrl = `${this.baseUrl}/auth`;
        const authData = {
            username: this.login,
            password: this.password
        };

        try {
            const response = await this.makeRequest(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: authData,
                timeout: 30000
            });

            if (response.data?.status === 'OK' && response.data?.result?.token) {
                this.sessionToken = response.data.result.token;
                this.refreshToken = response.data.result.refresh_token;
                
                const expiresIn = response.data.result.expiresIn || 86400;
                this.tokenExpiry = Date.now() + (expiresIn * 1000);
                
                console.log(`Meest: Token valid for ${Math.floor(expiresIn / 3600)} hours`);
                return this.sessionToken;
            }

            throw new Error(`Authentication failed: ${response.data?.info?.message || 'Unknown error'}`);

        } catch (error) {
            console.error('Meest auth error:', error.message);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    normalizeTrackingResponse(apiData, trackingNumber) {
        const events = this.extractEventsFromResult(apiData.result || []);
        
        if (events.length === 0) {
            return {
                success: false,
                error: 'No tracking events found. This may indicate:\n' +
                       '• Package not yet in Meest system\n' +
                       '• Insufficient API permissions for tracking\n' +
                       '• Package number format not recognized',
                provider: this.name,
                trackingNumber: trackingNumber,
                debug: {
                    resultType: typeof apiData.result,
                    resultLength: Array.isArray(apiData.result) ? apiData.result.length : 'N/A'
                }
            };
        }

        const latestEvent = events[events.length - 1];
        
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'Meest Express',
                status: latestEvent.status,
                normalizedStatus: this.mapEventCodeToStatus(latestEvent.eventCode),
                statusCode: latestEvent.eventCode,
                lastUpdate: latestEvent.date,
                events: events,
                daysInTransit: this.calculateDaysInTransit(events),
                totalEvents: events.length,
                raw: apiData
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            timestamp: new Date().toISOString()
        };
    }

    normalizeParcelResponse(apiData, trackingNumber) {
        // Для /getParcel endpoint результат має іншу структуру
        const parcel = apiData.result;
        
        if (!parcel) {
            return {
                success: false,
                error: 'No parcel information found',
                provider: this.name,
                trackingNumber: trackingNumber
            };
        }

        // Створюємо базову подію з інформації про посилку
        const events = [{
            date: new Date().toISOString(),
            status: 'Package Information Retrieved',
            description: `Package found: ${parcel.parcelNumber || trackingNumber}`,
            location: 'Meest System',
            eventCode: 'info',
            statusCode: 'info',
            eventType: 'info',
            source: 'Meest Express',
            confidence: 1
        }];

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'Meest Express',
                status: 'Package Information Retrieved',
                normalizedStatus: 'info',
                statusCode: 'info',
                lastUpdate: new Date().toISOString(),
                events: events,
                totalEvents: events.length,
                parcelInfo: parcel, // Додаткова інформація про посилку
                raw: apiData
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            timestamp: new Date().toISOString()
        };
    }

    extractEventsFromResult(resultArray) {
        if (!Array.isArray(resultArray) || resultArray.length === 0) {
            return [];
        }

        return resultArray.map(event => {
            const eventDescr = event.eventDescr?.descrUA || 
                             event.eventDescr?.descrRU || 
                             event.eventDescr?.descrEN || 
                             'Unknown Event';
            
            const location = this.buildLocationFromEvent(event);

            return {
                date: this.parseEventDateTime(event.eventDateTime),
                status: translateStatus(eventDescr),
                description: translateStatus(eventDescr),
                location: translateLocation(location),
                eventCode: event.eventCode || 'unknown',
                statusCode: String(event.eventCode || '0'),
                eventType: 'tracking',
                source: 'Meest Express',
                confidence: 1,
                raw: event
            };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    buildLocationFromEvent(event) {
        const parts = [];
        
        if (event.eventCityDescr?.descrUA) {
            parts.push(event.eventCityDescr.descrUA);
        }
        
        if (event.eventCountryDescr?.descrUA) {
            parts.push(event.eventCountryDescr.descrUA);
        }
        
        return parts.join(', ') || 'Unknown Location';
    }

    parseEventDateTime(dateTimeString) {
        if (!dateTimeString) return new Date().toISOString();
        
        try {
            const date = new Date(dateTimeString.replace(' ', 'T') + 'Z');
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    mapEventCodeToStatus(eventCode) {
        const statusMap = {
            '101': 'accepted',
            '1622': 'delivered', 
            '1825': 'returned',
            '1214': 'at_pickup',
            '1315': 'out_for_delivery',
            '808': 'in_transit',
            '505': 'in_transit',
            '2230': 'customs'
        };

        return statusMap[String(eventCode)] || 'in_transit';
    }

    calculateDaysInTransit(events) {
        if (!events || events.length < 2) return 0;
        
        const firstDate = new Date(events[0].date);
        const lastDate = new Date(events[events.length - 1].date);
        
        if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) return 0;
        
        const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        const patterns = [
            /^ME\d{10,12}$/,
            /^MEE\d{8,10}$/,
            /^CV\d{9}UA$/,
            /^M[0-9A-Z]{8,12}$/,
            /^[0-9]{8}-[0-9]{3}$/,
            /^TAC-\d+$/,
            /^717-\d+$/,
            /^[0-9]{8}[A-Z0-9]{7}$/,
            /^UA\d+[A-Z]{2}\d+[A-Z]$/  // Додано новий pattern
        ];

        const matches = patterns.some(pattern => pattern.test(number));
        
        if (matches) {
            console.log(`Meest: Pattern matched for ${number}`);
        }
        
        return matches;
    }

    async healthCheck() {
        try {
            // Перевіряємо чи можемо отримати токен
            const token = await this.getValidToken();
            
            return {
                status: 'ok',
                provider: this.name,
                authenticated: !!token,
                tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
                hasApiToken: !!this.apiToken,
                strategies: ['Direct API Token', 'Session Token', 'Multiple Endpoints'],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                provider: this.name,
                error: error.message,
                recommendations: [
                    'Перевірте логін/пароль у .env файлі',
                    'Перевірте чи є MEEST_API_TOKEN у .env',
                    'Зв\'яжіться з техпідтримкою Meest щодо tracking permissions'
                ],
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = MeestProvider;
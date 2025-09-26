// apps/api/src/providers/SATProvider.js - ПОВНІСТЮ ВИПРАВЛЕНО з публічним API
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation } = require('../utils/satTranslations');

class SATProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.SAT_API_KEY;
        
        // ВИПРАВЛЕНО: Публічний endpoint без авторизації (ПРІОРИТЕТ)
        this.publicUrl = 'https://urm.sat.ua/openws/hs/api/v1.0';
        
        // Авторизований endpoint як fallback
        this.authUrl = 'https://api.sat.ua/study/hs/api/v1.0';
        
        this.webTrackingUrl = 'https://www.sat.ua/tracking';
        
        console.log('SAT Provider initialized:', {
            hasApiKey: !!this.apiKey,
            publicUrl: this.publicUrl,
            authUrl: this.authUrl
        });
    }

    /**
     * Генерує різні формати номерів для спроб з SAT API
     */
    generateNumberFormats(trackingNumber) {
        const number = trackingNumber.trim();
        const formats = [];
        
        // 1. Оригінальний формат
        formats.push(number);
        
        // 2. З пробілами через кожні 3 цифри (029 000 710)
        if (/^\d+$/.test(number)) {
            const withSpaces = number.replace(/(\d{3})(?=\d)/g, '$1 ');
            formats.push(withSpaces.trim());
        }
        
        // 3. Формат XXX-XXX-XXX
        if (/^\d{9}$/.test(number)) {
            const withDashes = `${number.slice(0,3)}-${number.slice(3,6)}-${number.slice(6)}`;
            formats.push(withDashes);
        }
        
        // 4. Без ведучих нулів
        if (number.startsWith('0')) {
            const withoutLeadingZero = number.replace(/^0+/, '');
            if (withoutLeadingZero.length > 0) {
                formats.push(withoutLeadingZero);
            }
        }
        
        // 5. З додаванням нулів (якщо коротший)
        if (number.length < 9 && /^\d+$/.test(number)) {
            const padded = number.padStart(9, '0');
            formats.push(padded);
        }
        
        // Видаляємо дублікати
        return [...new Set(formats)];
    }

    async track(trackingNumber, options = {}) {
        console.log(`SAT Provider: Tracking ${trackingNumber} with dual strategy`);
        const startTime = Date.now();
        
        try {
            // СТРАТЕГІЯ 1: Публічний API (ПРІОРИТЕТ - без авторизації)
            console.log('SAT: Trying Strategy 1 - Public API (no auth)');
            const publicResult = await this.tryPublicAPI(trackingNumber);
            if (publicResult.success) {
                console.log(`SAT: Public API success in ${Date.now() - startTime}ms`);
                return publicResult;
            }
            
            // СТРАТЕГІЯ 2: Авторизований API (fallback)
            if (this.apiKey) {
                console.log('SAT: Trying Strategy 2 - Authorized API');
                const authResult = await this.tryAuthorizedAPI(trackingNumber);
                if (authResult.success) {
                    console.log(`SAT: Authorized API success in ${Date.now() - startTime}ms`);
                    return authResult;
                }
            }

            // Якщо обидві стратегії не спрацювали
            return {
                success: false,
                error: 'SAT: Номер відправлення не знайдено в жодній SAT системі',
                provider: this.name,
                trackingNumber: trackingNumber,
                strategiesTried: ['Public API', this.apiKey ? 'Authorized API' : 'Authorized API (no key)'],
                responseTime: Date.now() - startTime
            };

        } catch (error) {
            console.error(`SAT Provider error for ${trackingNumber}:`, error.message);
            return {
                success: false,
                error: `SAT API unavailable: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber,
                responseTime: Date.now() - startTime
            };
        }
    }

    /**
     * НОВИЙ МЕТОД: Публічний SAT API без авторизації
     */
    async tryPublicAPI(trackingNumber) {
        const numberFormats = this.generateNumberFormats(trackingNumber);
        
        for (const numberFormat of numberFormats) {
            console.log(`SAT Public: Trying format: ${numberFormat}`);
            
            try {
                const url = `${this.publicUrl}/tracking/json`;
                
                const response = await this.makeRequest(url, {
                    method: 'GET',
                    params: {
                        number: numberFormat
                        // ВАЖЛИВО: БЕЗ apiKey параметру для публічного endpoint
                    },
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'PandaTrack/2.0'
                    },
                    timeout: 15000
                });

                console.log(`SAT Public API Response for ${numberFormat}:`, JSON.stringify(response.data, null, 2));

                // Перевіряємо структуру відповіді
                if (response.data && this.isValidSATResponse(response.data)) {
                    return this.normalizeSATResponse(response.data, trackingNumber, 'public');
                }
                
                // Якщо не знайдено, спробуємо наступний формат
                if (this.isNotFoundResponse(response.data)) {
                    console.log(`SAT Public: Format ${numberFormat} not found, trying next...`);
                    continue;
                }
                
            } catch (error) {
                console.warn(`SAT Public API error for ${numberFormat}:`, error.message);
                
                // Якщо це не 404, то справжня помилка
                if (!error.response || error.response.status !== 404) {
                    throw error;
                }
                
                continue;
            }
        }

        return {
            success: false,
            error: 'SAT Public API: Номер не знайдено',
            api: 'public',
            formatsAttempted: numberFormats
        };
    }

    /**
     * ОНОВЛЕНИЙ МЕТОД: Авторизований SAT API як fallback
     */
    async tryAuthorizedAPI(trackingNumber) {
        const numberFormats = this.generateNumberFormats(trackingNumber);
        
        for (const numberFormat of numberFormats) {
            console.log(`SAT Authorized: Trying format: ${numberFormat}`);
            
            try {
                const url = `${this.authUrl}/tracking/json`;
                
                const response = await this.makeRequest(url, {
                    method: 'GET',
                    params: {
                        number: numberFormat,
                        apiKey: this.apiKey
                    },
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'PandaTrack/2.0'
                    },
                    timeout: 15000
                });

                console.log(`SAT Authorized API Response for ${numberFormat}:`, JSON.stringify(response.data, null, 2));

                if (response.data && this.isValidSATResponse(response.data)) {
                    return this.normalizeSATResponse(response.data, trackingNumber, 'authorized');
                }
                
                if (this.isNotFoundResponse(response.data)) {
                    console.log(`SAT Authorized: Format ${numberFormat} not found, trying next...`);
                    continue;
                }
                
            } catch (error) {
                console.warn(`SAT Authorized API error for ${numberFormat}:`, error.message);
                
                if (!error.response || error.response.status !== 404) {
                    throw error;
                }
                
                continue;
            }
        }

        return {
            success: false,
            error: 'SAT Authorized API: Номер не знайдено або немає доступу',
            api: 'authorized',
            formatsAttempted: numberFormats
        };
    }

    /**
     * Перевіряє чи є відповідь валідною SAT відповіддю з даними
     */
    isValidSATResponse(data) {
        // Успішна відповідь з даними
        if (data.success === "true" && data.data) {
            return true;
        }
        
        // Альтернативний формат з success: true
        if (data.success === true && data.data) {
            return true;
        }
        
        // Якщо data без success wrapper, але є номер
        if (data.number || data.trackingNumber || data.states) {
            return true;
        }
        
        return false;
    }

    /**
     * Перевіряє чи це помилка "не знайдено"
     */
    isNotFoundResponse(data) {
        if (data && data.success === "false" && data.error) {
            return data.error.code === "PD2" || data.error.text?.includes("не знайдена");
        }
        return false;
    }

    normalizeSATResponse(data, trackingNumber, apiType) {
        try {
            // ВИПРАВЛЕНО: SAT API повертає data як масив
            let actualData = data.data || data;
            
            // Якщо data це масив, беремо перший елемент
            if (Array.isArray(actualData) && actualData.length > 0) {
                actualData = actualData[0];
            }
            
            console.log(`SAT: Processing data for ${trackingNumber}:`, {
                hasStates: !!(actualData.states),
                statesCount: actualData.states?.length || 0,
                currentStatus: actualData.currentStatus
            });
            
            // Будуємо події з states масиву
            const events = this.buildEventsFromStates(actualData.states || []);
            
            // Поточний статус
            const currentStatus = actualData.currentStatus || actualData.status || 'Невідомо';
            const normalizedStatus = this.mapSATStatus(currentStatus);
            
            // Метадані
            const metadata = {
                weight: actualData.weight,
                volume: actualData.volume,
                seatsAmount: actualData.seatsAmount,
                width: actualData.width,
                length: actualData.length,
                height: actualData.height,
                cargoType: actualData.cargoType,
                serviceType: actualData.type,
                sum: actualData.sum,
                rspFrom: actualData.rspFrom,
                rspTo: actualData.rspTo,
                apiType: apiType // public або authorized
            };

            return {
                success: true,
                data: {
                    trackingNumber: trackingNumber,
                    carrier: 'SAT Satellite Express',
                    status: translateStatus(currentStatus),
                    normalizedStatus: normalizedStatus,
                    statusCode: normalizedStatus,
                    lastUpdate: this.getLastEventDate(events),
                    events: events,
                    estimatedDelivery: actualData.arrivalDate ? this.parseDate(actualData.arrivalDate) : null,
                    shipmentDate: actualData.date ? this.parseDate(actualData.date) : null,
                    ...metadata,
                    raw: actualData
                },
                provider: this.name,
                cost: 0,
                supportsInternational: false,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('SAT response normalization error:', error.message);
            return {
                success: false,
                error: `Failed to process SAT response: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber
            };
        }
    }

    buildEventsFromStates(states) {
        console.log(`SAT: buildEventsFromStates called with:`, states);
        
        const events = [];
        
        if (!Array.isArray(states)) {
            console.log(`SAT: states is not an array:`, typeof states);
            return events;
        }
        
        states.forEach((state, index) => {
            console.log(`SAT: Processing state ${index}:`, state);
            
            const status = state.status || 'Невідомо';
            const town = state.town || state.city || '';
            const rsp = state.rsp || '';
            
            // Будуємо повну локацію
            const fullLocation = rsp ? `${town}, ${rsp}` : town;
            
            const event = {
                date: this.parseDate(state.date),
                status: translateStatus(status),
                description: translateStatus(status),
                location: translateLocation(fullLocation),
                statusCode: this.mapSATStatus(status),
                originalStatus: status,
                source: 'SAT Satellite Express',
                confidence: 1
            };
            
            events.push(event);
            console.log(`SAT: Created event:`, event);
        });

        // Сортуємо події по даті (найстаріші перші для timeline)
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        console.log(`SAT: Built ${events.length} events from ${states.length} states`);
        return events;
    }

    mapSATStatus(status) {
        if (!status) return 'unknown';
        
        const statusLower = status.toLowerCase();
        
        // Доставлені статуси
        if (statusLower.includes('выдан') || statusLower.includes('видано') || 
            statusLower.includes('получен') || statusLower.includes('отримано')) {
            return 'delivered';
        }
        
        // В дорозі/транзиті
        if (statusLower.includes('вышел') || statusLower.includes('виїхав') || 
            statusLower.includes('в пути') || statusLower.includes('дорозі') ||
            statusLower.includes('курьер') || statusLower.includes('кур\'єр')) {
            return 'in_transit';
        }
        
        // Прибув/готовий до видачі
        if (statusLower.includes('поступил') || statusLower.includes('прибув') ||
            statusLower.includes('склад') || statusLower.includes('відділенн')) {
            return 'at_destination';
        }
        
        // Прийнято
        if (statusLower.includes('принят') || statusLower.includes('прийнято')) {
            return 'accepted';
        }
        
        // Проблеми
        if (statusLower.includes('возврат') || statusLower.includes('отказ') ||
            statusLower.includes('повернення') || statusLower.includes('відмова')) {
            return 'exception';
        }
        
        return 'in_transit'; // За замовчуванням
    }

    parseDate(dateString) {
        if (!dateString) return new Date().toISOString();
        
        try {
            // SAT повертає дати в форматі dd.mm.yyyy або yyyy-mm-dd
            if (dateString.includes('.')) {
                const [day, month, year] = dateString.split('.');
                const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
            }
            
            // Fallback для інших форматів
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    getLastEventDate(events) {
        if (events.length === 0) return new Date().toISOString();
        
        // Події відсортовані за датою, беремо останню
        return events[events.length - 1].date;
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Специфічні SAT префікси з реальних прикладів
        if (/^SAT\d{8,12}$/.test(number)) return true;
        if (/^ST\d{10,12}$/.test(number)) return true;
        if (/^SATELLITE\d{6,10}$/.test(number)) return true;
        
        // Реальні формати SAT згідно з прикладами
        if (/^029\d{6}$/.test(number)) return true;  // 029000710
        if (/^001\d{6}$/.test(number)) return true;  // 001000288
        if (/^0\d{8}$/.test(number)) return true;    // 9-digit starting with 0
        
        // Додаткові формати з документації
        if (/^02[0-9]\d{7}$/.test(number)) return true;   // 020xxxxxxx
        if (/^03[0-9]\d{7}$/.test(number)) return true;   // 030xxxxxxx
        
        return false;
    }

    async healthCheck() {
        const results = {
            status: 'ok',
            provider: this.name,
            strategies: [],
            timestamp: new Date().toISOString()
        };

        // Тестуємо публічний API
        try {
            const publicTest = await this.makeRequest(`${this.publicUrl}/tracking/json`, {
                method: 'GET',
                params: { number: 'test123456' },
                headers: { 'Accept': 'application/json' },
                timeout: 10000
            });
            
            results.strategies.push({
                name: 'Public API',
                status: 'ok',
                url: this.publicUrl,
                requiresAuth: false,
                responseCode: publicTest.status
            });
            
        } catch (error) {
            results.strategies.push({
                name: 'Public API',
                status: 'error',
                url: this.publicUrl,
                error: error.message,
                requiresAuth: false
            });
        }

        // Тестуємо авторизований API
        if (this.apiKey) {
            try {
                const authTest = await this.makeRequest(`${this.authUrl}/tracking/json`, {
                    method: 'GET',
                    params: { 
                        number: 'test123456',
                        apiKey: this.apiKey 
                    },
                    headers: { 'Accept': 'application/json' },
                    timeout: 10000
                });
                
                results.strategies.push({
                    name: 'Authorized API',
                    status: 'ok',
                    url: this.authUrl,
                    requiresAuth: true,
                    responseCode: authTest.status
                });
                
            } catch (error) {
                results.strategies.push({
                    name: 'Authorized API',
                    status: 'error',
                    url: this.authUrl,
                    error: error.message,
                    requiresAuth: true
                });
            }
        } else {
            results.strategies.push({
                name: 'Authorized API',
                status: 'unavailable',
                reason: 'No API key configured',
                requiresAuth: true
            });
        }

        // Загальний статус на основі стратегій
        const hasWorkingStrategy = results.strategies.some(s => s.status === 'ok');
        results.status = hasWorkingStrategy ? 'ok' : 'error';

        return results;
    }
}

module.exports = SATProvider;
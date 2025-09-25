// apps/api/src/providers/SATProvider.js - ПОВНІСТЮ ПЕРЕПИСАНО ЗА ДОКУМЕНТАЦІЄЮ
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation } = require('../utils/satTranslations');

class SATProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.SAT_API_KEY;
        
        // ВИПРАВЛЕНО: URL згідно з офіційною документацією SAT
        this.baseUrl = 'https://api.sat.ua/study/hs/api/v1.0';
        this.webTrackingUrl = 'https://www.sat.ua/tracking';
        
        if (!this.apiKey) {
            throw new Error('SAT API key not configured');
        }
    }

    /**
     * Генерує різні формати номерів для спроб з SAT API
     * @param {string} trackingNumber - Оригінальний номер
     * @returns {Array<string>} - Масив форматів для спроби
     */
    generateNumberFormats(trackingNumber) {
        const number = trackingNumber.trim();
        const formats = [];
        
        // 1. Оригінальний формат
        formats.push(number);
        
        // 2. З пробілами через кожні 3 цифри (029 000 710)
        if (/^\d+$/.test(number)) {
            const withSpaces = number.replace(/(\d{3})(?=\d)/g, '$1 ');
            formats.push(withSpaces);
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
        console.log(`SAT Provider: Tracking ${trackingNumber} with API key`);
        
        try {
            // Спробуємо різні формати номерів
            const numberFormats = this.generateNumberFormats(trackingNumber);
            
            for (const numberFormat of numberFormats) {
                console.log(`SAT: Trying format: ${numberFormat}`);
                
                const url = `${this.baseUrl}/tracking/json`;
                
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

                console.log(`SAT API Response for ${numberFormat}:`, JSON.stringify(response.data, null, 2));

                // Перевіряємо структуру відповіді згідно з документацією
                if (response.data && response.data.success && response.data.data) {
                    return this.normalizeSATResponse(response.data.data, trackingNumber);
                }

                // Якщо data без success wrapper
                if (response.data && response.data.number) {
                    return this.normalizeSATResponse(response.data, trackingNumber);
                }
                
                // Перевіряємо чи це помилка "не знайдено"
                if (response.data && response.data.success === "false") {
                    const error = response.data.error;
                    if (error && error.code === "PD2") {
                        console.log(`SAT: Format ${numberFormat} not found, trying next...`);
                        continue; // Спробуємо наступний формат
                    }
                }
            }

            // Якщо жоден формат не знайшов результат
            return {
                success: false,
                error: 'SAT: Номер відправлення не знайдено в жодному з форматів',
                provider: this.name,
                trackingNumber: trackingNumber,
                attemptedFormats: numberFormats
            };

        } catch (error) {
            console.error(`SAT Provider error for ${trackingNumber}:`, error.message);
            
            if (error.response) {
                const status = error.response.status;
                const statusText = error.response.statusText;
                
                if (status === 404) {
                    return {
                        success: false,
                        error: 'SAT: Номер відправлення не знайдено',
                        provider: this.name,
                        trackingNumber: trackingNumber
                    };
                }
                
                if (status === 401 || status === 403) {
                    return {
                        success: false,
                        error: 'SAT: Недійсний API ключ або доступ заборонено',
                        provider: this.name,
                        trackingNumber: trackingNumber
                    };
                }
                
                return {
                    success: false,
                    error: `SAT API HTTP ${status}: ${statusText}`,
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            throw new Error(`SAT API unavailable: ${error.message}`);
        }
    }

    normalizeSATResponse(data, trackingNumber) {
        try {
            // Будуємо події з states масиву згідно з документацією
            const events = this.buildEventsFromStates(data.states || []);
            
            // Поточний статус з currentStatus поля
            const currentStatus = data.currentStatus || 'Невідомо';
            const normalizedStatus = this.mapSATStatus(currentStatus);
            
            // Метадані з документації
            const metadata = {
                weight: data.weight,
                volume: data.volume,
                seatsAmount: data.seatsAmount,
                width: data.width,
                length: data.length,
                height: data.height,
                cargoType: data.cargoType,
                serviceType: data.type,
                sum: data.sum,
                rspFrom: data.rspFrom,
                rspTo: data.rspTo
            };

            return {
                success: true,
                data: {
                    trackingNumber: trackingNumber,
                    carrier: 'SAT Satellite Express',
                    status: this.translateStatus(currentStatus),
                    normalizedStatus: normalizedStatus,
                    statusCode: normalizedStatus,
                    lastUpdate: this.getLastEventDate(events),
                    events: events,
                    estimatedDelivery: data.arrivalDate ? this.parseDate(data.arrivalDate) : null,
                    shipmentDate: data.date ? this.parseDate(data.date) : null,
                    ...metadata,
                    raw: data
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
        const events = [];
        
        if (!Array.isArray(states)) {
            return events;
        }
        
        states.forEach(state => {
            const status = state.status || 'Невідомо';
            events.push({
                date: this.parseDate(state.date),
                status: this.translateStatus(status),
                description: this.translateStatus(status),
                location: translateLocation(state.town || ''),
                statusCode: this.mapSATStatus(status),
                originalStatus: status
            });
        });

        // Сортуємо події по даті (найновіші перші для відображення)
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        console.log(`SAT: Built ${events.length} events from states`);
        return events;
    }

    translateStatus(status) {
        // Використовуємо зовнішній файл перекладів
        return translateStatus(status);
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
            // SAT повертає дати в форматі dd.mm.yyyy
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
        
        // Події вже відсортовані по даті (найновіші перші)
        return events[0].date;
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
            // Тестуємо API з неіснуючим номером для перевірки з'єднання
            const response = await this.makeRequest(`${this.baseUrl}/tracking/json`, {
                method: 'GET',
                params: {
                    number: 'test123456',
                    apiKey: this.apiKey
                },
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 10000
            });
            
            // Навіть якщо номер не знайдено, API працює
            return {
                status: 'ok',
                provider: this.name,
                apiVersion: 'v1.0',
                features: ['Tracking', 'States History', 'Metadata'],
                apiKeyValid: !!this.apiKey,
                responseCode: response.status,
                baseUrl: this.baseUrl,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'error',
                provider: this.name,
                error: error.message,
                apiKeyProvided: !!this.apiKey,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = SATProvider;
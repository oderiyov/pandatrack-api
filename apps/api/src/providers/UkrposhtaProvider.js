// apps/api/src/providers/UkrposhtaProvider.js
const BaseProvider = require('./BaseProvider');

class UkrposhtaProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.bearer = process.env.UKRPOSHTA_STATUS_BEARER;
        // Видаляємо зайві токени - потрібен тільки Bearer
        
        if (!this.bearer) {
            console.warn('Ukrposhta Bearer token not configured, provider will be disabled');
        }
    }

    async track(trackingNumber, options = {}) {
        if (!this.bearer) {
            throw new Error('Ukrposhta Bearer token not configured');
        }

        try {
            // Використовуємо правильний формат з документації
            const url = `https://www.ukrposhta.ua/status-tracking/0.0.1/statuses?barcode=${trackingNumber}`;
            
            const response = await this.makeRequest(url, {
                method: 'GET',
                headers: {
                    // Тільки Bearer token згідно з документацією
                    'Authorization': `Bearer ${this.bearer}`,
                    'Content-Type': 'application/json'
                    // Видалили 'token' header - його немає в документації
                }
            });

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                return this.normalizeUkrposhtaResponse(response.data, trackingNumber);
            }

            return {
                success: false,
                error: 'Ukrposhta tracking number not found',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            
            // Детальніша обробка помилок
            if (error.response?.status === 502) {
                throw new Error(`${this.name} API temporarily unavailable (502 Bad Gateway)`);
            }
            if (error.response?.status === 401) {
                throw new Error(`${this.name} authentication failed - check Bearer token`);
            }
            if (error.response?.status === 404) {
                throw new Error(`${this.name} tracking number not found`);
            }
            
            throw new Error(`${this.name} API error: ${error.message}`);
        }
    }

    async trackBulk(trackingNumbers) {
        if (!this.bearer) {
            throw new Error('Ukrposhta Bearer token not configured');
        }

        try {
            // Використовуємо bulk endpoint з документації
            const response = await this.makeRequest(
                'https://www.ukrposhta.ua/status-tracking/0.0.1/statuses/last',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.bearer}`,
                        'Content-Type': 'application/json'
                    },
                    // Формат згідно з документацією - просто масив номерів
                    data: trackingNumbers
                }
            );

            if (response.data && Array.isArray(response.data)) {
                return response.data.map(item => 
                    this.normalizeUkrposhtaResponse([item], item.barcode)
                );
            }

            return trackingNumbers.map(number => ({
                success: false,
                error: 'Not found in bulk response',
                provider: this.name,
                trackingNumber: number
            }));

        } catch (error) {
            // Fallback до індивідуальних запитів
            console.warn('Bulk request failed, falling back to individual requests:', error.message);
            return await Promise.allSettled(
                trackingNumbers.map(number => this.track(number))
            );
        }
    }

    normalizeUkrposhtaResponse(data, trackingNumber) {
        // data - це масив статусів згідно з документацією
        const events = data.map(status => ({
            date: status.date,
            status: status.eventName,
            location: status.name || status.address || '',
            description: status.eventName || '',
            statusCode: status.event,
            country: status.country,
            reason: status.eventReason,
            step: status.step
        }));

        // Сортуємо по step для правильного порядку
        events.sort((a, b) => b.step - a.step);
        
        const latestStatus = data.find(s => s.step === Math.max(...data.map(s => s.step)));
        
        // Мапінг статусів згідно з Додатком Б документації
        const statusMapping = {
            41000: 'delivered',     // Відправлення вручено
            48000: 'delivered',     // Міжнародне відправлення вручено
            41010: 'returned',      // Вручено відправнику (повернення)
            31200: 'returning',     // Повернення відправлення
            31300: 'forwarding',    // Перенаправлене
            31400: 'exception',     // Невдала спроба вручення
            21700: 'in_transit',    // У відділенні
            21500: 'in_transit',    // Відправлено до відділення
            20700: 'in_transit',    // На сортувальному центрі
            20800: 'in_transit',    // Відправлення посилки
            10100: 'accepted',      // Прийняте у відділенні
            10600: 'cancelled',     // Прийом скасовано
            10602: 'cancelled',     // Прийом скасовано
            21400: 'storage'        // На зберіганні
        };

        const statusCode = latestStatus?.event;
        const normalizedStatus = statusMapping[statusCode] || 'in_transit';
        
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'ukrposhta',
                status: latestStatus?.eventName || 'Unknown',
                statusCode: statusCode,
                normalizedStatus: normalizedStatus,
                lastUpdate: latestStatus?.date || new Date().toISOString(),
                events: events,
                estimatedDelivery: null, // Укрпошта не надає ETA
                // Додаткові дані для міжнародних відправлень
                mailType: latestStatus?.mailType,
                country: latestStatus?.country,
                raw: data
            },
            provider: this.name,
            cost: 0, // Безкоштовно
            supportsInternational: true,
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Згідно з документацією:
        // 1. Українські внутрішні номери (14 цифр)
        if (/^[0-9]{14}$/.test(number)) return true;
        
        // 2. Міжнародні UPU формати що закінчуються на UA
        if (/^[A-Z]{2}\d{9}UA$/.test(number)) return true;
        
        // 3. Міжнародні формати (обробляються через UPU Global Track & Trace)
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) return true;
        
        // 4. Фільтр згідно з розділом 6 документації
        // Не обробляємо відправлення що починаються з 'U' та не закінчуються на 'UA' або 'CN'
        if (/^U/.test(number) && !/UA$|CN$/.test(number)) return false;
        
        // Не обробляємо відправлення що починаються з 'L' та не закінчуються на 'UA', 'CN' або 'FR'
        if (/^L/.test(number) && !/UA$|CN$|FR$/.test(number)) return false;
        
        // 5. Експрес форми
        if (/^(EM|CP|RG)\d{9}UA$/.test(number)) return true;
        
        return false;
    }

    async healthCheck() {
        if (!this.bearer) {
            return {
                status: 'error',
                provider: this.name,
                error: 'Bearer token not configured',
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Тестуємо з простим запитом
            const testNumber = '0500100031143'; // Номер з прикладу документації
            const response = await this.makeRequest(
                `https://www.ukrposhta.ua/status-tracking/0.0.1/statuses?barcode=${testNumber}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.bearer}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            
            // Навіть якщо номер не знайдений, API повинен відповісти без 502
            const isHealthy = response.status !== 502 && response.status !== 401;
            
            return {
                status: isHealthy ? 'ok' : 'error',
                provider: this.name,
                bearerValid: !!this.bearer,
                apiResponse: response.status,
                responseTime: response.responseTime || null,
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

    // Метод для перевірки підтримуваних країн згідно з документацією
    getSupportedCountries() {
        return {
            // Згідно з розділом 6 документації
            supported: ['UA', 'CN'], // Україна та Китай
            note: 'Service tracks shipments from Ukraine and China according to official documentation'
        };
    }
}

module.exports = UkrposhtaProvider;
const BaseProvider = require('./BaseProvider');
const { translateStatus, translateLocation } = require('../utils/ukrposhtaTranslations');

class UkrposhtaProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.bearer = process.env.UKRPOSHTA_STATUS_BEARER;
        this.baseUrl = 'https://www.ukrposhta.ua/status-tracking/0.0.1';
        
        // Різні endpoints для різних типів запитів
        this.endpoints = {
            single: '/statuses',
            last: '/statuses/last', 
            bulk: '/statuses/last',
            route: '/barcodes/{barcode}/route'
        };
        
        if (!this.bearer) {
            console.warn('Ukrposhta Bearer token not configured');
        }
    }

    async track(trackingNumber, options = {}) {
        if (!this.bearer) {
            throw new Error('Ukrposhta Bearer token not configured');
        }

        // ВИПРАВЛЕНО: Правильний порядок стратегій - повна історія спочатку
        const strategies = [
            () => this.tryFullEndpoint(trackingNumber),      // 1. /statuses - ПОВНА ІСТОРІЯ
            () => this.tryFullEndpointUA(trackingNumber),    // 2. /statuses українською 
            () => this.tryLastEndpoint(trackingNumber),      // 3. /statuses/last - fallback
            () => this.tryWithoutLang(trackingNumber),       // 4. без lang параметра
            () => this.tryBulkEndpoint([trackingNumber])     // 5. POST запит
        ];

        let lastError = null;

        for (const strategy of strategies) {
            try {
                const result = await strategy();
                if (result.success && result.data.events && result.data.events.length > 0) {
                    console.log(`Ukrposhta: успішний запит стратегією ${strategy.name}, подій: ${result.data.events.length}`);
                    return result;
                }
            } catch (error) {
                console.warn(`Ukrposhta strategy failed: ${error.message}`);
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
            error: 'Укрпошта: Номер не знайдено в жодному endpoint',
            provider: this.name,
            trackingNumber: trackingNumber
        };
    }

    async tryFullEndpoint(trackingNumber) {
        // ПРІОРИТЕТ: Повна історія англійською
        const url = `${this.baseUrl}/statuses?barcode=${trackingNumber}&lang=en`;
        
        const response = await this.makeSimpleRequest(url, {
            'Authorization': `Bearer ${this.bearer}`,
            'Cache-Control': 'no-cache'
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`Ukrposhta: Отримано ${response.data.length} статусів з /statuses англійською`);
            return this.normalizeUkrposhtaResponse(response.data, trackingNumber);
        }

        return { success: false };
    }

    async tryFullEndpointUA(trackingNumber) {
        // Повна історія українською (без lang=en)
        const url = `${this.baseUrl}/statuses?barcode=${trackingNumber}`;
        
        const response = await this.makeSimpleRequest(url, {
            'Authorization': `Bearer ${this.bearer}`,
            'Cache-Control': 'no-cache'
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`Ukrposhta: Отримано ${response.data.length} статусів з /statuses українською`);
            return this.normalizeUkrposhtaResponse(response.data, trackingNumber, true);
        }

        return { success: false };
    }

    async tryLastEndpoint(trackingNumber) {
        // Fallback: тільки останній статус
        const url = `${this.baseUrl}/statuses/last?barcode=${trackingNumber}&lang=en`;
        
        const response = await this.makeSimpleRequest(url, {
            'Authorization': `Bearer ${this.bearer}`,
            'Cache-Control': 'no-cache'
        });

        if (response.data && response.data.barcode) {
            console.log('Ukrposhta: Fallback /statuses/last успішний (тільки останній статус)');
            const dataArray = Array.isArray(response.data) ? response.data : [response.data];
            return this.normalizeUkrposhtaResponse(dataArray, trackingNumber);
        }

        return { success: false };
    }

    async tryWithoutLang(trackingNumber) {
        // Fallback без lang параметра
        const url = `${this.baseUrl}/statuses/last?barcode=${trackingNumber}`;
        
        const response = await this.makeSimpleRequest(url, {
            'Authorization': `Bearer ${this.bearer}`,
            'Cache-Control': 'no-cache'
        });

        if (response.data && response.data.barcode) {
            const dataArray = Array.isArray(response.data) ? response.data : [response.data];
            return this.normalizeUkrposhtaResponse(dataArray, trackingNumber, true);
        }

        return { success: false };
    }

    async tryBulkEndpoint(trackingNumbers) {
        try {
            // POST запит для bulk
            const response = await this.makeRequest(`${this.baseUrl}/statuses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.bearer}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                data: trackingNumbers,  // Просто масив рядків згідно з документацією
                timeout: 30000
            });

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                console.log(`Ukrposhta: Bulk POST отримав ${response.data.length} статусів`);
                return this.normalizeUkrposhtaResponse(response.data, trackingNumbers[0]);
            }

            return { success: false };

        } catch (error) {
            throw new Error(`Bulk request failed: ${error.message}`);
        }
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
            // Health check тестуємо повний endpoint
            const url = `${this.baseUrl}/statuses?barcode=0500100031143&lang=en`;
            
            const response = await this.makeSimpleRequest(url, {
                'Authorization': `Bearer ${this.bearer}`
            });
            
            return {
                status: 'ok',
                provider: this.name,
                bearerValid: true,
                responseCode: response.status,
                responseTime: response.responseTime,
                endpoint: '/statuses (full history)',
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            // Навіть 404 означає що API працює
            if (error.response?.status === 404) {
                return {
                    status: 'ok',
                    provider: this.name,
                    note: 'API доступний (404 для тестового номера нормально)',
                    responseCode: 404,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                status: 'error',
                provider: this.name,
                error: `${error.response?.status || 'Timeout'}: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    normalizeUkrposhtaResponse(data, trackingNumber, isUkrainian = false) {
        // Сортуємо за step (номер кроку) - від найранішого до найпізнішого
        const sortedData = data.sort((a, b) => a.step - b.step);
        
        const events = sortedData.map(status => {
            const originalStatus = status.eventName || 'Unknown Event';
            const originalLocation = status.name || status.index || '';
            
            // Якщо дані українською - перекладаємо на українську
            const translatedStatus = translateStatus(originalStatus);
            const translatedLocation = translateLocation(originalLocation);
            
            return {
                date: this.parseISODate(status.date),
                status: translatedStatus,
                location: translatedLocation,
                description: translatedStatus,
                statusCode: status.event?.toString(),
                country: status.country === 'Україна' ? 'UKRAINE' : (status.country || 'UKRAINE'),
                reason: status.eventReason,
                step: status.step,
                mailType: status.mailType,
                indexOrder: status.indexOrder
            };
        });

        // Останній статус (найбільший step)
        const latestStatus = sortedData[sortedData.length - 1];
        
        const statusMapping = {
            41000: 'delivered',
            48000: 'delivered', 
            41010: 'returned',
            31200: 'returning',
            31300: 'forwarding',
            31400: 'exception',
            21700: 'at_pickup',    // В відділенні для отримання
            21500: 'out_for_delivery', // Відправлено до відділення
            20700: 'in_transit',   // Надходження до центру
            20800: 'in_transit',   // Відправлення з центру
            20900: 'in_transit',   // Відправлення до ВПЗ
            10100: 'accepted',     // Прийнято
            10600: 'cancelled',
            10602: 'cancelled',
            10603: 'cancelled',
            21400: 'storage'       // На зберіганні
        };

        const statusCode = latestStatus?.event;
        const normalizedStatus = statusMapping[statusCode] || 'in_transit';
        
        // Перекладений статус для відображення
        const displayStatus = translateStatus(latestStatus?.eventName || 'Unknown Status');
        
        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'Укрпошта',  // Українська назва
                status: displayStatus,
                statusCode: statusCode?.toString(),
                normalizedStatus: normalizedStatus,
                lastUpdate: latestStatus?.date || new Date().toISOString(),
                events: events,
                estimatedDelivery: null,
                mailType: latestStatus?.mailType,
                country: latestStatus?.country === 'Україна' ? 'UKRAINE' : (latestStatus?.country || 'UKRAINE'),
                destinationCountry: 'UKRAINE',
                daysInTransit: this.calculateDaysInTransit(sortedData),
                totalEvents: events.length,
                raw: data
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            timestamp: new Date().toISOString()
        };
    }

    parseISODate(dateString) {
        if (!dateString) return new Date().toISOString();
        
        try {
            // Укрпошта повертає дати в форматі "2017-07-27T16:33:00"
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    calculateDaysInTransit(statusArray) {
        if (!statusArray || statusArray.length === 0) return 0;

        const firstStatus = statusArray[0];
        const lastStatus = statusArray[statusArray.length - 1];
        
        if (!firstStatus?.date) return 0;
        
        const startDate = new Date(firstStatus.date);
        const endDate = lastStatus?.date ? new Date(lastStatus.date) : new Date();
        
        if (isNaN(startDate.getTime())) return 0;
        
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Розширені формати згідно з документацією Укрпошти + фільтри
        const patterns = [
            /^[0-9]{13}$/,                    // 13 цифр 
            /^[0-9]{14}$/,                    // Внутрішні українські (14 цифр)
            /^[A-Z]{2}\d{9}UA$/,             // Українські міжнародні
            /^[A-Z]{2}\d{9}[A-Z]{2}$/,       // Загальні міжнародні UPU
            /^(EM|CP|RG|EE)\d{9}UA$/,        // Експрес українські
            /^(RA|RB|RC|RD|RE|RG|RH|RI|RJ|RK|RL|RM|RN|RO|RP|RQ|RR|RS|RT|RU|RV|RW|RX|RY|RZ)\d{9}[A-Z]{2}$/, // Рекомендовані
            /^(CA|CB|CC|CD|CE|CF|CG|CH|CI|CJ|CK|CL|CM|CN|CO|CP|CQ|CR|CS|CT|CU|CV|CW|CX|CY|CZ)\d{9}[A-Z]{2}$/, // Пакети
            /^(EA|EB|EC|ED|EE|EF|EG|EH|EI|EJ|EK|EL|EM|EN|EO|EP|EQ|ER|ES|ET|EU|EV|EW|EX|EY|EZ)\d{9}[A-Z]{2}$/, // Експрес
            /^(LA|LB|LC|LD|LE|LF|LG|LH|LI|LJ|LK|LL|LM|LN|LO|LP|LQ|LR|LS|LT|LU|LV|LW|LX|LY|LZ)\d{9}[A-Z]{2}$/, // Логістика
        ];

        // Фільтри згідно з розділом 6 документації Укрпошти
        // Не обробляємо відправлення що починаються з 'U' та не закінчуються на 'UA' або 'CN'
        if (/^U/.test(number) && !/UA$|CN$/.test(number)) {
            return false;
        }
        
        // Не обробляємо відправлення що починаються з 'L' та не закінчуються на 'UA', 'CN' або 'FR'
        if (/^L/.test(number) && !/UA$|CN$|FR$/.test(number)) {
            return false;
        }

        return patterns.some(pattern => pattern.test(number));
    }

    // Додатковий метод для отримання маршруту
    async getRoute(trackingNumber) {
        if (!this.bearer) {
            throw new Error('Bearer token not configured');
        }

        try {
            const url = `${this.baseUrl}/barcodes/${trackingNumber}/route`;
            
            const response = await this.makeSimpleRequest(url, {
                'Authorization': `Bearer ${this.bearer}`
            });

            return response.data;
        } catch (error) {
            console.warn(`Failed to get route for ${trackingNumber}:`, error.message);
            return null;
        }
    }
}

module.exports = UkrposhtaProvider;
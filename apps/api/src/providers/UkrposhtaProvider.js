const BaseProvider = require('./BaseProvider');

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

        // Спробуємо кілька стратегій
        const strategies = [
            () => this.tryLastEndpoint(trackingNumber),
            () => this.tryFullEndpoint(trackingNumber),
            () => this.tryWithoutLang(trackingNumber),
            () => this.tryBulkEndpoint([trackingNumber])
        ];

        let lastError = null;

        for (const strategy of strategies) {
            try {
                const result = await strategy();
                if (result.success) {
                    console.log(`Ukrposhta: успішний запит стратегією ${strategy.name}`);
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

    async tryLastEndpoint(trackingNumber) {
        // Використовуємо makeSimpleRequest для простих GET запитів
        const url = `${this.baseUrl}/statuses/last?barcode=${trackingNumber}&lang=en`;
        
        const response = await this.makeSimpleRequest(url, {
            'Authorization': `Bearer ${this.bearer}`,
            'Cache-Control': 'no-cache'
        });

        if (response.data && response.data.barcode) {
            const dataArray = Array.isArray(response.data) ? response.data : [response.data];
            return this.normalizeUkrposhtaResponse(dataArray, trackingNumber);
        }

        return { success: false };
    }

    async tryFullEndpoint(trackingNumber) {
        // Використовуємо makeSimpleRequest для отримання повної історії
        const url = `${this.baseUrl}/statuses?barcode=${trackingNumber}&lang=en`;
        
        const response = await this.makeSimpleRequest(url, {
            'Authorization': `Bearer ${this.bearer}`,
            'Cache-Control': 'no-cache'
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            return this.normalizeUkrposhtaResponse(response.data, trackingNumber);
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
            return this.normalizeUkrposhtaResponse(dataArray, trackingNumber);
        }

        return { success: false };
    }

    async tryBulkEndpoint(trackingNumbers) {
        try {
            // Використовуємо старий makeRequest для POST з правильним форматом
            const response = await this.makeRequest(`${this.baseUrl}/statuses/last`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.bearer}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                data: trackingNumbers.map(num => ({ barcode: num })),
                timeout: 30000
            });

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
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
            // Швидкий health check з makeSimpleRequest
            const url = `${this.baseUrl}/statuses/last?barcode=0500100031143&lang=en`;
            
            const response = await this.makeSimpleRequest(url, {
                'Authorization': `Bearer ${this.bearer}`
            });
            
            return {
                status: 'ok',
                provider: this.name,
                bearerValid: true,
                responseCode: response.status,
                responseTime: response.responseTime,
                endpoint: '/statuses/last',
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

    normalizeUkrposhtaResponse(data, trackingNumber) {
        const events = data.map(status => ({
            date: status.date,
            status: status.eventName,
            location: status.name || '',
            description: status.eventName || '',
            statusCode: status.event,
            country: status.country,
            reason: status.eventReason,
            step: status.step
        }));

        events.sort((a, b) => b.step - a.step);
        
        const latestStatus = data.find(s => s.step === Math.max(...data.map(s => s.step)));
        
        const statusMapping = {
            41000: 'delivered',
            48000: 'delivered',
            41010: 'returned',
            31200: 'returning',
            31300: 'forwarding',
            31400: 'exception',
            21700: 'in_transit',
            21500: 'in_transit',
            20700: 'in_transit',
            20800: 'in_transit',
            10100: 'accepted',
            10600: 'cancelled',
            10602: 'cancelled',
            21400: 'storage'
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
                estimatedDelivery: null,
                mailType: latestStatus?.mailType,
                country: latestStatus?.country,
                raw: data
            },
            provider: this.name,
            cost: 0,
            supportsInternational: true,
            timestamp: new Date().toISOString()
        };
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Розширені формати згідно з документацією Укрпошти + фільтри
        const patterns = [
            /^[0-9]{13}$/,                    // 13 цифр (bulk endpoint помилка)
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
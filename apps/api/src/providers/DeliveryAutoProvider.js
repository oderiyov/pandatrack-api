// apps/api/src/providers/DeliveryAutoProvider.js - FIXED VERSION
const BaseProvider = require('./BaseProvider');
const crypto = require('crypto');

class DeliveryAutoProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.publicKey = process.env.DELIVERY_AUTO_PUBLIC_KEY;
        this.secretKey = process.env.DELIVERY_AUTO_SECRET_KEY;
        this.baseUrl = 'https://www.delivery-auto.com/api/v4';
        
        console.log(`DeliveryAutoProvider initialized:`, {
            hasPublicKey: !!this.publicKey,
            hasSecretKey: !!this.secretKey,
            publicKeyPrefix: this.publicKey ? this.publicKey.substring(0,10) + '...' : 'MISSING',
            baseUrl: this.baseUrl
        });
        
        if (!this.publicKey || !this.secretKey) {
            console.warn('Delivery Auto API credentials not configured');
        }
    }

    async track(trackingNumber, options = {}) {
        console.log(`DeliveryAuto: Starting track for ${trackingNumber}`);
        
        if (!this.publicKey || !this.secretKey) {
            throw new Error('Delivery Auto API credentials not configured');
        }

        try {
            // ПРАВИЛЬНИЙ ENDPOINT: GetReceiptDetails з простим GET параметром
            const url = `${this.baseUrl}/Public/GetReceiptDetails?culture=uk-UA&number=${trackingNumber}`;
            
            // Генеруємо HMAC авторизацію згідно документації
            const timestamp = Date.now();
            const hmacSignature = this.generateHMACSignature(this.publicKey, timestamp);
            const authHeader = `amx ${this.publicKey}:${timestamp}:${hmacSignature}`;

            console.log(`DeliveryAuto: Making request to ${url}`);
            console.log(`DeliveryAuto: HMAC Authorization header: ${authHeader.substring(0, 50)}...`);

            const response = await this.makeRequest(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'PandaTrack/2.0',
                    'HMACAuthorization': authHeader  // КРИТИЧНО: правильний header
                },
                timeout: 15000
            });

            console.log(`DeliveryAuto: Response status: ${response.status}`);
            console.log(`DeliveryAuto: Response data:`, JSON.stringify(response.data, null, 2));

            if (response.data && response.data.status === true && response.data.data) {
                return this.normalizeDeliveryAutoResponse(response.data.data, trackingNumber);
            }

            // Обробляємо помилки від API
            if (response.data && response.data.status === false) {
                return {
                    success: false,
                    error: `Delivery Auto: ${response.data.message || 'Номер не знайдено'}`,
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }

            return {
                success: false,
                error: 'Delivery Auto: Неочікувана структура відповіді',
                provider: this.name,
                trackingNumber: trackingNumber,
                debug: response.data
            };

        } catch (error) {
            console.error(`DeliveryAuto API error:`, error.message);
            
            if (error.response?.status === 401) {
                return {
                    success: false,
                    error: 'Delivery Auto: Помилка авторизації - неправильні API ключі',
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: 'Delivery Auto: Номер не знайдено',
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            return {
                success: false,
                error: `Delivery Auto: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber
            };
        }
    }

    generateHMACSignature(apiKey, timestamp) {
        // Згідно документації: хешуємо apiKey + timestamp
        const dataToSign = apiKey + timestamp.toString();
        const signature = crypto.createHmac('sha1', this.secretKey).update(dataToSign).digest('hex');
        
        console.log(`DeliveryAuto: HMAC signature generated for timestamp ${timestamp}`);
        return signature.toUpperCase(); // Delivery Auto може вимагати uppercase
    }

    normalizeDeliveryAutoResponse(data, trackingNumber) {
        console.log(`DeliveryAuto: Normalizing API response:`, JSON.stringify(data, null, 2));
        
        const events = [];
        
        // Обробляємо структуру відповіді згідно документації API
        // Основна подія - поточний статус
        const currentEvent = {
            date: data.ReceiveDate || data.SendDate || new Date().toISOString(),
            status: data.StatusesDecoding || data.Status || 'Невідомо',
            location: this.buildLocation(data),
            description: data.StatusesDecoding || data.Status || 'Статус посилки',
            statusCode: data.Status || 'unknown'
        };
        events.push(currentEvent);

        // Якщо є дата відправки, додаємо подію відправки
        if (data.SendDate && data.SendDate !== data.ReceiveDate) {
            events.unshift({
                date: data.SendDate,
                status: 'Прийнято до відправки',
                location: data.SenderWarehouseName || '',
                description: 'Посилка прийнята на складі відправки',
                statusCode: 'accepted'
            });
        }

        const currentStatus = data.StatusesDecoding || this.translateStatus(data.Status) || 'Невідомо';

        console.log(`DeliveryAuto: Normalized ${events.length} events, current status: ${currentStatus}`);

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'Delivery Auto',
                status: currentStatus,
                normalizedStatus: this.mapStatus(currentStatus),
                statusCode: data.Status,
                lastUpdate: data.ReceiveDate || data.SendDate || new Date().toISOString(),
                events: events.reverse(), // Сортуємо по часу (старіші спочатку)
                senderWarehouse: data.SenderWarehouseName,
                recipientWarehouse: data.RecepientWarehouseName,
                weight: data.Weight,
                volume: data.Volume,
                totalCost: data.TotalCost,
                currency: this.translateCurrency(data.Currency),
                isPaid: data.PaymentStatus,
                codAmount: data.codCost,
                sites: data.Sites,
                raw: data
            },
            provider: this.name,
            cost: 0, // Нативний API, безкоштовно
            supportsInternational: false,
            timestamp: new Date().toISOString()
        };
    }

    buildLocation(data) {
        const parts = [];
        if (data.RecepientWarehouseName) parts.push(data.RecepientWarehouseName);
        if (data.CityReceiveName) parts.push(data.CityReceiveName);
        if (data.SenderWarehouseName && !parts.length) parts.push(data.SenderWarehouseName);
        if (data.CitySendName && !parts.length) parts.push(data.CitySendName);
        return parts.join(', ') || '';
    }

    translateStatus(statusCode) {
        // Переклади статусів згідно документації (розділ 8.1)
        const statusMap = {
            '0': 'Видана',
            '1': 'Прийнята',
            '2': 'В дорозі',
            '3': 'Прибула',
            '4': 'Зарезервована',
            '8': 'Зарезервована'
        };
        return statusMap[statusCode?.toString()] || statusCode;
    }

    translateCurrency(currencyCode) {
        // Коди валют згідно документації (розділ 8.2)
        if (currencyCode === 100000000 || currencyCode === '100000000') {
            return 'UAH';
        }
        return currencyCode;
    }

    mapStatus(status) {
        if (!status) return 'unknown';
        
        const s = status.toLowerCase();
        
        if (s.includes('видан') || s.includes('доставлен') || s.includes('вручен') || s.includes('отримано')) return 'delivered';
        if (s.includes('прийнят') || s.includes('створен') || s.includes('зареєстрован')) return 'accepted';
        if (s.includes('в дорозі') || s.includes('транспорт') || s.includes('переміщ')) return 'in_transit';
        if (s.includes('прибул') || s.includes('на відділенн') || s.includes('готов')) return 'at_destination';
        if (s.includes('зарезервован') || s.includes('очікує')) return 'pending';
        if (s.includes('неуспішн') || s.includes('проблем') || s.includes('помилк')) return 'exception';
        if (s.includes('повернен') || s.includes('відхилен')) return 'returning';
        
        return 'in_transit';
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Специфічні префікси Delivery Auto (з високою точністю)
        if (/^058\d{7}$/.test(number)) return true;  // 0580402558
        if (/^057\d{7}$/.test(number)) return true;
        if (/^056\d{7}$/.test(number)) return true;
        if (/^055\d{7}$/.test(number)) return true;
        
        // Фірмові коди
        if (/^DA\d{8,12}$/.test(number)) return true;
        if (/^\d{8,10}DA$/.test(number)) return true;
        if (/^DELIVERY\d{6,10}$/.test(number)) return true;
        if (/^DLV\d{8,12}$/.test(number)) return true;
        
        // Загальні формати з НИЗЬКИМ пріоритетом
        if (/^0\d{9}$/.test(number)) return true;
        if (/^\d{10}$/.test(number)) return true;
        
        return false;
    }

    async healthCheck() {
        if (!this.publicKey || !this.secretKey) {
            return {
                status: 'error',
                provider: this.name,
                error: 'API credentials missing',
                timestamp: new Date().toISOString()
            };
        }

        try {
            // Тестуємо з невалідним номером для перевірки API доступності
            const testNumber = '0000000000';
            const url = `${this.baseUrl}/Public/GetReceiptDetails?culture=uk-UA&number=${testNumber}`;
            
            const timestamp = Date.now();
            const hmacSignature = this.generateHMACSignature(this.publicKey, timestamp);
            const authHeader = `amx ${this.publicKey}:${timestamp}:${hmacSignature}`;
            
            const response = await this.makeRequest(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'HMACAuthorization': authHeader
                },
                timeout: 8000
            });
            
            // API доступний, якщо отримали структуровану відповідь
            const isApiWorking = response.data && typeof response.data.status !== 'undefined';
            
            return {
                status: isApiWorking ? 'ok' : 'error',
                provider: this.name,
                credentialsValid: true,
                responseCode: response.status,
                note: isApiWorking ? 'API accessible with HMAC auth' : 'Unexpected API response',
                apiUrl: this.baseUrl,
                testResponse: response.data,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'error',
                provider: this.name,
                error: error.message,
                note: 'Check API credentials and network connectivity',
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = DeliveryAutoProvider;
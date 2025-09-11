// apps/api/src/providers/NovaPoshtaProvider.js - ПОВНА ВЕРСІЯ З ВИПРАВЛЕННЯМИ
const BaseProvider = require('./BaseProvider');

class NovaPoshtaProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.NOVAPOSHTA_API_KEY;
        this.baseUrl = 'https://api.novaposhta.ua/v2.0/json/';
        this.name = 'Nova Poshta';
        
        if (!this.apiKey) {
            console.warn('Nova Poshta API key not found in environment variables');
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            // Використовуємо офіційний Nova Poshta API v2.0
            const requestBody = {
                apiKey: this.apiKey,
                modelName: "TrackingDocument",
                calledMethod: "getStatusDocuments",
                methodProperties: {
                    Documents: [{
                        DocumentNumber: trackingNumber,
                        Phone: "" // Можна додати телефон для розширеної інформації
                    }]
                }
            };

            const response = await this.makeRequest(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: requestBody,
                timeout: 15000
            });

            console.log('Nova Poshta API v2.0 response:', JSON.stringify(response.data, null, 2));

            // Перевіряємо структуру відповіді згідно документації
            if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
                return this.normalizeOfficialApiResponse(response.data.data[0], trackingNumber);
            } else {
                const errorMessage = response.data?.errors?.[0] || 'No tracking data found';
                return {
                    success: false,
                    error: `Nova Poshta: ${errorMessage}`,
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            
            if (error.response) {
                return {
                    success: false,
                    error: `Nova Poshta API HTTP ${error.response.status}: ${error.response.statusText}`,
                    provider: this.name,
                    trackingNumber: trackingNumber
                };
            }
            
            throw new Error(`${this.name} API unavailable: ${error.message}`);
        }
    }

    normalizeOfficialApiResponse(data, trackingNumber) {
        try {
            // Створюємо події з даних офіційного API
            const events = this.buildEventsFromOfficialData(data);
            const status = this.determineStatus(data);
            const metadata = this.extractOfficialMetadata(data);

            return {
                success: true,
                data: {
                    trackingNumber: trackingNumber,
                    carrier: 'Nova Poshta',
                    status: status.description,
                    normalizedStatus: this.mapOfficialStatus(data.StatusCode),
                    statusCode: data.StatusCode,
                    lastUpdate: this.parseDate(data.TrackingUpdateDate) || new Date().toISOString(),
                    events: events,
                    estimatedDelivery: this.parseDate(data.ScheduledDeliveryDate),
                    actualDelivery: this.parseDate(data.ActualDeliveryDate),
                    daysInTransit: this.calculateDaysFromOfficialData(data),
                    sender: {
                        city: data.CitySender,
                        address: data.SenderAddress,
                        warehouse: data.WarehouseSender
                    },
                    recipient: {
                        city: data.CityRecipient,
                        address: data.RecipientAddress,
                        warehouse: data.WarehouseRecipient
                    },
                    weight: data.DocumentWeight,
                    cost: data.DocumentCost,
                    ...metadata,
                    raw: data
                },
                provider: this.name,
                cost: 0,
                supportsInternational: true,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Nova Poshta response normalization error:', error.message);
            return {
                success: false,
                error: `Failed to process Nova Poshta response: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber
            };
        }
    }

    buildEventsFromOfficialData(data) {
        const events = [];
        
        // 1. Створення накладної
        if (data.DateCreated) {
            const createdDate = this.parseDate(data.DateCreated);
            if (createdDate) {
                events.push({
                    date: createdDate,
                    status: 'Накладна створена',
                    description: 'Відправник оформив накладну',
                    location: data.CitySender || 'Unknown',
                    statusCode: '1',
                    eventType: 'created'
                });
            }
        }

        // 2. Сканування/прийняття
        if (data.DateScan && data.DateScan !== '0001-01-01 00:00:00') {
            const scanDate = this.parseDate(data.DateScan);
            if (scanDate) {
                events.push({
                    date: scanDate,
                    status: 'Відправлення прийнято',
                    description: 'Накладна відскановано в систему',
                    location: data.CitySender || 'Unknown',
                    statusCode: '4',
                    eventType: 'accepted'
                });
            }
        }

        // 3. Поточний статус доставки (найважливіша подія)
        if (data.Status && data.StatusCode) {
            let currentEventDate = null;
            
            // Для доставлених посилок використовуємо RecipientDateTime
            if (data.StatusCode === '9' || data.StatusCode === '10' || data.StatusCode === '11') {
                currentEventDate = this.parseDate(data.RecipientDateTime);
            }
            
            // Для інших статусів пробуємо різні дати
            if (!currentEventDate) {
                currentEventDate = this.parseDate(data.ActualDeliveryDate) ||
                                 this.parseDate(data.TrackingUpdateDate);
            }
            
            // Створюємо подію тільки якщо є валідна дата
            if (currentEventDate) {
                events.push({
                    date: currentEventDate,
                    status: data.Status,
                    description: data.Status,
                    location: this.buildLocationFromOfficialData(data),
                    statusCode: data.StatusCode,
                    eventType: 'current'
                });
            }
        }

        // 4. Додаткові події на основі дат
        if (data.ScheduledDeliveryDate && data.ScheduledDeliveryDate !== data.RecipientDateTime) {
            const scheduledDate = this.parseDate(data.ScheduledDeliveryDate);
            if (scheduledDate) {
                events.push({
                    date: scheduledDate,
                    status: 'Заплановано до доставки',
                    description: 'Очікувана дата доставки',
                    location: data.CityRecipient || 'Unknown',
                    statusCode: '6',
                    eventType: 'scheduled'
                });
            }
        }

        // Видаляємо дублікати та сортуємо
        const uniqueEvents = events
            .filter(event => event.date !== null) // Тільки валідні дати
            .filter((event, index, arr) => 
                index === arr.findIndex(e => 
                    Math.abs(new Date(e.date) - new Date(event.date)) < 60000 && // В межах хвилини
                    e.statusCode === event.statusCode
                )
            );

        return uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    determineStatus(data) {
        return {
            description: data.Status || 'Unknown Status',
            code: data.StatusCode || '999'
        };
    }

    extractOfficialMetadata(data) {
        return {
            payerType: data.PayerType,
            serviceType: data.ServiceType,
            cargoDescription: data.CargoDescriptionString,
            announcedPrice: data.AnnouncedPrice,
            afterpayment: data.AfterpaymentOnGoodsCost,
            seatsAmount: data.SeatsAmount,
            packageType: data.Packaging
        };
    }

    buildLocationFromOfficialData(data) {
        if (data.StatusCode === '9' || data.StatusCode === '10') {
            // Доставлено
            return `${data.CityRecipient}, ${data.WarehouseRecipient}`;
        } else if (data.StatusCode === '7' || data.StatusCode === '8') {
            // На відділенні
            return `${data.CityRecipient}, ${data.WarehouseRecipient}`;
        } else {
            // В дорозі або на складі відправника
            return data.CitySender || 'Unknown Location';
        }
    }

    calculateDaysFromOfficialData(data) {
        const createdDate = this.parseDate(data.DateCreated);
        const currentDate = this.parseDate(data.ActualDeliveryDate) || 
                           this.parseDate(data.RecipientDateTime) ||
                           this.parseDate(data.TrackingUpdateDate) ||
                           new Date().toISOString();
        
        if (!createdDate) return 0;
        
        const start = new Date(createdDate);
        const end = new Date(currentDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    parseDate(dateString) {
        if (!dateString || dateString === '0001-01-01 00:00:00' || dateString === '') return null;
        
        
        try {
            let date;
            
            // Nova Poshta повертає дати в різних форматах
            if (dateString.includes('-') && dateString.includes(' ')) {
                // Формат: "24-06-2025 14:31:32"
                const [datePart, timePart] = dateString.split(' ');
                const [day, month, year] = datePart.split('-');
                date = new Date(`${year}-${month}-${day}T${timePart}.000Z`);
            } else if (dateString.includes('.') && dateString.includes(' ')) {
                // Формат: "25.06.2025 11:20:36"
                const [datePart, timePart] = dateString.split(' ');
                const [day, month, year] = datePart.split('.');
                date = new Date(`${year}-${month}-${day}T${timePart}.000Z`);
            } else if (dateString.includes(':') && dateString.includes('.')) {
                // Формат: "11:20 25.06.2025"
                const parts = dateString.split(' ');
                if (parts.length === 2) {
                    const timePart = parts[0] + ':00'; // Додаємо секунди
                    const datePart = parts[1];
                    const [day, month, year] = datePart.split('.');
                    date = new Date(`${year}-${month}-${day}T${timePart}.000Z`);
                }
            } else if (dateString.includes('.') && !dateString.includes(' ')) {
                // Формат: "25.06.2025" (тільки дата)
                const [day, month, year] = dateString.split('.');
                date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
            } else {
                // Пробуємо стандартний парсинг (для ISO дат)
                date = new Date(dateString);
            }
            
            
            if (isNaN(date.getTime())) {
                console.warn('Invalid date format:', dateString);
                return null;
            }
            
            return date.toISOString();
        } catch (error) {
            console.warn('Date parsing error for:', dateString, error.message);
            return null;
        }
    }

    mapOfficialStatus(statusCode) {
        const statusMap = {
            '1': 'pending',      // Створено
            '3': 'not_found',    // Не знайдено
            '4': 'accepted',     // Прийнято
            '5': 'in_transit',   // В дорозі до міста
            '6': 'in_transit',   // У місті одержувача
            '7': 'at_pickup',    // Прибув на відділення
            '8': 'at_pickup',    // Завантажено в поштомат
            '9': 'delivered',    // Отримано
            '10': 'delivered',   // Отримано з грошовим переказом
            '11': 'delivered',   // Грошовий переказ видано
            '101': 'out_for_delivery', // На шляху до одержувача
            '102': 'returning',  // Відмова від отримання
            '103': 'refused',    // Відмова
            '104': 'redirected', // Змінено адресу
            '111': 'exception',  // Невдала доставка
            '112': 'exception'   // Доставка перенесена
        };

        return statusMap[statusCode] || 'unknown';
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim();
        
        // Nova Poshta формати
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
            // Тестуємо з невалідним номером щоб не витрачати ресурси
            const testBody = {
                apiKey: this.apiKey,
                modelName: "TrackingDocument",
                calledMethod: "getStatusDocuments",
                methodProperties: {
                    Documents: [{ DocumentNumber: "1234567890123", Phone: "" }]
                }
            };

            const response = await this.makeRequest(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: testBody,
                timeout: 10000
            });

            // Навіть якщо номер не знайдено, API працює
            return {
                status: 'ok',
                provider: this.name,
                apiVersion: 'v2.0',
                features: ['Official API', 'Status Tracking'],
                apiKeyValid: !!response.data,
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
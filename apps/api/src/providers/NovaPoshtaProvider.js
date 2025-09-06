// apps/api/src/providers/NovaPoshtaProvider.js
const BaseProvider = require('./BaseProvider');

class NovaPoshtaProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.NOVAPOSHTA_API_KEY;
        
        if (!this.apiKey) {
            console.warn('Nova Poshta API key not found in environment variables');
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            // ВИПРАВЛЕНИЙ: Використовуємо правильний API endpoint та параметри
            const response = await this.makeRequest('https://api.novaposhta.ua/v2.0/json/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    apiKey: this.apiKey,
                    modelName: "TrackingDocument",
                    calledMethod: "getStatusDocuments",
                    methodProperties: {
                        Documents: [{
                            DocumentNumber: trackingNumber
                            // Видалили Phone: "" - він не обов'язковий
                        }]
                    }
                }
            });

            console.log('Nova Poshta API response:', JSON.stringify(response.data, null, 2));

            // ВИПРАВЛЕНО: Кращу обробку відповідей
            if (response.data && response.data.success === true) {
                if (response.data.data && response.data.data.length > 0) {
                    const trackingData = response.data.data[0];
                    return this.normalizeNovaPoshtaResponse(trackingData, trackingNumber);
                } else {
                    // Номер не знайдено або немає даних
                    return {
                        success: false,
                        error: 'Nova Poshta: Tracking number not found or no tracking data available',
                        provider: this.name,
                        trackingNumber: trackingNumber,
                        details: response.data.errors || []
                    };
                }
            }

            // Обробка помилок API
            return {
                success: false,
                error: `Nova Poshta API error: ${response.data.errors ? response.data.errors.join(', ') : 'Unknown error'}`,
                provider: this.name,
                trackingNumber: trackingNumber,
                apiResponse: response.data
            };

        } catch (error) {
            console.error(`${this.name} API error:`, error.message);
            
            // Детальніша обробка помилок
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

    normalizeNovaPoshtaResponse(data, trackingNumber) {
        // ПОКРАЩЕНА: Обробка всіх можливих полів Nova Poshta
        const events = [];
        
        // Основні події з відповіді
        if (data.Status) {
            events.push({
                date: data.DateCreated || data.Date || new Date().toISOString(),
                status: data.Status,
                location: this.buildLocation(data),
                description: data.Status,
                statusCode: data.StatusCode
            });
        }

        // Додаткові події якщо є
        if (data.UndeliveryReasons) {
            events.push({
                date: data.DateCreated || new Date().toISOString(),
                status: 'Неуспішна доставка',
                location: this.buildLocation(data),
                description: data.UndeliveryReasons,
                statusCode: 'UNDELIVERED'
            });
        }

        // Визначаємо нормалізований статус
        const normalizedStatus = this.mapNovaPoshtaStatus(data.Status, data.StatusCode);

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'nova-poshta',
                status: data.Status || 'Unknown',
                normalizedStatus: normalizedStatus,
                statusCode: data.StatusCode,
                lastUpdate: data.DateCreated || data.Date || new Date().toISOString(),
                events: events,
                estimatedDelivery: data.ScheduledDeliveryDate || null,
                recipientCity: data.CityRecipient,
                senderCity: data.CitySender,
                weight: data.DocumentWeight,
                cost: data.DocumentCost,
                paymentMethod: data.PaymentMethod,
                raw: data
            },
            provider: this.name,
            cost: 0, // Nova Poshta API безкоштовний
            supportsInternational: false,
            timestamp: new Date().toISOString()
        };
    }

    // НОВИЙ: Збираємо локацію з доступних даних
    buildLocation(data) {
        const parts = [];
        
        if (data.CityRecipient) parts.push(data.CityRecipient);
        if (data.WarehouseRecipient) parts.push(`Відділення: ${data.WarehouseRecipient}`);
        if (data.CitySender && !data.CityRecipient) parts.push(data.CitySender);
        
        return parts.join(', ') || '';
    }

    // НОВИЙ: Мапінг статусів Nova Poshta
    mapNovaPoshtaStatus(status, statusCode) {
        if (!status) return 'unknown';
        
        const statusLower = status.toLowerCase();
        
        // Мапінг на основі тексту статусу
        if (statusLower.includes('отримано') || statusLower.includes('вручен')) return 'delivered';
        if (statusLower.includes('прийнято') || statusLower.includes('створено')) return 'accepted';
        if (statusLower.includes('відправлено') || statusLower.includes('транзит')) return 'in_transit';
        if (statusLower.includes('відділенн') || statusLower.includes('прибув')) return 'at_destination';
        if (statusLower.includes('неуспішна') || statusLower.includes('неможливо')) return 'exception';
        if (statusLower.includes('повернення')) return 'returning';
        
        // Мапінг на основі statusCode якщо є
        if (statusCode) {
            switch (statusCode) {
                case '1': return 'accepted';
                case '2': return 'in_transit';
                case '3': return 'at_destination';
                case '4': return 'delivered';
                case '5': return 'exception';
                case '6': return 'returning';
                default: return 'in_transit';
            }
        }
        
        return 'in_transit';
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim();
        
        // Nova Poshta формати:
        // 20XXXXXXXXXX - експрес-відправлення (14 цифр)
        // 59XXXXXXXXXX - поштомат (14 цифр)
        // Також можуть бути 13-15 цифр загалом
        
        return /^20\d{12,13}$/.test(number) || 
               /^59\d{12,13}$/.test(number) ||
               /^\d{13,15}$/.test(number); // Загальний формат для інших типів
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
            // Тестовий запит до API
            const testResponse = await this.makeRequest('https://api.novaposhta.ua/v2.0/json/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    apiKey: this.apiKey,
                    modelName: "Common",
                    calledMethod: "getTypesOfCounterparties"
                },
                timeout: 10000
            });

            const isHealthy = testResponse.data && testResponse.data.success === true;

            return {
                status: isHealthy ? 'ok' : 'error',
                provider: this.name,
                apiKeyValid: isHealthy,
                responseCode: testResponse.status,
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
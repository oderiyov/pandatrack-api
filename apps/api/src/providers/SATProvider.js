// apps/api/src/providers/SATProvider.js - ВИПРАВЛЕНА ВЕРСІЯ
const BaseProvider = require('./BaseProvider');

class SATProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.SAT_API_KEY;
        
        // ВИПРАВЛЕННЯ: Правильні endpoints SAT API
        this.baseUrl = 'https://api.sat.ua/study/hs/api/v1.0'; // Тестування
        this.prodUrl = 'http://urm.sat.ua/openws/hs/api/v1.0'; // Продакшн
        this.webTrackingUrl = 'https://www.sat.ua/tracking';
        
        if (!this.apiKey) {
            console.warn('SAT API key not configured - will use web fallback');
        }
    }

    async track(trackingNumber, options = {}) {
        try {
            // Спочатку пробуємо API (якщо є ключ)
            if (this.apiKey) {
                const apiResult = await this.tryAPITracking(trackingNumber);
                if (apiResult.success) {
                    return apiResult;
                }
            }
            
            // Fallback до web tracking
            return await this.tryWebTracking(trackingNumber);
            
        } catch (error) {
            console.error(`${this.name} error:`, error.message);
            throw new Error(`${this.name} unavailable: ${error.message}`);
        }
    }

    async tryAPITracking(trackingNumber) {
        try {
            // ВИПРАВЛЕННЯ: Правильний endpoint згідно з документацією
            const url = `${this.baseUrl}/tracking/json?number=${trackingNumber}&apiKey=${this.apiKey}`;
            
            const response = await this.makeRequest(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'PandaTrack/2.0'
                },
                timeout: 15000
            });

            if (response.data && response.data.success !== false) {
                return this.normalizeSATResponse(response.data, trackingNumber, 'api');
            }

            return {
                success: false,
                error: response.data?.message || 'SAT API: Номер не знайдено'
            };

        } catch (error) {
            console.warn(`SAT API failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async tryWebTracking(trackingNumber) {
        try {
            // ВИПРАВЛЕННЯ: Використовуємо GET запит до веб-трекінгу
            const url = `https://www.sat.ua/tracking?number=${encodeURIComponent(trackingNumber)}`;
            
            const response = await this.makeRequest(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml',
                    'User-Agent': 'Mozilla/5.0 (compatible; PandaTrack/2.0)'
                },
                timeout: 20000
            });

            const trackingData = this.parseHTMLResponse(response.data, trackingNumber);
            
            if (trackingData.found) {
                return this.normalizeSATResponse(trackingData, trackingNumber, 'web');
            }

            return {
                success: false,
                error: 'SAT: Номер відправлення не знайдено',
                provider: this.name,
                trackingNumber: trackingNumber
            };

        } catch (error) {
            return {
                success: false,
                error: `SAT web tracking failed: ${error.message}`,
                provider: this.name,
                trackingNumber: trackingNumber
            };
        }
    }

    async healthCheck() {
        if (!this.apiKey) {
            // Перевіряємо тільки web fallback
            try {
                const webResponse = await this.makeRequest('https://www.sat.ua/tracking', {
                    method: 'GET',
                    timeout: 5000
                });
                
                return {
                    status: 'warning',
                    provider: this.name,
                    message: 'API key missing - using web fallback only',
                    webFallbackWorking: webResponse.status < 500,
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                return {
                    status: 'error',
                    provider: this.name,
                    error: 'Both API and web fallback unavailable',
                    timestamp: new Date().toISOString()
                };
            }
        }

        try {
            // ВИПРАВЛЕННЯ: Тестуємо правильний API endpoint
            const response = await this.makeRequest(
                `${this.baseUrl}/tracking/json?number=test&apiKey=${this.apiKey}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                }
            );
            
            return {
                status: response.status < 500 ? 'ok' : 'error',
                provider: this.name,
                apiKeyValid: !!this.apiKey,
                responseCode: response.status,
                baseUrl: this.baseUrl,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            // Fallback до web перевірки
            try {
                const webResponse = await this.makeRequest('https://www.sat.ua/tracking', {
                    method: 'GET',
                    timeout: 5000
                });
                
                return {
                    status: 'warning',
                    provider: this.name,
                    apiError: error.message,
                    webFallbackWorking: webResponse.status < 500,
                    note: 'API unavailable, web fallback available',
                    timestamp: new Date().toISOString()
                };
                
            } catch (webError) {
                return {
                    status: 'error',
                    provider: this.name,
                    apiError: error.message,
                    webError: webError.message,
                    timestamp: new Date().toISOString()
                };
            }
        }
    }

    parseHTMLResponse(html, trackingNumber) {
        try {
            const statusMatch = html.match(/<div[^>]*class[^>]*status[^>]*>([^<]+)/i);
            const dateMatch = html.match(/<div[^>]*class[^>]*date[^>]*>([^<]+)/i);
            const locationMatch = html.match(/<div[^>]*class[^>]*location[^>]*>([^<]+)/i);
            
            const foundMatch = html.includes(trackingNumber) || 
                              html.includes('статус') || 
                              html.includes('відправлення');

            if (!foundMatch) {
                return { found: false };
            }

            return {
                found: true,
                status: statusMatch ? statusMatch[1].trim() : 'В обробці',
                lastUpdate: dateMatch ? dateMatch[1].trim() : new Date().toISOString(),
                location: locationMatch ? locationMatch[1].trim() : '',
                source: 'web'
            };

        } catch (error) {
            console.warn('SAT HTML parsing failed:', error.message);
            return { found: false };
        }
    }

    normalizeSATResponse(data, trackingNumber, source = 'api') {
        const events = [];
        
        if (data.history && Array.isArray(data.history)) {
            data.history.forEach(historyItem => {
                events.push({
                    date: historyItem.date || historyItem.dateTime || new Date().toISOString(),
                    status: historyItem.status || historyItem.statusName || 'Невідомо',
                    location: historyItem.location || historyItem.office || '',
                    description: historyItem.description || historyItem.status || '',
                    statusCode: historyItem.statusCode || historyItem.id
                });
            });
        }
        
        if (events.length === 0) {
            events.push({
                date: data.lastUpdate || data.date || new Date().toISOString(),
                status: data.status || 'В обробці',
                location: data.location || '',
                description: data.status || 'Відправлення в системі',
                statusCode: data.statusCode || 'processing'
            });
        }

        return {
            success: true,
            data: {
                trackingNumber: trackingNumber,
                carrier: 'sat',
                status: data.status || 'В обробці',
                normalizedStatus: this.mapSATStatus(data.status),
                statusCode: data.statusCode || data.status_code,
                lastUpdate: data.lastUpdate || data.last_update || new Date().toISOString(),
                events: events,
                estimatedDelivery: data.estimatedDelivery || data.estimated_delivery,
                senderCity: data.senderCity,
                recipientCity: data.recipientCity,
                service: data.serviceType || 'Стандартна доставка',
                raw: data
            },
            provider: this.name,
            cost: 0,
            supportsInternational: false,
            source: source,
            timestamp: new Date().toISOString()
        };
    }

    mapSATStatus(status) {
        if (!status) return 'unknown';
        
        const statusLower = status.toLowerCase();
        
        if (statusLower.includes('доставлен') || statusLower.includes('вручен') || statusLower.includes('отримано')) {
            return 'delivered';
        }
        if (statusLower.includes('прийнят') || statusLower.includes('створен') || statusLower.includes('в обробці')) {
            return 'accepted';
        }
        if (statusLower.includes('в дорозі') || statusLower.includes('транспорт') || statusLower.includes('відправлен')) {
            return 'in_transit';
        }
        if (statusLower.includes('на відділенн') || statusLower.includes('прибув') || statusLower.includes('готов')) {
            return 'at_destination';
        }
        if (statusLower.includes('неуспішн') || statusLower.includes('проблем') || statusLower.includes('затримк')) {
            return 'exception';
        }
        if (statusLower.includes('повернен') || statusLower.includes('відмов')) {
            return 'returning';
        }
        
        return 'in_transit';
    }

    canHandle(trackingNumber, carrierCode = null) {
        const number = trackingNumber.trim().toUpperCase();
        
        if (/^SAT\d{8,12}$/.test(number)) return true;
        if (/^ST\d{10,12}$/.test(number)) return true;
        if (/^SATELLITE\d{6,10}$/.test(number)) return true;
        if (/^\d{8,12}$/.test(number)) return true;
        
        return false;
    }
}

module.exports = SATProvider;
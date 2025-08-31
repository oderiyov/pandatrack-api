// apps/api/src/services/trackingService.js - Модернізована версія
const axios = require('axios');
const crypto = require('crypto');

class TrackingService {
    constructor(redisClient, supabaseClient) {
        this.redis = redisClient;
        this.supabase = supabaseClient;
        
        // API ключі
        this.trackingMoreKey = process.env.TRACKINGMORE_API_KEY;
        this.novaPoshtaKey = process.env.NOVAPOSHTA_API_KEY;
        this.ukrposhtaKey = process.env.UKRPOSHTA_API_KEY;
        this.meestKey = process.env.MEEST_API_KEY;
        
        // Безпека
        this.encryptionKey = process.env.ENCRYPTION_KEY;
        this.trackingSalt = process.env.TRACKING_SALT;
        
        // Конфігурація провайдерів з квотами
        this.providers = {
            'nova-poshta': {
                primary: 'native',
                fallback: null, // TrackingMore не допоможе з Nova Poshta
                quota: { daily: 10000, used: 0 },
                enabled: true,
                cost: 0
            },
            'ukrposhta': {
                primary: 'trackingmore', // Поки через TrackingMore
                fallback: null,
                quota: { daily: 25, used: 0 }, // Частина TrackingMore ліміту
                enabled: true,
                cost: 0.019 // $0.019 per request через TrackingMore
            },
            'meest-express': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 25, used: 0 },
                enabled: true,
                cost: 0.019
            },
            'justin': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 20, used: 0 },
                enabled: true,
                cost: 0.019
            },
            'dhl': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 15, used: 0 },
                enabled: true,
                cost: 0.019
            },
            'fedex': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 10, used: 0 },
                enabled: true,
                cost: 0.019
            },
            'ups': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 5, used: 0 },
                enabled: true,
                cost: 0.019
            }
        };
        
        // Глобальні ліміти
        this.globalQuotas = {
            trackingmore: { 
                daily: parseInt(process.env.TRACKINGMORE_DAILY_LIMIT) || 100, 
                used: 0 
            },
            native_apis: { 
                daily: parseInt(process.env.NATIVE_API_DAILY_LIMIT) || 50000, 
                used: 0 
            }
        };
        
        // Ініціалізація квот з Redis при старті
        this.initializeQuotas();
    }

    // Ініціалізація квот з Redis
    async initializeQuotas() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const quotaKey = `quota:${today}`;
            const quotas = await this.redis.hGetAll(quotaKey);
            
            if (quotas.trackingmore_total) {
                this.globalQuotas.trackingmore.used = parseInt(quotas.trackingmore_total);
            }
            
            if (quotas.native_apis_total) {
                this.globalQuotas.native_apis.used = parseInt(quotas.native_apis_total);
            }
            
            // Ініціалізуємо використання по перевізниках
            Object.keys(this.providers).forEach(carrier => {
                if (quotas[carrier]) {
                    this.providers[carrier].quota.used = parseInt(quotas[carrier]);
                }
            });
            
        } catch (error) {
            console.warn('Failed to initialize quotas from Redis:', error.message);
        }
    }

    // Розширене автовизначення перевізника
    detectCarrier(trackingNumber) {
        const number = trackingNumber.trim().toUpperCase().replace(/\s+/g, '');
        
        // === УКРАЇНСЬКІ ПЕРЕВІЗНИКИ ===
        
        // Nova Poshta - найпоширеніші паттерни
        if (/^20\d{12}$/.test(number) || /^59\d{12}$/.test(number)) {
            return { 
                id: 1, 
                code: 'nova-poshta', 
                name: 'Nova Poshta', 
                api: 'native',
                confidence: 'high'
            };
        }
        
        // Ukrposhta - міжнародні та внутрішні
        if (/^[A-Z]{2}\d{9}UA$/.test(number) || /^EM\d{9}UA$/.test(number) || 
            /^CP\d{9}UA$/.test(number) || /^RG\d{9}UA$/.test(number)) {
            return { 
                id: 2, 
                code: 'ukrposhta', 
                name: 'Ukrposhta', 
                api: 'trackingmore',
                confidence: 'high'
            };
        }
        
        // Meest Express
        if (/^ME\d{10,12}$/.test(number) || /^M\d{8,10}$/.test(number) ||
            /^MEST\d{8,12}$/.test(number)) {
            return { 
                id: 3, 
                code: 'meest-express', 
                name: 'Meest Express', 
                api: 'trackingmore',
                confidence: 'high'
            };
        }
        
        // Justin - активно працює з 500+ відділеннями
        if (/^J\d{10,12}$/.test(number) || /^JU\d{8,12}$/.test(number) ||
            /^JUST\d{8,12}$/.test(number)) {
            return { 
                id: 4, 
                code: 'justin', 
                name: 'Justin', 
                api: 'trackingmore',
                confidence: 'high'
            };
        }
        
        // === МІЖНАРОДНІ ПЕРЕВІЗНИКИ ===
        
        // DHL - різні формати
        if (/^\d{10}$/.test(number) || /^\d{11}$/.test(number) || 
            /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number) || /^JD\d{18}$/.test(number)) {
            return { 
                id: 5, 
                code: 'dhl', 
                name: 'DHL', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // FedEx
        if (/^\d{12,14}$/.test(number) || /^\d{20}$/.test(number) ||
            /^\d{22}$/.test(number) || /^96\d{20}$/.test(number)) {
            return { 
                id: 6, 
                code: 'fedex', 
                name: 'FedEx', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // UPS
        if (/^1Z[A-Z0-9]{16}$/.test(number) || /^T\d{10}$/.test(number)) {
            return { 
                id: 7, 
                code: 'ups', 
                name: 'UPS', 
                api: 'trackingmore',
                confidence: 'high'
            };
        }
        
        // China Post (популярний для AliExpress/інших)
        if (/^[A-Z]{2}\d{9}CN$/.test(number) || /^[A-Z]{1}\d{8,12}$/.test(number)) {
            return { 
                id: 8, 
                code: 'china-post', 
                name: 'China Post', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // PostNL (популярний в EU)
        if (/^[A-Z]{2}\d{9}NL$/.test(number) || /^3S[A-Z0-9]{13}$/.test(number)) {
            return { 
                id: 9, 
                code: 'postnl', 
                name: 'PostNL', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // Deutsche Post (цільовий німецький ринок)
        if (/^[A-Z]{2}\d{9}DE$/.test(number) || /^00\d{18}$/.test(number)) {
            return { 
                id: 10, 
                code: 'deutsche-post', 
                name: 'Deutsche Post', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // Universal Postal Union format
        if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number)) {
            return { 
                id: null, 
                code: 'international-post', 
                name: 'International Post', 
                api: 'trackingmore',
                confidence: 'low'
            };
        }
        
        // Загальні числові номери
        if (/^\d{8,20}$/.test(number)) {
            return { 
                id: null, 
                code: 'auto-detect-numeric', 
                name: 'Auto-detect', 
                api: 'trackingmore',
                confidence: 'low'
            };
        }
        
        // Fallback для всіх інших
        return { 
            id: null, 
            code: 'unknown', 
            name: 'Unknown', 
            api: 'trackingmore',
            confidence: 'very-low'
        };
    }

    // Вибір провайдера API з урахуванням квот
    async selectApiProvider(carrierCode, forceProvider = null) {
        if (forceProvider) {
            return forceProvider;
        }

        const config = this.providers[carrierCode];
        if (!config || !config.enabled) {
            throw new Error(`Carrier ${carrierCode} is not supported`);
        }

        // Перевіряємо квоту перевізника
        if (config.quota.used >= config.quota.daily) {
            if (config.fallback) {
                console.warn(`Carrier ${carrierCode} quota exceeded, using fallback: ${config.fallback}`);
                return config.fallback;
            } else {
                throw new Error(`Daily quota exceeded for ${carrierCode} (${config.quota.used}/${config.quota.daily})`);
            }
        }

        // Перевіряємо глобальну квоту для TrackingMore
        if (config.primary === 'trackingmore') {
            if (this.globalQuotas.trackingmore.used >= this.globalQuotas.trackingmore.daily) {
                throw new Error(`TrackingMore daily quota exceeded (${this.globalQuotas.trackingmore.used}/${this.globalQuotas.trackingmore.daily})`);
            }
        }

        return config.primary;
    }

    // Безпечне шифрування (ВИПРАВЛЕНО)
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipherGCM('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'));
        cipher.setAAD(Buffer.from('pandatrack-v1'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    decrypt(text) {
        const [ivHex, authTagHex, encrypted] = text.split(':');
        
        if (!ivHex || !authTagHex || !encrypted) {
            throw new Error('Invalid encrypted data format');
        }
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipherGCM('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'));
        
        decipher.setAAD(Buffer.from('pandatrack-v1'));
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // Хешування для безпеки
    hashTrackingNumber(trackingNumber) {
        return crypto
            .createHmac('sha256', this.trackingSalt)
            .update(trackingNumber)
            .digest('hex')
            .substring(0, 16);
    }

    // Cache key generation
    getCacheKey(trackingNumber, carrierId) {
        const hash = this.hashTrackingNumber(trackingNumber);
        return `track:${carrierId}:${hash}`;
    }

    // Nova Poshta API (без змін - вже працює)
    async trackNovaPoshta(trackingNumber) {
        try {
            const response = await axios.post('https://api.novaposhta.ua/v2.0/json/', {
                apiKey: this.novaPoshtaKey,
                modelName: "TrackingDocument",
                calledMethod: "getStatusDocuments",
                methodProperties: {
                    Documents: [{
                        DocumentNumber: trackingNumber,
                        Phone: ""
                    }]
                }
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'PandaTrack/1.0'
                }
            });

            if (response.data.success && response.data.data.length > 0) {
                const tracking = response.data.data[0];
                return {
                    success: true,
                    data: {
                        trackingNumber: trackingNumber,
                        carrier: 'nova-poshta',
                        status: tracking.Status,
                        statusCode: tracking.StatusCode,
                        lastUpdate: new Date().toISOString(),
                        events: [{
                            date: tracking.DateCreated,
                            status: tracking.Status,
                            location: tracking.CitySender
                        }],
                        raw: tracking
                    }
                };
            }

            return {
                success: false,
                error: 'Tracking number not found',
                carrier: 'nova-poshta'
            };

        } catch (error) {
            console.error('Nova Poshta API error:', error.message);
            throw new Error('Nova Poshta API unavailable');
        }
    }

    // TrackingMore Universal API (покращений)
    async trackTrackingMore(trackingNumber, carrierCode = null) {
        try {
            // Покращена logіка вибору endpoint
            let endpoint;
            if (carrierCode && carrierCode !== 'auto-detect-numeric' && carrierCode !== 'unknown') {
                endpoint = `https://api.trackingmore.com/v3/trackings/${carrierCode}/${trackingNumber}`;
            } else {
                endpoint = `https://api.trackingmore.com/v3/trackings/detect/${trackingNumber}`;
            }

            const response = await axios.get(endpoint, {
                timeout: 15000,
                headers: {
                    'Tracking-Api-Key': this.trackingMoreKey,
                    'Content-Type': 'application/json',
                    'User-Agent': 'PandaTrack/1.0'
                }
            });

            if (response.data.code === 200 && response.data.data) {
                const tracking = response.data.data;
                return {
                    success: true,
                    data: {
                        trackingNumber: trackingNumber,
                        carrier: tracking.carrier_code || carrierCode || 'unknown',
                        status: tracking.delivery_status || 'Unknown',
                        statusCode: tracking.status_code,
                        lastUpdate: new Date().toISOString(),
                        events: tracking.origin_info?.trackinfo || [],
                        estimatedDelivery: tracking.scheduled_delivery_date,
                        raw: tracking
                    }
                };
            }

            return {
                success: false,
                error: response.data.message || 'Tracking number not found',
                carrier: carrierCode || 'auto-detect'
            };

        } catch (error) {
            console.error('TrackingMore API error:', error.message);
            throw new Error(`TrackingMore API unavailable: ${error.message}`);
        }
    }

    // Основна функція трекінгу з гібридною логікою
    async track(trackingNumber, userId = null, forceRefresh = false) {
        const startTime = Date.now();
        
        try {
            // Валідація
            if (!trackingNumber || trackingNumber.length < 8) {
                return {
                    success: false,
                    error: 'Invalid tracking number format'
                };
            }

            // Автовизначення перевізника
            const detectedCarrier = this.detectCarrier(trackingNumber);
            const cacheKey = this.getCacheKey(trackingNumber, detectedCarrier.code);

            // Перевірка кешу
            if (!forceRefresh) {
                try {
                    const cached = await this.redis.get(cacheKey);
                    if (cached) {
                        const data = JSON.parse(cached);
                        return {
                            success: true,
                            data: data,
                            cached: true,
                            responseTime: Date.now() - startTime
                        };
                    }
                } catch (cacheError) {
                    console.warn('Cache read error:', cacheError.message);
                }
            }

            // Вибір API провайдера
            const apiProvider = await this.selectApiProvider(detectedCarrier.code);
            
            let result;
            
            // Виконання трекінгу
            if (apiProvider === 'native') {
                if (detectedCarrier.code === 'nova-poshta') {
                    result = await this.trackNovaPoshta(trackingNumber);
                } else {
                    throw new Error(`Native API not implemented for ${detectedCarrier.code}`);
                }
            } else if (apiProvider === 'trackingmore') {
                result = await this.trackTrackingMore(trackingNumber, detectedCarrier.code);
            } else {
                throw new Error(`Unknown API provider: ${apiProvider}`);
            }

            if (result.success) {
                // Оновлення квот
                await this.updateQuotaUsage(detectedCarrier.code, apiProvider);
                
                // Кешування
                const ttl = this.calculateTTL(result.data.status);
                try {
                    await this.redis.setEx(cacheKey, ttl, JSON.stringify(result.data));
                } catch (cacheError) {
                    console.warn('Cache write error:', cacheError.message);
                }

                // Збереження в базу
                if (userId) {
                    await this.saveToDatabase(trackingNumber, result.data, userId);
                }

                return {
                    success: true,
                    data: result.data,
                    cached: false,
                    responseTime: Date.now() - startTime,
                    apiProvider: apiProvider,
                    quotaUsed: this.providers[detectedCarrier.code]?.quota.used || 0
                };
            }

            return {
                success: false,
                error: result.error || 'Tracking failed',
                carrier: detectedCarrier.code,
                responseTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('Tracking service error:', error);
            return {
                success: false,
                error: error.message || 'Internal tracking service error',
                responseTime: Date.now() - startTime
            };
        }
    }

    // Оновлення використання квоти
    async updateQuotaUsage(carrierCode, apiProvider) {
        try {
            const config = this.providers[carrierCode];
            if (config) {
                config.quota.used += 1;
            }
            
            if (apiProvider === 'trackingmore') {
                this.globalQuotas.trackingmore.used += 1;
            } else {
                this.globalQuotas.native_apis.used += 1;
            }
            
            // Зберігання в Redis
            const today = new Date().toISOString().split('T')[0];
            const quotaKey = `quota:${today}`;
            
            const quotaData = {
                trackingmore_total: this.globalQuotas.trackingmore.used,
                native_apis_total: this.globalQuotas.native_apis.used
            };
            
            if (config) {
                quotaData[carrierCode] = config.quota.used;
            }
            
            await this.redis.hSet(quotaKey, quotaData);
            
            // Встановлюємо TTL до кінця дня
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const secondsUntilMidnight = Math.floor((tomorrow - new Date()) / 1000);
            
            await this.redis.expire(quotaKey, secondsUntilMidnight);
            
        } catch (error) {
            console.error('Failed to update quota usage:', error.message);
        }
    }

    // TTL розрахунок для кешу
    calculateTTL(status) {
        const statusLower = (status || '').toLowerCase();
        
        if (statusLower.includes('delivered') || statusLower.includes('доставлен')) {
            return 86400; // 24 години
        }
        
        if (statusLower.includes('transit') || statusLower.includes('в пути')) {
            return 3600; // 1 година
        }
        
        if (statusLower.includes('created') || statusLower.includes('принят')) {
            return 14400; // 4 години
        }
        
        return 7200; // 2 години за замовчуванням
    }

    // Отримання статусу квот
    async getQuotaStatus() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const quotaKey = `quota:${today}`;
            const quotas = await this.redis.hGetAll(quotaKey);
            
            return {
                date: today,
                trackingmore: {
                    used: parseInt(quotas.trackingmore_total) || this.globalQuotas.trackingmore.used,
                    limit: this.globalQuotas.trackingmore.daily,
                    remaining: Math.max(0, this.globalQuotas.trackingmore.daily - (parseInt(quotas.trackingmore_total) || this.globalQuotas.trackingmore.used))
                },
                nativeApis: {
                    used: parseInt(quotas.native_apis_total) || this.globalQuotas.native_apis.used,
                    limit: this.globalQuotas.native_apis.daily
                },
                carriers: Object.keys(this.providers).reduce((acc, carrier) => {
                    const used = parseInt(quotas[carrier]) || this.providers[carrier].quota.used;
                    const config = this.providers[carrier];
                    acc[carrier] = {
                        used: used,
                        limit: config.quota.daily,
                        remaining: Math.max(0, config.quota.daily - used),
                        provider: config.primary,
                        enabled: config.enabled,
                        cost: config.cost
                    };
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Failed to get quota status:', error);
            return null;
        }
    }

    // Збереження в базу даних (без змін - вже працює)
    async saveToDatabase(trackingNumber, trackingData, userId) {
        try {
            const hashedNumber = this.hashTrackingNumber(trackingNumber);
            const encryptedNumber = this.encrypt(trackingNumber);
            
            const { data: existing } = await this.supabase
                .from('shipments')
                .select('id')
                .eq('tracking_hash', hashedNumber)
                .eq('user_id', userId)
                .single();

            if (existing) {
                await this.supabase
                    .from('shipments')
                    .update({
                        status: trackingData.status,
                        status_code: trackingData.statusCode,
                        last_update: trackingData.lastUpdate,
                        estimated_delivery: trackingData.estimatedDelivery,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (trackingData.events && trackingData.events.length > 0) {
                    const events = trackingData.events.map(event => ({
                        shipment_id: existing.id,
                        event_date: event.date || new Date().toISOString(),
                        status: event.status || trackingData.status,
                        location: event.location || '',
                        description: event.description || ''
                    }));

                    await this.supabase
                        .from('events')
                        .upsert(events, { 
                            onConflict: 'shipment_id,event_date,status',
                            ignoreDuplicates: true 
                        });
                }
            } else {
                const { data: shipment } = await this.supabase
                    .from('shipments')
                    .insert({
                        user_id: userId,
                        tracking_number: encryptedNumber,
                        tracking_hash: hashedNumber,
                        carrier_id: this.detectCarrier(trackingNumber).id,
                        status: trackingData.status,
                        status_code: trackingData.statusCode,
                        last_update: trackingData.lastUpdate,
                        estimated_delivery: trackingData.estimatedDelivery,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (shipment && trackingData.events && trackingData.events.length > 0) {
                    const events = trackingData.events.map(event => ({
                        shipment_id: shipment.id,
                        event_date: event.date || new Date().toISOString(),
                        status: event.status || trackingData.status,
                        location: event.location || '',
                        description: event.description || ''
                    }));

                    await this.supabase
                        .from('events')
                        .insert(events);
                }
            }
        } catch (error) {
            console.error('Database save error:', error);
        }
    }
}

module.exports = TrackingService;
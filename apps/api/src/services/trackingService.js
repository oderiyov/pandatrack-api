// apps/api/src/services/trackingService.js - Повна версія з усіма провайдерами
const axios = require('axios');
const crypto = require('crypto');

class TrackingService {
    constructor(redisClient, supabaseClient) {
        this.redis = redisClient;
        this.supabase = supabaseClient;
        
        // API ключі - всі провайдери
        this.trackingMoreKey = process.env.TRACKINGMORE_API_KEY;
        this.novaPoshtaKey = process.env.NOVAPOSHTA_API_KEY;
        this.ukrposhtaKey = process.env.UKRPOSHTA_API_KEY;
        this.meestKey = process.env.MEEST_API_KEY;
        this.dhlApiKey = process.env.DHL_API_KEY;
        this.dhlApiSecret = process.env.DHL_API_SECRET;
        this.deliveryAutoPublicKey = process.env.DELIVERY_AUTO_PUBLIC_KEY;
        this.deliveryAutoSecretKey = process.env.DELIVERY_AUTO_SECRET_KEY;
        this.satApiKey = process.env.SAT_API_KEY;
        
        // Безпека
        this.encryptionKey = process.env.ENCRYPTION_KEY;
        this.trackingSalt = process.env.TRACKING_SALT;
        
        // Конфігурація провайдерів з усіма новими API
        this.providers = {
            'nova-poshta': {
                primary: 'native',
                fallback: null,
                quota: { daily: 10000, used: 0 },
                enabled: true,
                cost: 0
            },
            'ukrposhta': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 25, used: 0 },
                enabled: true,
                cost: 0.019
            },
            'meest-express': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 25, used: 0 },
                enabled: true,
                cost: 0.019
            },
            'dhl': {
                primary: 'native', // Нативний DHL API
                fallback: 'trackingmore',
                quota: { daily: 250, used: 0 }, // DHL дає 250/день
                enabled: true,
                cost: 0
            },
            'delivery-auto': {
                primary: 'native', // Нативний Delivery Auto API
                fallback: 'trackingmore',
                quota: { daily: 1000, used: 0 },
                enabled: true,
                cost: 0
            },
            'sat': {
                primary: 'native', // Нативний SAT API
                fallback: null,
                quota: { daily: 500, used: 0 },
                enabled: true,
                cost: 0
            },
            'justin': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 20, used: 0 },
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
            },
            'china-post': {
                primary: 'trackingmore',
                fallback: null,
                quota: { daily: 15, used: 0 },
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
        
        // Ініціалізація квот з Redis
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

    // Розширене автовизначення перевізника з усіма провайдерами
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
        
        // Delivery Auto - українська служба для великогабариту
        if (/^DA\d{8,12}$/.test(number) || /^\d{8,10}DA$/.test(number) ||
            /^DELIVERY\d{6,10}$/.test(number) || /^DLV\d{8,12}$/.test(number)) {
            return { 
                id: 5, 
                code: 'delivery-auto', 
                name: 'Delivery Auto', 
                api: 'native',
                confidence: 'high'
            };
        }
        
        // SAT (Satellite Express) - українська кур'єрська служба
        if (/^SAT\d{8,12}$/.test(number) || /^ST\d{10,12}$/.test(number) ||
            /^SATELLITE\d{6,10}$/.test(number)) {
            return { 
                id: 6, 
                code: 'sat', 
                name: 'SAT Satellite Express', 
                api: 'native',
                confidence: 'high'
            };
        }
        
        // === МІЖНАРОДНІ ПЕРЕВІЗНИКИ ===
        
        // DHL - багато форматів, найвища пріоритетність для нативного API
        if (/^\d{10}$/.test(number) || /^\d{11}$/.test(number) || 
            /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(number) || /^JD\d{18}$/.test(number) ||
            /^\d{4}\s?\d{4}\s?\d{4}$/.test(number.replace(/\s/g, ''))) {
            return { 
                id: 7, 
                code: 'dhl', 
                name: 'DHL', 
                api: 'native',
                confidence: 'high'
            };
        }
        
        // FedEx - різні формати
        if (/^\d{12,14}$/.test(number) || /^\d{20}$/.test(number) ||
            /^\d{22}$/.test(number) || /^96\d{20}$/.test(number) ||
            /^[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/.test(number.replace(/\s/g, ''))) {
            return { 
                id: 8, 
                code: 'fedex', 
                name: 'FedEx', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // UPS - характерний формат
        if (/^1Z[A-Z0-9]{16}$/.test(number) || /^T\d{10}$/.test(number)) {
            return { 
                id: 9, 
                code: 'ups', 
                name: 'UPS', 
                api: 'trackingmore',
                confidence: 'high'
            };
        }
        
        // China Post - популярний для AliExpress/інших
        if (/^[A-Z]{2}\d{9}CN$/.test(number) || /^C[A-Z]\d{9}CN$/.test(number) ||
            /^L[A-Z]\d{9}CN$/.test(number) || /^R[A-Z]\d{9}CN$/.test(number)) {
            return { 
                id: 10, 
                code: 'china-post', 
                name: 'China Post', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // PostNL (популярний в EU)
        if (/^[A-Z]{2}\d{9}NL$/.test(number) || /^3S[A-Z0-9]{13}$/.test(number)) {
            return { 
                id: 11, 
                code: 'postnl', 
                name: 'PostNL', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // Deutsche Post (цільовий німецький ринок)
        if (/^[A-Z]{2}\d{9}DE$/.test(number) || /^00\d{18}$/.test(number)) {
            return { 
                id: 12, 
                code: 'deutsche-post', 
                name: 'Deutsche Post', 
                api: 'trackingmore',
                confidence: 'medium'
            };
        }
        
        // Royal Mail (Великобританія)
        if (/^[A-Z]{2}\d{9}GB$/.test(number) || /^[A-Z]{1}\d{8}[A-Z]{2}$/.test(number)) {
            return { 
                id: 13, 
                code: 'royal-mail', 
                name: 'Royal Mail', 
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
        
        // Загальні числові номери (можуть бути DHL, FedEx або іншими)
        if (/^\d{8,20}$/.test(number)) {
            // Якщо 10-11 цифр, скоріше за все DHL
            if (number.length >= 10 && number.length <= 11) {
                return { 
                    id: 7, 
                    code: 'dhl', 
                    name: 'DHL (Auto-detected)', 
                    api: 'native',
                    confidence: 'medium'
                };
            }
            
            return { 
                id: null, 
                code: 'auto-detect-numeric', 
                name: 'Auto-detect Numeric', 
                api: 'trackingmore',
                confidence: 'low'
            };
        }
        
        // Fallback для всіх інших
        return { 
            id: null, 
            code: 'unknown', 
            name: 'Unknown Carrier', 
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

    // Безпечне шифрування (виправлено)
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

    // === НАТИВНІ API МЕТОДИ ===

    // Nova Poshta API (без змін - працює)
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

    // DHL MyDHL+ API
    async trackDHL(trackingNumber) {
        try {
            const response = await axios.get(
                'https://api-eu.dhl.com/track/shipments',
                {
                    params: {
                        trackingNumber: trackingNumber
                    },
                    headers: {
                        'DHL-API-Key': this.dhlApiKey,
                        'Authorization': `Basic ${Buffer.from(`${this.dhlApiKey}:${this.dhlApiSecret}`).toString('base64')}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'PandaTrack/1.0'
                    },
                    timeout: 15000
                }
            );

            if (response.data.shipments && response.data.shipments.length > 0) {
                const shipment = response.data.shipments[0];
                return {
                    success: true,
                    data: {
                        trackingNumber: trackingNumber,
                        carrier: 'dhl',
                        status: shipment.status?.description || 'Unknown',
                        statusCode: shipment.status?.statusCode,
                        lastUpdate: shipment.status?.timestamp || new Date().toISOString(),
                        events: shipment.events?.map(event => ({
                            date: event.timestamp,
                            status: event.description,
                            location: event.location?.address?.addressLocality || ''
                        })) || [],
                        estimatedDelivery: shipment.estimatedTimeOfDelivery,
                        raw: shipment
                    }
                };
            }

            return {
                success: false,
                error: 'DHL tracking number not found',
                carrier: 'dhl'
            };

        } catch (error) {
            console.error('DHL API error:', error.message);
            throw new Error('DHL API unavailable');
        }
    }

    // Delivery Auto API
    async trackDeliveryAuto(trackingNumber) {
        try {
            // Delivery Auto використовує POST запит з авторизацією
            const response = await axios.post(
                'https://www.delivery-auto.com/api/track',
                {
                    public_key: this.deliveryAutoPublicKey,
                    tracking_number: trackingNumber
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.deliveryAutoSecretKey}`,
                        'User-Agent': 'PandaTrack/1.0'
                    },
                    timeout: 15000
                }
            );

            if (response.data.success && response.data.data) {
                const tracking = response.data.data;
                return {
                    success: true,
                    data: {
                        trackingNumber: trackingNumber,
                        carrier: 'delivery-auto',
                        status: tracking.status || 'Unknown',
                        statusCode: tracking.status_code,
                        lastUpdate: tracking.last_update || new Date().toISOString(),
                        events: tracking.events?.map(event => ({
                            date: event.date,
                            status: event.status,
                            location: event.location || ''
                        })) || [],
                        estimatedDelivery: tracking.estimated_delivery,
                        raw: tracking
                    }
                };
            }

            return {
                success: false,
                error: response.data.message || 'Delivery Auto tracking not found',
                carrier: 'delivery-auto'
            };

        } catch (error) {
            console.error('Delivery Auto API error:', error.message);
            throw new Error('Delivery Auto API unavailable');
        }
    }

    // SAT API
    async trackSAT(trackingNumber) {
        try {
            // SAT використовує тестовий URL поки немає доступу до prod
            const baseUrl = process.env.SAT_BASE_URL_PROD || process.env.SAT_BASE_URL_TEST || 'http://urm.sat.ua/study/hs/api/v1.0';
            
            const response = await axios.get(
                `${baseUrl}/tracking/${trackingNumber}`,
                {
                    headers: {
                        'Authorization': `ApiKey ${this.satApiKey}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'PandaTrack/1.0'
                    },
                    timeout: 15000
                }
            );

            if (response.data.success !== false && response.data.tracking) {
                const tracking = response.data.tracking;
                return {
                    success: true,
                    data: {
                        trackingNumber: trackingNumber,
                        carrier: 'sat',
                        status: tracking.status || 'Unknown',
                        statusCode: tracking.status_code,
                        lastUpdate: tracking.last_update || new Date().toISOString(),
                        events: tracking.history?.map(event => ({
                            date: event.date,
                            status: event.status,
                            location: event.office || event.location || ''
                        })) || [],
                        estimatedDelivery: tracking.estimated_delivery,
                        raw: tracking
                    }
                };
            }

            return {
                success: false,
                error: 'SAT tracking number not found',
                carrier: 'sat'
            };

        } catch (error) {
            console.error('SAT API error:', error.message);
            throw new Error('SAT API unavailable');
        }
    }

    // TrackingMore Universal API (без змін)
    async trackTrackingMore(trackingNumber, carrierCode = null) {
        try {
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

    // Універсальна функція для нативних API
    async trackNativeAPI(trackingNumber, carrierCode) {
        switch (carrierCode) {
            case 'nova-poshta':
                return await this.trackNovaPoshta(trackingNumber);
            
            case 'dhl':
                return await this.trackDHL(trackingNumber);
            
            case 'delivery-auto':
                return await this.trackDeliveryAuto(trackingNumber);
            
            case 'sat':
                return await this.trackSAT(trackingNumber);
            
            case 'ukrposhta':
                return await this.trackUkrposhta(trackingNumber);
            
            case 'meest-express':
                return await this.trackMeest(trackingNumber);
            
            default:
                throw new Error(`Native API not implemented for ${carrierCode}`);
        }
    }

    // Заглушки для майбутніх інтеграцій
    async trackUkrposhta(trackingNumber) {
        // TODO: Додати коли буде API ключ
        throw new Error('Ukrposhta native API not implemented yet');
    }

    async trackMeest(trackingNumber) {
        // TODO: Додати коли буде партнерство
        throw new Error('Meest native API not implemented yet');
    }

    // === ОСНОВНА ЛОГІКА ТРЕКІНГУ ===

    // Виконання трекінгу через вибраний провайдер
    async executeTracking(trackingNumber, carrierCode, apiProvider) {
        switch (apiProvider) {
            case 'native':
                return await this.trackNativeAPI(trackingNumber, carrierCode);
            
            case 'trackingmore':
                return await this.trackTrackingMore(trackingNumber, carrierCode);
            
            default:
                throw new Error(`Unknown API provider: ${apiProvider}`);
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
            
            // Виконання трекінгу з fallback логікою
            try {
                result = await this.executeTracking(trackingNumber, detectedCarrier.code, apiProvider);
                
                if (result.success) {
                    await this.updateQuotaUsage(detectedCarrier.code, apiProvider);
                } else {
                    // Спробуємо fallback якщо є
                    const config = this.providers[detectedCarrier.code];
                    if (config && config.fallback && !result.success) {
                        console.warn(`Primary API failed for ${detectedCarrier.code}, trying fallback: ${config.fallback}`);
                        
                        result = await this.executeTracking(trackingNumber, detectedCarrier.code, config.fallback);
                        if (result.success) {
                            await this.updateQuotaUsage(detectedCarrier.code, config.fallback);
                        }
                    }
                }
                
            } catch (error) {
                console.warn(`Primary API failed for ${detectedCarrier.code}: ${error.message}`);
                
                // Спробуємо fallback
                const config = this.providers[detectedCarrier.code];
                if (config && config.fallback) {
                    console.log(`Trying fallback API: ${config.fallback}`);
                    
                    try {
                        result = await this.executeTracking(trackingNumber, detectedCarrier.code, config.fallback);
                        
                        if (result.success) {
                            await this.updateQuotaUsage(detectedCarrier.code, config.fallback);
                        }
                    } catch (fallbackError) {
                        console.error(`Fallback API also failed: ${fallbackError.message}`);
                        throw error; // Повертаємо оригінальну помилку
                    }
                } else {
                    throw error;
                }
            }

            if (result && result.success) {
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
                error: result?.error || 'Tracking failed',
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

    // Збереження в базу даних (без змін)
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
// apps/api/src/services/trackingService.js
const axios = require('axios');
const crypto = require('crypto');

class TrackingService {
    constructor(redisClient, supabaseClient) {
        this.redis = redisClient;
        this.supabase = supabaseClient;
        this.trackingMoreKey = process.env.TRACKINGMORE_API_KEY;
        this.novaPoshtaKey = process.env.NOVAPOSHTA_API_KEY;
        this.encryptionKey = process.env.ENCRYPTION_KEY;
        this.trackingSalt = process.env.TRACKING_SALT;
    }

    // Автовизначення перевізника за номером
    detectCarrier(trackingNumber) {
        const number = trackingNumber.trim().toUpperCase();
        
        // Nova Poshta patterns
        if (/^20\d{12}$/.test(number)) {
            return { id: 1, code: 'nova-poshta', name: 'Nova Poshta' };
        }
        
        // Ukrposhta patterns
        if (/^[A-Z]{2}\d{9}UA$/.test(number)) {
            return { id: 2, code: 'ukrposhta', name: 'Ukrposhta' };
        }
        
        // Meest Express patterns  
        if (/^ME\d{10}$/.test(number) || /^M\d{8}$/.test(number)) {
            return { id: 3, code: 'meest', name: 'Meest Express' };
        }
        
        // DHL patterns
        if (/^\d{10}$/.test(number) || /^\d{11}$/.test(number)) {
            return { id: 4, code: 'dhl', name: 'DHL' };
        }
        
        // Default to TrackingMore universal detection
        return { id: null, code: 'auto-detect', name: 'Auto-detect' };
    }

    // Хешування номера для безпеки
    hashTrackingNumber(trackingNumber) {
        return crypto
            .createHmac('sha256', this.trackingSalt)
            .update(trackingNumber)
            .digest('hex')
            .substring(0, 16);
    }

    // Шифрування чутливих даних
    encrypt(text) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decrypt(text) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Генерування cache key
    getCacheKey(trackingNumber, carrierId) {
        const hash = this.hashTrackingNumber(trackingNumber);
        return `track:${carrierId}:${hash}`;
    }

    // Nova Poshta API
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
            return {
                success: false,
                error: 'Nova Poshta API unavailable',
                carrier: 'nova-poshta'
            };
        }
    }

    // TrackingMore Universal API
    async trackTrackingMore(trackingNumber, carrierCode = null) {
        try {
            const endpoint = carrierCode 
                ? `https://api.trackingmore.com/v3/trackings/${carrierCode}/${trackingNumber}`
                : `https://api.trackingmore.com/v3/trackings/detect/${trackingNumber}`;

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
                        carrier: tracking.carrier_code || 'unknown',
                        status: tracking.delivery_status,
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
                error: 'Tracking number not found',
                carrier: carrierCode || 'auto-detect'
            };

        } catch (error) {
            console.error('TrackingMore API error:', error.message);
            return {
                success: false,
                error: 'TrackingMore API unavailable',
                carrier: carrierCode || 'auto-detect'
            };
        }
    }

    // Основна функція трекінгу
    async track(trackingNumber, userId = null, forceRefresh = false) {
        try {
            // Валідація номера
            if (!trackingNumber || trackingNumber.length < 8) {
                return {
                    success: false,
                    error: 'Invalid tracking number format'
                };
            }

            // Автовизначення перевізника
            const detectedCarrier = this.detectCarrier(trackingNumber);
            const cacheKey = this.getCacheKey(trackingNumber, detectedCarrier.id || 'auto');

            // Перевірка кешу
            if (!forceRefresh) {
                const cached = await this.redis.get(cacheKey);
                if (cached) {
                    const data = JSON.parse(cached);
                    return {
                        success: true,
                        data: data,
                        cached: true
                    };
                }
            }

            let result;

            // Вибір API залежно від перевізника
            if (detectedCarrier.code === 'nova-poshta') {
                result = await this.trackNovaPoshta(trackingNumber);
            } else {
                // Використовуємо TrackingMore для всіх інших або auto-detect
                const carrierCode = detectedCarrier.code !== 'auto-detect' 
                    ? detectedCarrier.code 
                    : null;
                result = await this.trackTrackingMore(trackingNumber, carrierCode);
            }

            if (result.success) {
                // Кешування з динамічним TTL
                const ttl = this.calculateTTL(result.data.status);
                await this.redis.setEx(cacheKey, ttl, JSON.stringify(result.data));

                // Зберігання в базу якщо є userId
                if (userId) {
                    await this.saveToDatabase(trackingNumber, result.data, userId);
                }

                return {
                    success: true,
                    data: result.data,
                    cached: false
                };
            }

            return result;

        } catch (error) {
            console.error('Tracking service error:', error);
            return {
                success: false,
                error: 'Internal tracking service error'
            };
        }
    }

    // Розрахунок TTL для кешу
    calculateTTL(status) {
        const statusLower = (status || '').toLowerCase();
        
        // Доставлено - кешувати довго (24 години)
        if (statusLower.includes('delivered') || statusLower.includes('доставлен')) {
            return 86400; // 24 hours
        }
        
        // В дорозі - часто оновлювати (1 година)  
        if (statusLower.includes('transit') || statusLower.includes('в пути')) {
            return 3600; // 1 hour
        }
        
        // Створено/прийнято - рідше оновлювати (4 години)
        if (statusLower.includes('created') || statusLower.includes('принят')) {
            return 14400; // 4 hours
        }
        
        // За замовчуванням - 2 години
        return 7200;
    }

    // Збереження в базу даних
    async saveToDatabase(trackingNumber, trackingData, userId) {
        try {
            const hashedNumber = this.hashTrackingNumber(trackingNumber);
            const encryptedNumber = this.encrypt(trackingNumber);
            
            // Перевірка чи існує вже запис
            const { data: existing } = await this.supabase
                .from('shipments')
                .select('id')
                .eq('tracking_hash', hashedNumber)
                .eq('user_id', userId)
                .single();

            if (existing) {
                // Оновлюємо існуючий
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

                // Додаємо нові події
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
                // Створюємо новий запис
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

                // Додаємо події
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
            // Не перериваємо основний процес трекінгу через помилку БД
        }
    }
}

module.exports = TrackingService;

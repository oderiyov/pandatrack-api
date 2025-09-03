// apps/api/src/services/TrackingService.js - КАРДИНАЛЬНО СПРОЩЕНИЙ
const CarrierDetector = require('./CarrierDetector');
const MultiSourceResolver = require('./MultiSourceResolver');
const CacheManager = require('./CacheManager');
const QuotaManager = require('./QuotaManager');
const { encrypt, decrypt, hashTrackingNumber } = require('../utils/encryption');

class TrackingService {
    constructor(redisClient, supabaseClient) {
        this.redis = redisClient;
        this.supabase = supabaseClient;
        
        // Ініціалізуємо компоненти
        this.carrierDetector = new CarrierDetector();
        this.quotaManager = new QuotaManager(redisClient);
        this.multiSourceResolver = new MultiSourceResolver(this.quotaManager);
        this.cacheManager = new CacheManager(redisClient);
        
        // Ініціалізуємо квоти з Redis
        this.initializeQuotas();
    }

    // ГОЛОВНИЙ МЕТОД - тепер дуже простий
    async track(trackingNumber, userId = null, options = {}) {
        const startTime = Date.now();
        
        try {
            // 1. Валідація
            if (!trackingNumber || trackingNumber.length < 8) {
                return {
                    success: false,
                    error: 'Invalid tracking number format',
                    responseTime: Date.now() - startTime
                };
            }

            // 2. Автовизначення можливих джерел (НОВА ЛОГІКА)
            const sources = this.carrierDetector.detectMultipleSources(trackingNumber);
            
            if (sources.length === 0) {
                return {
                    success: false,
                    error: 'Unknown tracking number format',
                    trackingNumber: trackingNumber,
                    responseTime: Date.now() - startTime
                };
            }

            // 3. Перевірка кешу
            if (!options.forceRefresh) {
                const cached = await this.cacheManager.get(trackingNumber, sources);
                if (cached) {
                    return {
                        ...cached,
                        cached: true,
                        responseTime: Date.now() - startTime
                    };
                }
            }

            // 4. Multi-source резолюція (КЛЮЧОВА ІННОВАЦІЯ)
            const result = await this.multiSourceResolver.resolve(trackingNumber, sources, options);
            
            if (result.success) {
                // 5. Кешування успішного результату
                const ttl = this.calculateTTL(result.data.status);
                await this.cacheManager.set(trackingNumber, result, ttl);

                // 6. Збереження в базу (якщо є userId)
                if (userId) {
                    await this.saveToDatabase(trackingNumber, result.data, userId);
                }

                return {
                    ...result,
                    cached: false,
                    responseTime: Date.now() - startTime
                };
            }

            return {
                ...result,
                responseTime: Date.now() - startTime
            };

        } catch (error) {
            console.error('TrackingService error:', error.message);
            return {
                success: false,
                error: error.message || 'Internal tracking service error',
                responseTime: Date.now() - startTime
            };
        }
    }

    // TTL розрахунок (перенесено з старого коду)
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

    // Ініціалізація квот з Redis (спрощено)
    async initializeQuotas() {
        try {
            await this.quotaManager.initialize();
        } catch (error) {
            console.warn('Failed to initialize quotas from Redis:', error.message);
        }
    }

    // Збереження в БД (перенесено з старого коду, трохи спрощено)
    async saveToDatabase(trackingNumber, trackingData, userId) {
        try {
            const hashedNumber = hashTrackingNumber(trackingNumber);
            const encryptedNumber = encrypt(trackingNumber);
            
            const { data: existing } = await this.supabase
                .from('shipments')
                .select('id')
                .eq('tracking_hash', hashedNumber)
                .eq('user_id', userId)
                .single();

            if (existing) {
                // Оновлюємо існуючий запис
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

                // Оновлюємо події
                if (trackingData.events && trackingData.events.length > 0) {
                    await this.updateEvents(existing.id, trackingData.events);
                }
            } else {
                // Створюємо новий запис
                const carrierId = this.carrierDetector.detectCarrier(trackingNumber).id;
                
                const { data: shipment } = await this.supabase
                    .from('shipments')
                    .insert({
                        user_id: userId,
                        tracking_number: encryptedNumber,
                        tracking_hash: hashedNumber,
                        carrier_id: carrierId,
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
                    await this.insertEvents(shipment.id, trackingData.events);
                }
            }
        } catch (error) {
            console.error('Database save error:', error.message);
        }
    }

    async updateEvents(shipmentId, events) {
        const eventRecords = events.map(event => ({
            shipment_id: shipmentId,
            event_date: event.date || new Date().toISOString(),
            status: event.status || 'Unknown',
            location: event.location || '',
            description: event.description || '',
            source: event.source || 'api'
        }));

        await this.supabase
            .from('events')
            .upsert(eventRecords, { 
                onConflict: 'shipment_id,event_date,status',
                ignoreDuplicates: true 
            });
    }

    async insertEvents(shipmentId, events) {
        const eventRecords = events.map(event => ({
            shipment_id: shipmentId,
            event_date: event.date || new Date().toISOString(),
            status: event.status || 'Unknown',
            location: event.location || '',
            description: event.description || ''
        }));

        await this.supabase
            .from('events')
            .insert(eventRecords);
    }

    // Статус квот (спрощено)
    async getQuotaStatus() {
        return await this.quotaManager.getStatus();
    }

    // Bulk tracking (НОВИЙ МЕТОД)
    async trackBulk(trackingNumbers, userId = null) {
        const results = [];
        
        for (const number of trackingNumbers) {
            try {
                const result = await this.track(number, userId);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    trackingNumber: number,
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            results: results,
            total: trackingNumbers.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        };
    }

    // Health check для всіх провайдерів
    async healthCheck() {
        const ProviderFactory = require('../providers/ProviderFactory');
        
        return {
            service: 'TrackingService',
            status: 'ok',
            timestamp: new Date().toISOString(),
            components: {
                redis: await this.cacheManager.healthCheck(),
                supabase: await this.testSupabaseConnection(),
                providers: await ProviderFactory.healthCheckAll(),
                quotas: await this.quotaManager.getStatus()
            }
        };
    }

    async testSupabaseConnection() {
        try {
            const { data, error } = await this.supabase
                .from('carriers')
                .select('id')
                .limit(1);
            
            return { status: error ? 'error' : 'ok', error: error?.message };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
}

module.exports = TrackingService;
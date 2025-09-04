// apps/api/src/services/TrackingService.js - ВИПРАВЛЕНО ДЛЯ ROUTES СУМІСНОСТІ
const CarrierDetector = require('./CarrierDetector');
const MultiSourceResolver = require('./MultiSourceResolver');
const CacheManager = require('./CacheManager');
const QuotaManager = require('./QuotaManager');
const { encrypt, decrypt, hashTrackingNumber } = require('../utils/encryption');

/**
 * TrackingService - Центральний сервіс для multi-source відстеження посилок
 * 
 * Основні функції:
 * - Multi-source трекінг з кількох провайдерів одночасно
 * - Інтелектуальне кешування з динамічним TTL
 * - Cost optimization через пріоритизацію native APIs
 * - Збереження в Supabase з шифруванням PII даних
 * - Quota management для paid APIs
 */
class TrackingService {
    constructor(redisClient, supabaseClient) {
        this.redis = redisClient;
        this.supabase = supabaseClient;
        
        // Ініціалізуємо компоненти нової архітектури
        this.carrierDetector = new CarrierDetector();
        this.quotaManager = new QuotaManager(redisClient);
        this.multiSourceResolver = new MultiSourceResolver(this.quotaManager);
        this.cacheManager = new CacheManager(redisClient);
        
        // Ініціалізуємо квоти з Redis
        this.initializeQuotas();
    }

    // ГОЛОВНИЙ МЕТОД ДЛЯ НОВОЇ АРХІТЕКТУРИ
    async track(trackingNumber, userId = null, options = {}) {
        const startTime = Date.now();
        
        try {
            // 1. Валідація вхідних даних
            if (!trackingNumber || trackingNumber.length < 8) {
                return {
                    success: false,
                    error: 'Invalid tracking number format',
                    responseTime: Date.now() - startTime
                };
            }

            // 2. Автовизначення можливих джерел
            const sources = this.carrierDetector.detectMultipleSources(trackingNumber);
            
            if (sources.length === 0) {
                return {
                    success: false,
                    error: 'Unknown tracking number format',
                    trackingNumber: trackingNumber,
                    responseTime: Date.now() - startTime
                };
            }

            // 3. Перевірка кешу (якщо не force refresh)
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

            // 4. Multi-source резолюція - ключова інновація
            const result = await this.multiSourceResolver.resolve(trackingNumber, sources, options);
            
            if (result.success) {
                // 5. Кешування успішного результату
                const ttl = this.calculateTTL(result.consolidatedStatus);
                await this.cacheManager.set(trackingNumber, result, ttl);

                // 6. Збереження в базу (якщо є userId)
                if (userId) {
                    await this.saveToDatabase(trackingNumber, result, userId);
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

    // COMPATIBILITY METHOD - алієс для routes/track.js
    async trackShipment(trackingNumber, source = null, forceRefresh = false, options = {}) {
        const userId = options.userId || null;
        const trackingOptions = {
            forceRefresh,
            source, // специфічний провайдер якщо заданий
            multiSource: options.multiSource !== false, // за замовчуванням true
            ...options
        };
        
        return await this.track(trackingNumber, userId, trackingOptions);
    }

    // PROVIDER MANAGEMENT METHODS - для routes сумісності
    async getProvidersInfo() {
        const ProviderFactory = require('../providers/ProviderFactory');
        
        try {
            const providers = await ProviderFactory.getProvidersInfo();
            return providers;
        } catch (error) {
            console.error('Failed to get providers info:', error.message);
            return {};
        }
    }

    async checkProvidersHealth() {
        const ProviderFactory = require('../providers/ProviderFactory');
        
        try {
            const healthCheck = await ProviderFactory.healthCheckAll();
            return healthCheck;
        } catch (error) {
            console.error('Providers health check failed:', error.message);
            return {};
        }
    }

    // CARRIER DETECTION METHODS
    async detectCarriers(trackingNumber) {
        try {
            const sources = this.carrierDetector.detectMultipleSources(trackingNumber);
            return sources;
        } catch (error) {
            console.error('Carrier detection failed:', error.message);
            return [];
        }
    }

    // LEGACY METHOD - для backward compatibility
    detectCarrier(trackingNumber) {
        return this.carrierDetector.detectCarrier(trackingNumber);
    }

    // TRACKING HISTORY - для routes/track.js
    async getTrackingHistory(trackingNumber) {
        try {
            const hashedNumber = hashTrackingNumber(trackingNumber);
            
            const { data, error } = await this.supabase
                .from('events')
                .select(`
                    event_date,
                    status,
                    location,
                    description,
                    source,
                    shipments!inner(tracking_hash)
                `)
                .eq('shipments.tracking_hash', hashedNumber)
                .order('event_date', { ascending: false });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('History retrieval error:', error.message);
            return [];
        }
    }

    // USAGE STATISTICS
    async getUsageStats() {
        try {
            const quotaStatus = await this.quotaManager.getStatus();
            const cacheStats = await this.cacheManager.getStats();
            
            return {
                quotas: quotaStatus,
                cache: cacheStats,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Usage stats error:', error.message);
            return {
                error: 'Failed to retrieve usage statistics',
                timestamp: new Date().toISOString()
            };
        }
    }

    // TTL CALCULATION - динамічне кешування на основі статусу
    calculateTTL(status) {
        const statusLower = (status || '').toLowerCase();
        
        // Доставлені посилки кешуємо довго
        if (statusLower.includes('delivered') || statusLower.includes('доставлен')) {
            return 86400; // 24 години
        }
        
        // Посилки в дорозі оновлюються частіше
        if (statusLower.includes('transit') || statusLower.includes('в пути')) {
            return 3600; // 1 година
        }
        
        // Нові посилки можуть швидко змінити статус
        if (statusLower.includes('created') || statusLower.includes('принят')) {
            return 14400; // 4 години
        }
        
        return 7200; // 2 години за замовчуванням
    }

    // QUOTA INITIALIZATION
    async initializeQuotas() {
        try {
            await this.quotaManager.initialize();
        } catch (error) {
            console.warn('Failed to initialize quotas from Redis:', error.message);
        }
    }

    // DATABASE OPERATIONS - збереження з шифруванням
    async saveToDatabase(trackingNumber, trackingResult, userId) {
        try {
            const hashedNumber = hashTrackingNumber(trackingNumber);
            const encryptedNumber = encrypt(trackingNumber);
            
            // Перевіряємо чи існує запис
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
                        status: trackingResult.consolidatedStatus,
                        status_code: trackingResult.sources[0]?.statusCode || null,
                        last_update: trackingResult.lastUpdate,
                        estimated_delivery: trackingResult.estimatedDelivery,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                // Оновлюємо події з усіх джерел
                if (trackingResult.sources && trackingResult.sources.length > 0) {
                    await this.updateEventsFromSources(existing.id, trackingResult.sources);
                }
            } else {
                // Створюємо новий запис
                const primarySource = trackingResult.sources[0];
                const carrierId = this.carrierDetector.detectCarrier(trackingNumber).id;
                
                const { data: shipment } = await this.supabase
                    .from('shipments')
                    .insert({
                        user_id: userId,
                        tracking_number: encryptedNumber,
                        tracking_hash: hashedNumber,
                        carrier_id: carrierId,
                        status: trackingResult.consolidatedStatus,
                        status_code: primarySource?.statusCode || null,
                        last_update: trackingResult.lastUpdate,
                        estimated_delivery: trackingResult.estimatedDelivery,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (shipment && trackingResult.sources) {
                    await this.insertEventsFromSources(shipment.id, trackingResult.sources);
                }
            }
        } catch (error) {
            console.error('Database save error:', error.message);
        }
    }

    // EVENTS MANAGEMENT - для multi-source архітектури
    async updateEventsFromSources(shipmentId, sources) {
        try {
            const allEvents = [];
            
            sources.forEach(source => {
                if (source.events && source.events.length > 0) {
                    const sourceEvents = source.events.map(event => ({
                        shipment_id: shipmentId,
                        event_date: event.timestamp || event.date || new Date().toISOString(),
                        status: event.status || 'Unknown',
                        location: event.location || '',
                        description: event.description || '',
                        source: source.provider
                    }));
                    allEvents.push(...sourceEvents);
                }
            });

            if (allEvents.length > 0) {
                await this.supabase
                    .from('events')
                    .upsert(allEvents, { 
                        onConflict: 'shipment_id,event_date,status,source',
                        ignoreDuplicates: true 
                    });
            }
        } catch (error) {
            console.error('Events update error:', error.message);
        }
    }

    async insertEventsFromSources(shipmentId, sources) {
        try {
            const allEvents = [];
            
            sources.forEach(source => {
                if (source.events && source.events.length > 0) {
                    const sourceEvents = source.events.map(event => ({
                        shipment_id: shipmentId,
                        event_date: event.timestamp || event.date || new Date().toISOString(),
                        status: event.status || 'Unknown',
                        location: event.location || '',
                        description: event.description || '',
                        source: source.provider
                    }));
                    allEvents.push(...sourceEvents);
                }
            });

            if (allEvents.length > 0) {
                await this.supabase
                    .from('events')
                    .insert(allEvents);
            }
        } catch (error) {
            console.error('Events insert error:', error.message);
        }
    }

    // QUOTA STATUS - для моніторингу
    async getQuotaStatus() {
        try {
            return await this.quotaManager.getStatus();
        } catch (error) {
            console.error('Quota status error:', error.message);
            return null;
        }
    }

    // BULK TRACKING - для batch операцій
    async trackBulk(trackingNumbers, userId = null) {
        const results = [];
        
        for (const number of trackingNumbers) {
            try {
                const result = await this.track(number, userId);
                results.push({
                    trackingNumber: number,
                    ...result
                });
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

    // HEALTH CHECK - повна діагностика системи
    async healthCheck() {
        try {
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
                },
                features: {
                    multiSourceTracking: true,
                    costOptimization: true,
                    intelligentCaching: true,
                    bulkOperations: true
                }
            };
        } catch (error) {
            return {
                service: 'TrackingService',
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // SUPABASE CONNECTION TEST
    async testSupabaseConnection() {
        try {
            const { data, error } = await this.supabase
                .from('carriers')
                .select('id')
                .limit(1);
            
            return { 
                status: error ? 'error' : 'ok', 
                error: error?.message,
                connectionTime: Date.now()
            };
        } catch (error) {
            return { 
                status: 'error', 
                error: error.message,
                connectionTime: Date.now()
            };
        }
    }
}

module.exports = TrackingService;
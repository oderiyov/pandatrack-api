// apps/api/src/routes/track.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const TrackingService = require('../services/trackingService');

const router = express.Router();

// Rate limiting для трекінгу
const trackingRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 хвилин
    max: (req) => {
        // Авторизовані користувачі - більше запитів
        if (req.user) {
            return req.user.subscription_tier === 'premium' ? 100 : 50;
        }
        // Анонімні користувачі - обмежено
        return 10;
    },
    message: {
        success: false,
        error: 'Too many tracking requests. Please try again later.',
        retryAfter: 900 // 15 хвилин в секундах
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Використовуємо IP або user ID для rate limiting
        return req.user ? `user_${req.user.id}` : `ip_${req.ip}`;
    }
});

// Middleware для валідації запиту
const validateTrackingRequest = (req, res, next) => {
    const { trackingNumber } = req.body;
    
    if (!trackingNumber) {
        return res.status(400).json({
            success: false,
            error: 'Tracking number is required',
            code: 'MISSING_TRACKING_NUMBER'
        });
    }
    
    if (typeof trackingNumber !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Tracking number must be a string',
            code: 'INVALID_TRACKING_NUMBER_TYPE'
        });
    }
    
    const cleanNumber = trackingNumber.trim();
    if (cleanNumber.length < 8 || cleanNumber.length > 35) {
        return res.status(400).json({
            success: false,
            error: 'Tracking number length must be between 8 and 35 characters',
            code: 'INVALID_TRACKING_NUMBER_LENGTH'
        });
    }
    
    // Перевіряємо на небезпечні символи
    if (!/^[A-Za-z0-9\-]+$/.test(cleanNumber)) {
        return res.status(400).json({
            success: false,
            error: 'Tracking number contains invalid characters',
            code: 'INVALID_TRACKING_NUMBER_FORMAT'
        });
    }
    
    req.body.trackingNumber = cleanNumber;
    next();
};

// POST /track - основний endpoint для трекінгу
router.post('/tracking', trackingRateLimit, validateTrackingRequest, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { trackingNumber, forceRefresh = false } = req.body;
        const userId = req.user?.id || null;
        
        // Ініціалізуємо сервіс трекінгу
        const trackingService = new TrackingService(req.redis, req.supabase);
        
        // Виконуємо трекінг
        const result = await trackingService.track(trackingNumber, userId, forceRefresh);
        
        // Логування для моніторингу
        const responseTime = Date.now() - startTime;
        console.log({
            action: 'track_request',
            trackingNumber: trackingNumber.substring(0, 4) + '***', // Часткове маскування
            userId: userId,
            success: result.success,
            cached: result.cached || false,
            carrier: result.data?.carrier || 'unknown',
            responseTime: responseTime,
            timestamp: new Date().toISOString()
        });
        
        if (result.success) {
            // Успішна відповідь
            res.json({
                success: true,
                data: {
                    trackingNumber: result.data.trackingNumber,
                    carrier: result.data.carrier,
                    status: result.data.status,
                    statusCode: result.data.statusCode,
                    lastUpdate: result.data.lastUpdate,
                    estimatedDelivery: result.data.estimatedDelivery,
                    events: result.data.events || [],
                    cached: result.cached || false
                },
                meta: {
                    requestId: req.requestId,
                    responseTime: responseTime,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            // Помилка трекінгу
            res.status(404).json({
                success: false,
                error: result.error || 'Tracking information not found',
                code: 'TRACKING_NOT_FOUND',
                carrier: result.carrier || 'unknown',
                meta: {
                    requestId: req.requestId,
                    responseTime: responseTime,
                    timestamp: new Date().toISOString()
                }
            });
        }
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        console.error({
            action: 'track_error',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            responseTime: responseTime,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({
            success: false,
            error: 'Internal server error during tracking',
            code: 'INTERNAL_SERVER_ERROR',
            meta: {
                requestId: req.requestId,
                responseTime: responseTime,
                timestamp: new Date().toISOString()
            }
        });
    }
});

// GET /carriers - список підтримуваних перевізників
router.get('/carriers', async (req, res) => {
    try {
        const { data: carriers, error } = await req.supabase
            .from('carriers')
            .select('id, name, code, is_active, tracking_url_template')
            .eq('is_active', true)
            .order('name');
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            data: carriers.map(carrier => ({
                id: carrier.id,
                name: carrier.name,
                code: carrier.code,
                trackingUrlTemplate: carrier.tracking_url_template
            })),
            meta: {
                count: carriers.length,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Carriers endpoint error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to fetch carriers list',
            code: 'CARRIERS_FETCH_ERROR'
        });
    }
});

// POST /detect-carrier - автовизначення перевізника
router.post('/detect-carrier', validateTrackingRequest, async (req, res) => {
    try {
        const { trackingNumber } = req.body;
        
        const trackingService = new TrackingService(req.redis, req.supabase);
        const detectedCarrier = trackingService.detectCarrier(trackingNumber);
        
        res.json({
            success: true,
            data: {
                trackingNumber: trackingNumber,
                detectedCarrier: detectedCarrier,
                confidence: detectedCarrier.id ? 'high' : 'low'
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Carrier detection error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to detect carrier',
            code: 'CARRIER_DETECTION_ERROR'
        });
    }
});

// GET /track/:trackingNumber - альтернативний GET endpoint
router.get('/tracking/:trackingNumber', trackingRateLimit, async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const forceRefresh = req.query.refresh === 'true';
        
        // Валідація через middleware не спрацює для GET, валідуємо тут
        if (!trackingNumber || trackingNumber.length < 8 || trackingNumber.length > 35) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tracking number format',
                code: 'INVALID_TRACKING_NUMBER'
            });
        }
        
        if (!/^[A-Za-z0-9\-]+$/.test(trackingNumber)) {
            return res.status(400).json({
                success: false,
                error: 'Tracking number contains invalid characters',
                code: 'INVALID_TRACKING_NUMBER_FORMAT'
            });
        }
        
        const userId = req.user?.id || null;
        const trackingService = new TrackingService(req.redis, req.supabase);
        
        const result = await trackingService.track(trackingNumber, userId, forceRefresh);
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    trackingNumber: result.data.trackingNumber,
                    carrier: result.data.carrier,
                    status: result.data.status,
                    statusCode: result.data.statusCode,
                    lastUpdate: result.data.lastUpdate,
                    estimatedDelivery: result.data.estimatedDelivery,
                    events: result.data.events || [],
                    cached: result.cached || false
                }
            });
        } else {
            res.status(404).json({
                success: false,
                error: result.error || 'Tracking information not found',
                code: 'TRACKING_NOT_FOUND'
            });
        }
        
    } catch (error) {
        console.error('GET tracking error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal server error during tracking',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
});

// Додати до apps/api/src/routes/track.js в кінець файлу перед module.exports

// GET /api/quota-status - детальний моніторинг квот
router.get('/quota-status', async (req, res) => {
    try {
        const trackingService = new TrackingService(req.redis, req.supabase);
        const quotaStatus = await trackingService.getQuotaStatus();
        
        if (!quotaStatus) {
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve quota status'
            });
        }
        
        // Аналіз та рекомендації
        const analysis = {
            healthStatus: 'green',
            alerts: [],
            recommendations: [],
            costAnalysis: {
                dailyCost: 0,
                projectedMonthlyCost: 0
            }
        };
        
        // Розрахунок витрат
        let dailyCost = 0;
        Object.entries(quotaStatus.carriers).forEach(([carrier, data]) => {
            dailyCost += data.used * data.cost;
        });
        
        analysis.costAnalysis.dailyCost = parseFloat(dailyCost.toFixed(4));
        analysis.costAnalysis.projectedMonthlyCost = parseFloat((dailyCost * 30).toFixed(2));
        
        // Аналіз TrackingMore використання
        const tmUsagePercent = (quotaStatus.trackingmore.used / quotaStatus.trackingmore.limit) * 100;
        
        if (tmUsagePercent > 90) {
            analysis.healthStatus = 'red';
            analysis.alerts.push({
                level: 'critical',
                type: 'quota_exhaustion',
                message: `TrackingMore quota critically low: ${quotaStatus.trackingmore.used}/${quotaStatus.trackingmore.limit} (${Math.round(tmUsagePercent)}%)`,
                action: 'Immediate action required - upgrade plan or implement native APIs',
                urgency: 'high'
            });
        } else if (tmUsagePercent > 70) {
            analysis.healthStatus = 'yellow';
            analysis.alerts.push({
                level: 'warning',
                type: 'quota_warning', 
                message: `TrackingMore quota at ${Math.round(tmUsagePercent)}%`,
                action: 'Monitor usage closely and prepare contingency plans',
                urgency: 'medium'
            });
        }
        
        // Прогнозування на основі поточного часу
        const currentHour = new Date().getHours();
        const hoursInDay = 24;
        const projectedDailyUsage = currentHour > 0 ? 
            Math.round(quotaStatus.trackingmore.used * (hoursInDay / currentHour)) : 
            quotaStatus.trackingmore.used;
        
        if (projectedDailyUsage > quotaStatus.trackingmore.limit) {
            analysis.alerts.push({
                level: 'warning',
                type: 'projected_overrun',
                message: `Projected daily usage (${projectedDailyUsage}) may exceed limit`,
                action: 'Implement rate limiting or native API integration',
                urgency: 'medium'
            });
        }
        
        // Рекомендації для high-usage перевізників
        const highUsageCarriers = Object.entries(quotaStatus.carriers)
            .filter(([carrier, data]) => data.used > 5 && data.provider === 'trackingmore')
            .sort((a, b) => b[1].used - a[1].used);
        
        if (highUsageCarriers.length > 0) {
            analysis.recommendations.push({
                type: 'native_api_priority',
                priority: 'high',
                carriers: highUsageCarriers.slice(0, 3).map(([carrier, data]) => ({
                    carrier: carrier,
                    usage: data.used,
                    potentialSavings: (data.used * data.cost * 30).toFixed(2) + ' USD/month'
                })),
                reasoning: 'High-usage carriers would benefit most from native API integration'
            });
        }
        
        res.json({
            success: true,
            data: quotaStatus,
            analysis: analysis,
            projections: {
                dailyUsage: projectedDailyUsage,
                remainingToday: Math.max(0, quotaStatus.trackingmore.limit - projectedDailyUsage),
                hoursUntilLimit: currentHour > 0 && projectedDailyUsage > quotaStatus.trackingmore.limit ? 
                    Math.max(0, Math.floor((quotaStatus.trackingmore.limit - quotaStatus.trackingmore.used) * (currentHour / quotaStatus.trackingmore.used))) : 
                    null
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Quota status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get quota status',
            code: 'QUOTA_STATUS_ERROR'
        });
    }
});

// GET /api/migration-plan - стратегічний план переходу
router.get('/migration-plan', async (req, res) => {
    try {
        const trackingService = new TrackingService(req.redis, req.supabase);
        const quotaStatus = await trackingService.getQuotaStatus();
        
        // Інформація про доступність API
        const apiAvailability = {
            'ukrposhta': {
                available: true,
                complexity: 'medium',
                cost: 'free',
                documentation: 'limited',
                estimatedDays: 3,
                notes: 'Official API available, may require registration'
            },
            'meest-express': {
                available: true,
                complexity: 'high',
                cost: 'partnership',
                documentation: 'limited',
                estimatedDays: 7,
                notes: 'Corporate API requires business partnership'
            },
            'justin': {
                available: false,
                complexity: 'high',
                cost: 'scraping',
                documentation: 'none',
                estimatedDays: 10,
                notes: 'No public API, would require web scraping'
            },
            'dhl': {
                available: true,
                complexity: 'low',
                cost: 'free_tier',
                documentation: 'excellent',
                estimatedDays: 2,
                notes: 'DHL Developer API with generous free tier'
            },
            'fedex': {
                available: true,
                complexity: 'medium',
                cost: 'free_tier',
                documentation: 'good',
                estimatedDays: 4,
                notes: 'FedEx Developer API available'
            },
            'ups': {
                available: true,
                complexity: 'medium',
                cost: 'free_tier',
                documentation: 'good',
                estimatedDays: 4,
                notes: 'UPS Developer API with tracking services'
            }
        };
        
        // Генерація плану міграції
        const migrationPhases = {
            immediate: {
                title: "Immediate Priority (Week 1-2)",
                description: "Quick wins with high impact",
                carriers: [],
                totalSavings: 0,
                totalEffort: 0
            },
            shortTerm: {
                title: "Short Term (Month 1)",
                description: "Medium complexity integrations",
                carriers: [],
                totalSavings: 0,
                totalEffort: 0
            },
            longTerm: {
                title: "Long Term (Month 2-3)",
                description: "Complex integrations and partnerships",
                carriers: [],
                totalSavings: 0,
                totalEffort: 0
            }
        };
        
        if (quotaStatus && quotaStatus.carriers) {
            Object.entries(quotaStatus.carriers).forEach(([carrier, data]) => {
                const api = apiAvailability[carrier];
                if (!api || data.provider !== 'trackingmore' || data.used < 1) return;
                
                const monthlySavings = data.used * data.cost * 30;
                const item = {
                    carrier: carrier,
                    currentUsage: data.used,
                    monthlySavings: parseFloat(monthlySavings.toFixed(2)),
                    developmentDays: api.estimatedDays,
                    complexity: api.complexity,
                    availability: api.available,
                    notes: api.notes,
                    roi: monthlySavings > 0 ? Math.round(api.estimatedDays / (monthlySavings / 4)) : 0 // ROI в тижнях
                };
                
                // Розподіл по фазах
                if (api.available && api.complexity === 'low' && data.used > 5) {
                    migrationPhases.immediate.carriers.push(item);
                    migrationPhases.immediate.totalSavings += monthlySavings;
                    migrationPhases.immediate.totalEffort += api.estimatedDays;
                } else if (api.available && api.complexity === 'medium' && data.used > 2) {
                    migrationPhases.shortTerm.carriers.push(item);
                    migrationPhases.shortTerm.totalSavings += monthlySavings;
                    migrationPhases.shortTerm.totalEffort += api.estimatedDays;
                } else {
                    migrationPhases.longTerm.carriers.push(item);
                    migrationPhases.longTerm.totalSavings += monthlySavings;
                    migrationPhases.longTerm.totalEffort += api.estimatedDays;
                }
            });
            
            // Сортування по потенційним заощадженням
            Object.values(migrationPhases).forEach(phase => {
                phase.carriers.sort((a, b) => b.monthlySavings - a.monthlySavings);
                phase.totalSavings = parseFloat(phase.totalSavings.toFixed(2));
            });
        }
        
        // Загальні рекомендації
        const recommendations = {
            nextAction: migrationPhases.immediate.carriers.length > 0 ? 
                `Start with ${migrationPhases.immediate.carriers[0].carrier} - highest ROI and lowest complexity` :
                "Continue monitoring usage patterns",
            timeline: "2-12 weeks for complete migration",
            totalPotentialSavings: parseFloat((migrationPhases.immediate.totalSavings + 
                                            migrationPhases.shortTerm.totalSavings + 
                                            migrationPhases.longTerm.totalSavings).toFixed(2)),
            breakEvenPoint: "Most integrations pay for themselves within 2-4 weeks"
        };
        
        res.json({
            success: true,
            data: {
                currentStatus: quotaStatus,
                migrationPhases: migrationPhases,
                apiAvailability: apiAvailability,
                recommendations: recommendations,
                businessCase: {
                    currentMonthlyCost: parseFloat((Object.values(quotaStatus.carriers)
                        .reduce((sum, carrier) => sum + (carrier.used * carrier.cost * 30), 0)).toFixed(2)),
                    projectedSavings: recommendations.totalPotentialSavings,
                    paybackPeriod: "1-2 months"
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Migration plan error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate migration plan',
            code: 'MIGRATION_PLAN_ERROR'
        });
    }
});

// POST /api/admin/carrier-config - управління конфігурацією перевізників
router.post('/admin/carrier-config', async (req, res) => {
    if (!req.user || req.user.subscription_tier !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Admin access required',
            code: 'INSUFFICIENT_PRIVILEGES'
        });
    }
    
    try {
        const { action, carrierCode, config } = req.body;
        
        if (!action || !carrierCode) {
            return res.status(400).json({
                success: false,
                error: 'Action and carrierCode are required',
                code: 'MISSING_PARAMETERS'
            });
        }
        
        const trackingService = new TrackingService(req.redis, req.supabase);
        const configKey = `carrier_config:${carrierCode}`;
        
        switch (action) {
            case 'enable':
                if (trackingService.providers[carrierCode]) {
                    trackingService.providers[carrierCode].enabled = true;
                    await req.redis.hSet('carrier_configs', carrierCode, JSON.stringify({
                        ...trackingService.providers[carrierCode],
                        enabled: true,
                        updatedAt: new Date().toISOString(),
                        updatedBy: req.user.id
                    }));
                    
                    res.json({
                        success: true,
                        message: `Carrier ${carrierCode} enabled`,
                        data: trackingService.providers[carrierCode]
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Carrier not found',
                        code: 'CARRIER_NOT_FOUND'
                    });
                }
                break;
                
            case 'disable':
                if (trackingService.providers[carrierCode]) {
                    trackingService.providers[carrierCode].enabled = false;
                    await req.redis.hSet('carrier_configs', carrierCode, JSON.stringify({
                        ...trackingService.providers[carrierCode],
                        enabled: false,
                        updatedAt: new Date().toISOString(),
                        updatedBy: req.user.id
                    }));
                    
                    res.json({
                        success: true,
                        message: `Carrier ${carrierCode} disabled`,
                        data: trackingService.providers[carrierCode]
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Carrier not found',
                        code: 'CARRIER_NOT_FOUND'
                    });
                }
                break;
                
            case 'update_quota':
                if (trackingService.providers[carrierCode] && config && config.daily_quota) {
                    trackingService.providers[carrierCode].quota.daily = parseInt(config.daily_quota);
                    await req.redis.hSet('carrier_configs', carrierCode, JSON.stringify({
                        ...trackingService.providers[carrierCode],
                        updatedAt: new Date().toISOString(),
                        updatedBy: req.user.id
                    }));
                    
                    res.json({
                        success: true,
                        message: `Quota updated for ${carrierCode}`,
                        data: trackingService.providers[carrierCode]
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid quota configuration',
                        code: 'INVALID_CONFIG'
                    });
                }
                break;
                
            case 'switch_provider':
                if (trackingService.providers[carrierCode] && config && config.primary_provider) {
                    const validProviders = ['native', 'trackingmore'];
                    if (!validProviders.includes(config.primary_provider)) {
                        return res.status(400).json({
                            success: false,
                            error: 'Invalid provider. Must be: ' + validProviders.join(', '),
                            code: 'INVALID_PROVIDER'
                        });
                    }
                    
                    trackingService.providers[carrierCode].primary = config.primary_provider;
                    await req.redis.hSet('carrier_configs', carrierCode, JSON.stringify({
                        ...trackingService.providers[carrierCode],
                        updatedAt: new Date().toISOString(),
                        updatedBy: req.user.id
                    }));
                    
                    res.json({
                        success: true,
                        message: `Provider switched to ${config.primary_provider} for ${carrierCode}`,
                        data: trackingService.providers[carrierCode]
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid provider configuration',
                        code: 'INVALID_CONFIG'
                    });
                }
                break;
                
            default:
                res.status(400).json({
                    success: false,
                    error: 'Invalid action. Available: enable, disable, update_quota, switch_provider',
                    code: 'INVALID_ACTION'
                });
        }
        
    } catch (error) {
        console.error('Carrier config error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update carrier configuration',
            code: 'CONFIG_UPDATE_ERROR'
        });
    }
});

// GET /api/health-detailed - детальна діагностика системи
router.get('/health-detailed', async (req, res) => {
    try {
        const healthData = {
            timestamp: new Date().toISOString(),
            services: {},
            performance: {},
            quotas: {},
            alerts: []
        };
        
        // Redis діагностика
        try {
            const pingStart = Date.now();
            await req.redis.ping();
            const pingTime = Date.now() - pingStart;
            
            const redisInfo = await req.redis.info('memory');
            const memoryMatch = redisInfo.match(/used_memory_human:(.+)/);
            
            healthData.services.redis = {
                status: 'healthy',
                ping: pingTime + 'ms',
                memory: memoryMatch ? memoryMatch[1].trim() : 'unknown'
            };
            
            if (pingTime > 100) {
                healthData.alerts.push({
                    service: 'redis',
                    level: 'warning',
                    message: `Redis ping time high: ${pingTime}ms`
                });
            }
            
        } catch (redisError) {
            healthData.services.redis = {
                status: 'unhealthy',
                error: redisError.message
            };
            healthData.alerts.push({
                service: 'redis',
                level: 'critical',
                message: 'Redis connection failed'
            });
        }
        
        // Supabase діагностика
        try {
            const supabaseStart = Date.now();
            const { data: carriers, error } = await req.supabase
                .from('carriers')
                .select('count');
                
            if (error) throw error;
            
            healthData.services.supabase = {
                status: 'healthy',
                ping: (Date.now() - supabaseStart) + 'ms',
                carriers: carriers.length
            };
            
        } catch (supabaseError) {
            healthData.services.supabase = {
                status: 'unhealthy',
                error: supabaseError.message
            };
            healthData.alerts.push({
                service: 'supabase',
                level: 'critical',
                message: 'Supabase connection failed'
            });
        }
        
        // Квоти
        try {
            const trackingService = new TrackingService(req.redis, req.supabase);
            healthData.quotas = await trackingService.getQuotaStatus();
        } catch (quotaError) {
            healthData.alerts.push({
                service: 'quotas',
                level: 'warning',
                message: 'Failed to retrieve quota status'
            });
        }
        
        // Performance метрики
        healthData.performance = {
            uptime: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV
        };
        
        // Загальний статус
        const criticalAlerts = healthData.alerts.filter(alert => alert.level === 'critical');
        const overallStatus = criticalAlerts.length > 0 ? 'unhealthy' : 'healthy';
        
        res.status(overallStatus === 'healthy' ? 200 : 503).json({
            success: overallStatus === 'healthy',
            status: overallStatus,
            data: healthData
        });
        
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;

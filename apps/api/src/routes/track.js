// apps/api/src/routes/track.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Middleware для додавання TrackingService до req
const attachTrackingService = (req, res, next) => {
    if (!req.trackingService) {
        // Отримуємо сервіс з app locals (ініціалізований в index.js)
        req.trackingService = req.app.locals.trackingService;
        
        if (!req.trackingService) {
            return res.status(500).json({
                success: false,
                error: 'TrackingService not initialized',
                code: 'SERVICE_UNAVAILABLE'
            });
        }
    }
    next();
};

// Rate limiting middleware (простий in-memory лімітер)
const rateLimitMap = new Map();

const createRateLimit = (windowMs = 60000, maxRequests = 10) => {
    return (req, res, next) => {
        const key = req.user ? `user_${req.user.id}` : `ip_${req.ip || req.connection.remoteAddress}`;
        const now = Date.now();
        
        // Більше запитів для авторизованих користувачів
        const limit = req.user ? 
            (req.user.subscription_tier === 'premium' ? 100 : 50) : 
            maxRequests;

        if (!rateLimitMap.has(key)) {
            rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        const userData = rateLimitMap.get(key);

        if (now > userData.resetTime) {
            userData.count = 1;
            userData.resetTime = now + windowMs;
            return next();
        }

        if (userData.count >= limit) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((userData.resetTime - now) / 1000),
                limit: limit,
                remaining: 0
            });
        }

        userData.count++;
        
        // Додаємо rate limit headers
        res.set({
            'X-RateLimit-Limit': limit,
            'X-RateLimit-Remaining': Math.max(0, limit - userData.count),
            'X-RateLimit-Reset': new Date(userData.resetTime).toISOString()
        });
        
        next();
    };
};

const trackingRateLimit = createRateLimit(15 * 60 * 1000, 20); // 15 хвилин, 20 запитів

// Validation middleware
const validateTrackingNumber = [
    body('trackingNumber')
        .trim()
        .notEmpty()
        .withMessage('Tracking number is required')
        .isLength({ min: 8, max: 50 })
        .withMessage('Tracking number must be 8-50 characters')
        .matches(/^[A-Za-z0-9\-]+$/)
        .withMessage('Tracking number contains invalid characters'),
    
    body('source')
        .optional()
        .isIn(['ukrposhta', 'novaposhta', 'trackingmore', 'dhl', 'sat', 'delivery_auto'])
        .withMessage('Invalid source specified'),
        
    body('forceRefresh')
        .optional()
        .isBoolean()
        .withMessage('forceRefresh must be a boolean'),

    body('multiSource')
        .optional()
        .isBoolean()
        .withMessage('multiSource must be a boolean')
];

// Параметр валідація для GET endpoints
const validateTrackingParam = [
    param('trackingNumber')
        .trim()
        .isLength({ min: 8, max: 50 })
        .withMessage('Invalid tracking number length')
        .matches(/^[A-Za-z0-9\-]+$/)
        .withMessage('Invalid tracking number format')
];

// Утиліти для логування
const logTrackingRequest = (req, result, responseTime, error = null) => {
    const logData = {
        action: error ? 'track_error' : 'track_request',
        trackingNumber: req.body?.trackingNumber?.substring(0, 6) + '***',
        userId: req.user?.id || null,
        ip: req.ip,
        success: result?.success || false,
        sources: result?.sources?.length || 0,
        cached: result?.cached || false,
        multiSource: req.body?.multiSource || false,
        responseTime: responseTime,
        error: error?.message,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent')
    };
    
    if (error) {
        console.error(logData);
    } else {
        console.log(logData);
    }
};

// POST /track - основний endpoint для multi-source трекінгу
router.post('/track', 
    trackingRateLimit,
    attachTrackingService,
    validateTrackingNumber,
    async (req, res) => {
        const startTime = Date.now();
        
        try {
            // Валідація запиту
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                });
            }

            const { 
                trackingNumber, 
                source, 
                forceRefresh = false, 
                multiSource = true 
            } = req.body;
            const userId = req.user?.id || null;

            console.log(`[TRACK] ${trackingNumber} - source: ${source || 'auto'}, multiSource: ${multiSource}, refresh: ${forceRefresh}`);

            // Використовуємо новий multi-source API
            const result = await req.trackingService.trackShipment(
                trackingNumber,
                source,
                forceRefresh,
                { multiSource, userId }
            );

            const responseTime = Date.now() - startTime;
            logTrackingRequest(req, result, responseTime);

            // Формуємо відповідь
            if (result.success) {
                res.json({
                    success: true,
                    trackingNumber: result.trackingNumber,
                    consolidatedStatus: result.consolidatedStatus,
                    consolidatedMessage: result.consolidatedMessage,
                    lastUpdate: result.lastUpdate,
                    estimatedDelivery: result.estimatedDelivery,
                    sources: result.sources.map(source => ({
                        provider: source.provider,
                        status: source.status,
                        message: source.message,
                        events: source.events || [],
                        cost: source.cost || 0,
                        cached: source.cached || false,
                        supportsInternational: source.supportsInternational || false
                    })),
                    meta: {
                        requestId: req.requestId || `req_${Date.now()}`,
                        responseTime: responseTime,
                        totalSources: result.sources.length,
                        cached: result.cached || false,
                        timestamp: new Date().toISOString()
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: result.error || 'Tracking information not found in any source',
                    code: 'TRACKING_NOT_FOUND',
                    trackingNumber: trackingNumber,
                    sourcesChecked: result.sourcesChecked || 0,
                    meta: {
                        requestId: req.requestId || `req_${Date.now()}`,
                        responseTime: responseTime,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            logTrackingRequest(req, null, responseTime, error);
            
            // Детальніші коди помилок
            let statusCode = 500;
            let errorCode = 'INTERNAL_SERVER_ERROR';
            
            if (error.message.includes('rate limit')) {
                statusCode = 429;
                errorCode = 'RATE_LIMIT_EXCEEDED';
            } else if (error.message.includes('not found')) {
                statusCode = 404;
                errorCode = 'TRACKING_NOT_FOUND';
            } else if (error.message.includes('validation')) {
                statusCode = 400;
                errorCode = 'VALIDATION_ERROR';
            }
            
            res.status(statusCode).json({
                success: false,
                error: error.message,
                code: errorCode,
                meta: {
                    requestId: req.requestId || `req_${Date.now()}`,
                    responseTime: responseTime,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
);

// Підтримка старого формату (/tracking endpoint)
router.post('/tracking', 
    trackingRateLimit,
    attachTrackingService,
    validateTrackingNumber,
    async (req, res) => {
        // Перенаправляємо на новий endpoint
        req.body.multiSource = req.body.multiSource !== false; // За замовчуванням true
        return router.stack[0].handle(req, res);
    }
);

// GET /track/:trackingNumber - альтернативний ендпоінт
router.get('/track/:trackingNumber',
    trackingRateLimit,
    attachTrackingService,
    validateTrackingParam,
    async (req, res) => {
        const startTime = Date.now();
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid tracking number format',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                });
            }

            const { trackingNumber } = req.params;
            const { source, refresh, multiSource = 'true' } = req.query;
            const userId = req.user?.id || null;

            const result = await req.trackingService.trackShipment(
                trackingNumber,
                source,
                refresh === 'true',
                { multiSource: multiSource !== 'false', userId }
            );

            const responseTime = Date.now() - startTime;

            if (result.success) {
                res.json({
                    success: true,
                    trackingNumber: result.trackingNumber,
                    consolidatedStatus: result.consolidatedStatus,
                    sources: result.sources,
                    meta: {
                        responseTime: responseTime,
                        timestamp: new Date().toISOString()
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
            const responseTime = Date.now() - startTime;
            console.error(`[GET TRACK ERROR] ${req.params.trackingNumber}: ${error.message}`);
            
            res.status(500).json({
                success: false,
                error: 'Internal server error during tracking',
                code: 'INTERNAL_SERVER_ERROR',
                meta: {
                    responseTime: responseTime,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
);

// GET /track/:trackingNumber/history - історія трекінгу
router.get('/track/:trackingNumber/history',
    attachTrackingService,
    validateTrackingParam,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid tracking number format',
                    details: errors.array()
                });
            }

            const { trackingNumber } = req.params;
            
            const history = await req.trackingService.getTrackingHistory(trackingNumber);
            
            res.json({
                success: true,
                trackingNumber: trackingNumber,
                history: history,
                totalEvents: history.length,
                meta: {
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error(`[HISTORY ERROR] ${req.params.trackingNumber}: ${error.message}`);
            res.status(500).json({
                success: false,
                error: 'Failed to get tracking history',
                code: 'HISTORY_ERROR',
                message: error.message
            });
        }
    }
);

// POST /track/batch - пакетний трекінг
router.post('/track/batch',
    createRateLimit(15 * 60 * 1000, 5), // Менше лімітів для batch
    attachTrackingService,
    [
        body('trackingNumbers')
            .isArray({ min: 1, max: 10 })
            .withMessage('1-10 tracking numbers required'),
        body('trackingNumbers.*')
            .matches(/^[A-Za-z0-9\-]{8,50}$/)
            .withMessage('Invalid tracking number format'),
        body('source').optional().isString(),
        body('forceRefresh').optional().isBoolean(),
        body('multiSource').optional().isBoolean()
    ],
    async (req, res) => {
        const startTime = Date.now();
        
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                });
            }

            const { 
                trackingNumbers, 
                source, 
                forceRefresh = false,
                multiSource = true 
            } = req.body;
            const userId = req.user?.id || null;

            console.log(`[BATCH TRACK] ${trackingNumbers.length} numbers, multiSource: ${multiSource}`);

            const results = await Promise.allSettled(
                trackingNumbers.map(async (number, index) => {
                    // Додаємо невелику затримку між запитами
                    await new Promise(resolve => setTimeout(resolve, index * 100));
                    
                    return req.trackingService.trackShipment(
                        number, 
                        source, 
                        forceRefresh,
                        { multiSource, userId }
                    );
                })
            );

            const response = {
                success: true,
                total: trackingNumbers.length,
                successful: 0,
                failed: 0,
                results: []
            };

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.success) {
                    response.successful++;
                    response.results.push({
                        trackingNumber: trackingNumbers[index],
                        status: 'success',
                        data: result.value
                    });
                } else {
                    response.failed++;
                    response.results.push({
                        trackingNumber: trackingNumbers[index],
                        status: 'error',
                        error: result.reason?.message || result.value?.error || 'Unknown error'
                    });
                }
            });

            const responseTime = Date.now() - startTime;
            
            console.log(`[BATCH COMPLETE] ${response.successful}/${response.total} successful, ${responseTime}ms`);

            res.json({
                ...response,
                meta: {
                    responseTime: responseTime,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error(`[BATCH ERROR]: ${error.message}`);
            
            res.status(500).json({
                success: false,
                error: 'Batch tracking failed',
                code: 'BATCH_ERROR',
                meta: {
                    responseTime: responseTime,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
);

// GET /carriers - список підтримуваних перевізників
router.get('/carriers', attachTrackingService, async (req, res) => {
    try {
        // Отримуємо з бази даних
        const { data: carriers, error } = await req.supabase
            .from('carriers')
            .select('id, name, code, is_active, tracking_url_template, supports_international')
            .eq('is_active', true)
            .order('name');
        
        if (error) throw error;
        
        // Додаємо інформацію про провайдерів
        const providersInfo = await req.trackingService.getProvidersInfo();
        
        const enrichedCarriers = carriers.map(carrier => ({
            id: carrier.id,
            name: carrier.name,
            code: carrier.code,
            trackingUrlTemplate: carrier.tracking_url_template,
            supportsInternational: carrier.supports_international,
            provider: providersInfo[carrier.code] || null
        }));
        
        res.json({
            success: true,
            data: enrichedCarriers,
            meta: {
                count: enrichedCarriers.length,
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
router.post('/detect-carrier', 
    [
        body('trackingNumber')
            .trim()
            .notEmpty()
            .matches(/^[A-Za-z0-9\-]{8,50}$/)
            .withMessage('Invalid tracking number format')
    ],
    attachTrackingService,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array()
                });
            }

            const { trackingNumber } = req.body;
            
            const detectedCarriers = await req.trackingService.detectCarriers(trackingNumber);
            
            res.json({
                success: true,
                data: {
                    trackingNumber: trackingNumber,
                    detectedCarriers: detectedCarriers,
                    totalMatches: detectedCarriers.length,
                    confidence: detectedCarriers.length > 0 ? 'high' : 'low'
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
    }
);

// GET /providers - інформація про провайдерів
router.get('/providers', attachTrackingService, async (req, res) => {
    try {
        const providers = await req.trackingService.getProvidersInfo();
        res.json({
            success: true,
            data: providers,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get providers info',
            code: 'PROVIDERS_INFO_ERROR'
        });
    }
});

// GET /providers/health - health check провайдерів
router.get('/providers/health', attachTrackingService, async (req, res) => {
    try {
        const health = await req.trackingService.checkProvidersHealth();
        
        const overallHealthy = Object.values(health).every(p => p.status === 'ok');
        
        res.status(overallHealthy ? 200 : 503).json({
            success: overallHealthy,
            data: health,
            overallStatus: overallHealthy ? 'healthy' : 'degraded',
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            code: 'HEALTH_CHECK_ERROR'
        });
    }
});

// GET /stats - статистика використання
router.get('/stats', attachTrackingService, async (req, res) => {
    try {
        const stats = await req.trackingService.getUsageStats();
        res.json({
            success: true,
            data: stats,
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics',
            code: 'STATS_ERROR'
        });
    }
});

// GET /quota-status - детальний моніторинг квот (з вашого коду)
router.get('/quota-status', attachTrackingService, async (req, res) => {
    try {
        const quotaStatus = await req.trackingService.getQuotaStatus();
        
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
        Object.entries(quotaStatus.carriers || {}).forEach(([carrier, data]) => {
            dailyCost += (data.used || 0) * (data.cost || 0);
        });
        
        analysis.costAnalysis.dailyCost = parseFloat(dailyCost.toFixed(4));
        analysis.costAnalysis.projectedMonthlyCost = parseFloat((dailyCost * 30).toFixed(2));
        
        // Аналіз TrackingMore використання
        if (quotaStatus.trackingmore) {
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
        }
        
        res.json({
            success: true,
            data: quotaStatus,
            analysis: analysis,
            meta: {
                timestamp: new Date().toISOString()
            }
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

// GET /health-detailed - детальна діагностика системи
router.get('/health-detailed', attachTrackingService, async (req, res) => {
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
            await req.redis?.ping();
            const pingTime = Date.now() - pingStart;
            
            healthData.services.redis = {
                status: 'healthy',
                ping: pingTime + 'ms'
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
                .select('count')
                .limit(1);
                
            if (error) throw error;
            
            healthData.services.supabase = {
                status: 'healthy',
                ping: (Date.now() - supabaseStart) + 'ms'
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
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

module.exports = router;

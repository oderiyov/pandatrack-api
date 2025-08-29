// apps/api/src/routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting для auth endpoints
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 хвилин
    max: 5, // максимум 5 спроб авторизації за 15 хвилин
    message: {
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip
});

// Middleware для перевірки авторизації
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
        });
    }
    next();
};

// POST /auth/verify-token - перевірка токену
router.post('/verify-token', authRateLimit, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
                code: 'NO_TOKEN'
            });
        }
        
        const { data: { user }, error } = await req.supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }
        
        // Отримуємо профіль користувача
        const { data: profile } = await req.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    subscription_tier: profile?.subscription_tier || 'free',
                    api_quota_used: profile?.api_quota_used || 0,
                    api_quota_limit: profile?.api_quota_limit || 10,
                    created_at: profile?.created_at
                }
            }
        });
        
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Token verification failed',
            code: 'VERIFICATION_ERROR'
        });
    }
});

// GET /auth/profile - отримання профілю користувача
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const { data: profile, error } = await req.supabase
            .from('profiles')
            .select(`
                id,
                email,
                subscription_tier,
                api_quota_used,
                api_quota_limit,
                created_at,
                updated_at
            `)
            .eq('id', req.user.id)
            .single();
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            data: {
                profile: profile
            }
        });
        
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
            code: 'PROFILE_FETCH_ERROR'
        });
    }
});

// GET /auth/shipments - отримання посилок користувача
router.get('/shipments', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;
        
        const { data: shipments, error, count } = await req.supabase
            .from('shipments')
            .select(`
                id,
                tracking_hash,
                carrier_id,
                status,
                status_code,
                last_update,
                estimated_delivery,
                created_at,
                updated_at,
                carriers(name, code)
            `, { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1);
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            data: {
                shipments: shipments.map(shipment => ({
                    id: shipment.id,
                    trackingHash: shipment.tracking_hash,
                    carrier: {
                        id: shipment.carrier_id,
                        name: shipment.carriers?.name,
                        code: shipment.carriers?.code
                    },
                    status: shipment.status,
                    statusCode: shipment.status_code,
                    lastUpdate: shipment.last_update,
                    estimatedDelivery: shipment.estimated_delivery,
                    createdAt: shipment.created_at,
                    updatedAt: shipment.updated_at
                }))
            },
            meta: {
                page: page,
                limit: limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
        
    } catch (error) {
        console.error('Shipments fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch shipments',
            code: 'SHIPMENTS_FETCH_ERROR'
        });
    }
});

// GET /auth/shipments/:id/events - отримання подій для конкретної посилки
router.get('/shipments/:id/events', requireAuth, async (req, res) => {
    try {
        const shipmentId = req.params.id;
        
        // Перевіряємо, що посилка належить користувачу
        const { data: shipment } = await req.supabase
            .from('shipments')
            .select('id')
            .eq('id', shipmentId)
            .eq('user_id', req.user.id)
            .single();
        
        if (!shipment) {
            return res.status(404).json({
                success: false,
                error: 'Shipment not found or access denied',
                code: 'SHIPMENT_NOT_FOUND'
            });
        }
        
        // Отримуємо події
        const { data: events, error } = await req.supabase
            .from('events')
            .select('*')
            .eq('shipment_id', shipmentId)
            .order('event_date', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            data: {
                events: events
            }
        });
        
    } catch (error) {
        console.error('Events fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch shipment events',
            code: 'EVENTS_FETCH_ERROR'
        });
    }
});

// DELETE /auth/shipments/:id - видалення посилки
router.delete('/shipments/:id', requireAuth, async (req, res) => {
    try {
        const shipmentId = req.params.id;
        
        // Видаляємо посилку (тільки якщо вона належить користувачу)
        const { error } = await req.supabase
            .from('shipments')
            .delete()
            .eq('id', shipmentId)
            .eq('user_id', req.user.id);
        
        if (error) {
            throw error;
        }
        
        res.json({
            success: true,
            message: 'Shipment deleted successfully'
        });
        
    } catch (error) {
        console.error('Shipment deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete shipment',
            code: 'SHIPMENT_DELETE_ERROR'
        });
    }
});

// GET /auth/quota - перевірка використання API квоти
router.get('/quota', requireAuth, async (req, res) => {
    try {
        const { data: profile } = await req.supabase
            .from('profiles')
            .select('api_quota_used, api_quota_limit, subscription_tier')
            .eq('id', req.user.id)
            .single();
        
        const quotaUsed = profile?.api_quota_used || 0;
        const quotaLimit = profile?.api_quota_limit || 10;
        const subscriptionTier = profile?.subscription_tier || 'free';
        
        res.json({
            success: true,
            data: {
                quota: {
                    used: quotaUsed,
                    limit: quotaLimit,
                    remaining: Math.max(0, quotaLimit - quotaUsed),
                    percentage: quotaLimit > 0 ? Math.round((quotaUsed / quotaLimit) * 100) : 0
                },
                subscription: {
                    tier: subscriptionTier,
                    features: {
                        trackingLimit: subscriptionTier === 'premium' ? 1000 : 10,
                        apiAccess: subscriptionTier !== 'free',
                        prioritySupport: subscriptionTier === 'premium'
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Quota check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check quota',
            code: 'QUOTA_CHECK_ERROR'
        });
    }
});

module.exports = router;

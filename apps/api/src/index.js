// apps/api/src/index.js - ОНОВЛЕНИЙ З НОВОЮ АРХІТЕКТУРОЮ
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// НОВІ ІМПОРТИ - оновлена архітектура
const TrackingService = require('./services/TrackingService');
const ProviderFactory = require('./providers/ProviderFactory');

// Routes
const trackRoutes = require('./routes/track');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy для отримання реальних IP адрес через nginx
app.set('trust proxy', 1);

// Redis client initialization
const redisClient = redis.createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
    socket: {
        reconnectStrategy: (retries) => {
            console.log(`Redis reconnection attempt ${retries}`);
            if (retries > 10) {
                console.error('Redis connection failed after 10 retries');
                return new Error('Redis connection failed after 10 retries');
            }
            return Math.min(retries * 100, 3000);
        },
        connectTimeout: 10000,
        commandTimeout: 5000
    }
});

// Supabase client initialization
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Redis connection handlers
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
    console.log('Redis connecting...');
});

redisClient.on('ready', () => {
    console.log('Redis connected successfully');
});

redisClient.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

redisClient.on('end', () => {
    console.log('Redis connection ended');
});

// НОВИЙ: Глобальний TrackingService інстанс
let trackingService = null;

// Connect to Redis з правильним error handling
(async () => {
    try {
        await redisClient.connect();
        console.log('Redis connection established');
        
        // НОВИЙ: Ініціалізація TrackingService після підключення Redis
        trackingService = new TrackingService(redisClient, supabase);
        console.log('TrackingService initialized with new architecture');
        
        // Тест провайдерів
        try {
            const healthCheck = await ProviderFactory.healthCheckAll();
            console.log('Providers health check:', JSON.stringify(healthCheck, null, 2));
        } catch (error) {
            console.warn('Provider health check failed:', error.message);
        }
        
    } catch (error) {
        console.error('Failed to connect to Redis:', error.message);
        console.log('API will continue without Redis caching');
        
        // Ініціалізуємо TrackingService навіть без Redis (з обмеженою функціональністю)
        trackingService = new TrackingService(null, supabase);
        console.log('TrackingService initialized without Redis');
    }
})();

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://pandatrack.com.ua',
            'https://www.pandatrack.com.ua',
            'https://app.pandatrack.com.ua'
        ];
        
        if (!origin) return callback(null, true);
        
        if (process.env.NODE_ENV !== 'production') {
            allowedOrigins.push('http://localhost:3000');
            allowedOrigins.push('http://localhost:3001');
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req, res, next) => {
    req.requestId = uuidv4();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});

// ОНОВЛЕНИЙ: Inject clients та TrackingService
app.use((req, res, next) => {
    req.redis = redisClient;
    req.supabase = supabase;
    req.trackingService = trackingService; // НОВИЙ: додаємо TrackingService
    next();
});

// Global rate limiting
const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.path === '/health' || req.path === '/api/health';
    }
});

app.use(globalRateLimit);

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: duration,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            requestId: req.requestId,
            timestamp: new Date().toISOString()
        });
    });
    
    next();
});

// Authentication middleware (optional for tracking)
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        req.user = null;
        return next();
    }
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            req.user = null;
            return next();
        }
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, api_quota_used, api_quota_limit')
            .eq('id', user.id)
            .single();
        
        req.user = {
            id: user.id,
            email: user.email,
            subscription_tier: profile?.subscription_tier || 'free',
            api_quota_used: profile?.api_quota_used || 0,
            api_quota_limit: profile?.api_quota_limit || 10
        };
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        req.user = null;
    }
    
    next();
};

app.use(authenticateToken);

// ОНОВЛЕНИЙ Health check endpoint з новою архітектурою
app.get('/health', async (req, res) => {
    try {
        // Перевірка Redis підключення
        let redisStatus = 'disconnected';
        try {
            if (redisClient && redisClient.isReady) {
                await redisClient.ping();
                redisStatus = 'connected';
            }
        } catch (redisError) {
            console.warn('Redis health check failed:', redisError.message);
        }
        
        // Перевірка Supabase підключення
        const { data, error } = await supabase
            .from('carriers')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        
        // НОВИЙ: Перевірка TrackingService та провайдерів
        let trackingServiceStatus = 'not_initialized';
        let providersStatus = {};
        
        if (trackingService) {
            try {
                const healthCheck = await trackingService.healthCheck();
                trackingServiceStatus = 'ok';
                providersStatus = healthCheck.components.providers;
            } catch (tsError) {
                console.warn('TrackingService health check failed:', tsError.message);
                trackingServiceStatus = 'error';
            }
        }
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '2.0.0', // ОНОВЛЕНА ВЕРСІЯ
            architecture: 'multi-source', // НОВЕ
            services: {
                redis: redisStatus,
                supabase: 'connected',
                trackingService: trackingServiceStatus,
                api: 'running'
            },
            providers: providersStatus,
            features: {
                multiSourceTracking: true,
                ukrposhtaNativeAPI: !!process.env.UKRPOSHTA_STATUS_BEARER,
                internationalTracking: true,
                costOptimization: true
            },
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('Health check failed:', error);
        
        let redisStatus = 'unknown';
        try {
            redisStatus = redisClient && redisClient.isReady ? 'connected' : 'disconnected';
        } catch {}
        
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Service unhealthy',
            services: {
                redis: redisStatus,
                supabase: 'error',
                trackingService: trackingService ? 'initialized' : 'not_initialized',
                api: 'running'
            }
        });
    }
});

// НОВИЙ: Endpoint для тестування провайдерів
app.get('/api/providers/health', async (req, res) => {
    try {
        if (!trackingService) {
            return res.status(503).json({
                success: false,
                error: 'TrackingService not initialized'
            });
        }
        
        const healthCheck = await ProviderFactory.healthCheckAll();
        
        res.json({
            success: true,
            providers: healthCheck,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// НОВИЙ: Endpoint для quota status
app.get('/api/quota-status', async (req, res) => {
    try {
        if (!trackingService) {
            return res.status(503).json({
                success: false,
                error: 'TrackingService not initialized'
            });
        }
        
        const quotaStatus = await trackingService.getQuotaStatus();
        
        res.json({
            success: true,
            quotas: quotaStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API Routes
app.use('/api', trackRoutes);
app.use('/api/auth', authRoutes);

// ОНОВЛЕНИЙ Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'PandaTrack API',
        version: '2.0.0',
        architecture: 'multi-source-providers',
        status: 'running',
        documentation: 'https://docs.pandatrack.com.ua',
        features: [
            'Multi-source tracking',
            'Ukrposhta native API',
            'International tracking via UPU',
            'Cost-optimized routing',
            'Provider-based architecture'
        ],
        endpoints: {
            health: '/health',
            tracking: 'POST /api/tracking',
            carriers: 'GET /api/carriers',
            detectCarrier: 'POST /api/detect-carrier',
            providersHealth: 'GET /api/providers/health',
            quotaStatus: 'GET /api/quota-status'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        code: 'NOT_FOUND',
        availableEndpoints: {
            health: 'GET /health',
            tracking: 'POST /api/tracking',
            carriers: 'GET /api/carriers',
            detectCarrier: 'POST /api/detect-carrier',
            providersHealth: 'GET /api/providers/health',
            quotaStatus: 'GET /api/quota-status'
        }
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    if (error.message && error.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            error: 'CORS error: Origin not allowed',
            code: 'CORS_ERROR'
        });
    }
    
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON format',
            code: 'INVALID_JSON'
        });
    }
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        requestId: req.requestId
    });
});

// Graceful shutdown з очищенням провайдерів
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    try {
        // Очищення кешу провайдерів
        ProviderFactory.clearCache();
        
        if (redisClient && redisClient.isReady) {
            await redisClient.quit();
            console.log('Redis connection closed');
        }
    } catch (error) {
        console.error('Error during shutdown:', error.message);
    }
    
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    
    try {
        // Очищення кешу провайдерів
        ProviderFactory.clearCache();
        
        if (redisClient && redisClient.isReady) {
            await redisClient.quit();
            console.log('Redis connection closed');
        }
    } catch (error) {
        console.error('Error during shutdown:', error.message);
    }
    
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PandaTrack API Server v2.0 running on port ${PORT}`);
    console.log(`🏗️  Architecture: Multi-Source Provider Pattern`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📡 Providers health: http://localhost:${PORT}/api/providers/health`);
});

module.exports = app;
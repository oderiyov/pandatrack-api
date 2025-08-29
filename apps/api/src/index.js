// apps/api/src/index.js - ВИПРАВЛЕНА ВЕРСІЯ
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Routes
const trackRoutes = require('./routes/track');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy для отримання реальних IP адрес через nginx
app.set('trust proxy', 1);

// ВИПРАВЛЕНЕ Redis client initialization
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

// ВИПРАВЛЕНІ Redis connection handlers
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

// Connect to Redis з правильним error handling
(async () => {
    try {
        await redisClient.connect();
        console.log('Redis connection established');
    } catch (error) {
        console.error('Failed to connect to Redis:', error.message);
        console.log('API will continue without Redis caching');
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

// Inject Redis and Supabase clients into request
app.use((req, res, next) => {
    req.redis = redisClient;
    req.supabase = supabase;
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

// ВИПРАВЛЕНИЙ Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Перевірка Redis підключення (безпечна)
        let redisStatus = 'disconnected';
        try {
            if (redisClient.isReady) {
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
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            services: {
                redis: redisStatus,
                supabase: 'connected',
                api: 'running'
            },
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('Health check failed:', error);
        
        let redisStatus = 'unknown';
        try {
            redisStatus = redisClient.isReady ? 'connected' : 'disconnected';
        } catch {}
        
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: 'Service unhealthy',
            services: {
                redis: redisStatus,
                supabase: 'error',
                api: 'running'
            }
        });
    }
});

// API Routes
app.use('/api', trackRoutes);
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'PandaTrack API',
        version: '1.0.0',
        status: 'running',
        documentation: 'https://docs.pandatrack.com.ua',
        endpoints: {
            health: '/health',
            tracking: 'POST /api/tracking',
            carriers: 'GET /api/carriers',
            detectCarrier: 'POST /api/detect-carrier'
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
            detectCarrier: 'POST /api/detect-carrier'
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

// ВИПРАВЛЕНИЙ Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    try {
        if (redisClient.isReady) {
            await redisClient.quit();
            console.log('Redis connection closed');
        }
    } catch (error) {
        console.error('Error closing Redis connection:', error.message);
    }
    
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    
    try {
        if (redisClient.isReady) {
            await redisClient.quit();
            console.log('Redis connection closed');
        }
    } catch (error) {
        console.error('Error closing Redis connection:', error.message);
    }
    
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PandaTrack API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
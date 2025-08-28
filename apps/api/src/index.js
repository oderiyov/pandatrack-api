const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

const app = express();
const PORT = process.env.PORT || 3001;

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'https://pandatrack.com.ua',
    'https://www.pandatrack.com.ua',
    'https://app.pandatrack.com.ua',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
  ],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  store: new (require('express-rate-limit').MemoryStore)(),
  // TODO: Implement Redis store for production
});

app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await redis.ping();
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      redis: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      redis: 'disconnected'
    });
  }
});

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'PandaTrack API',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  redis.disconnect();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PandaTrack API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
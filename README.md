# PandaTrack

Ukrainian package tracking service with multi-carrier support and AI-powered carrier detection.

## Overview

PandaTrack is a mobile-first package tracking platform designed for Ukrainian market with plans to expand to EU (future PaketSpuren.de). The service provides unified tracking across multiple carriers with automatic carrier detection and intelligent caching.

## Architecture

**Hybrid Infrastructure:**
- **Frontend**: Next.js 15 deployed on Vercel
- **Backend**: Node.js/Express API on Hetzner VPS  
- **Database**: Supabase PostgreSQL (eu-west-1)
- **Cache**: Redis 7-alpine with LRU eviction
- **CDN/Proxy**: Cloudflare with SSL termination

## Features

### Core Functionality
- **Multi-carrier tracking**: Nova Poshta, Ukrposhta, Meest Express, DHL
- **Auto-detection**: Carrier identification by tracking number patterns
- **Smart caching**: Dynamic TTL based on delivery status (1h active, 24h delivered)
- **Real-time API**: RESTful endpoints with comprehensive validation
- **Security**: Data encryption, rate limiting, CORS protection

### API Endpoints

```
GET  /health                    # System health status
GET  /api/carriers              # List supported carriers  
POST /api/tracking              # Track package (main endpoint)
POST /api/detect-carrier        # Auto-detect carrier
GET  /api/tracking/:number      # Alternative GET tracking
POST /api/auth/verify-token     # JWT verification
GET  /api/auth/profile          # User profile
```

### Supported Carriers

| Carrier | Code | API | Status |
|---------|------|-----|--------|
| Nova Poshta | `nova-poshta` | Direct API | ✅ Working |
| Ukrposhta | `ukrposhta` | TrackingMore | 🧪 Testing |
| Meest Express | `meest` | TrackingMore | 🧪 Testing |
| DHL Express | `dhl` | TrackingMore | 🧪 Testing |

## Quick Start

### Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- Docker & Docker Compose
- Redis 7+
- Valid API keys (TrackingMore, Nova Poshta)

### Installation

```bash
# Clone repository
git clone https://github.com/oderiyov/pandatrack-api.git
cd pandatrack-api

# Setup environment variables
cp .env.example .env.production
# Edit .env.production with your API keys

# Start services
docker-compose up -d

# Test API
./test_api.sh
```

### Environment Variables

```env
# Supabase Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Redis Cache
REDIS_HOST=redis
REDIS_PORT=6379

# External APIs
TRACKINGMORE_API_KEY=your_trackingmore_key    # 100 free requests/day
NOVAPOSHTA_API_KEY=your_novaposhta_key        # Ukrainian postal service

# Security
ENCRYPTION_KEY=your_32_character_encryption_key
TRACKING_SALT=your_tracking_salt_string
```

## Development

### Project Structure

```
pandatrack-api/
├── apps/
│   ├── api/                    # Express API backend
│   │   ├── src/
│   │   │   ├── services/       # Business logic
│   │   │   │   └── trackingService.js
│   │   │   ├── routes/         # API endpoints
│   │   │   │   ├── track.js
│   │   │   │   └── auth.js
│   │   │   └── index.js        # Express app
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                    # Next.js frontend
│       ├── src/app/
│       └── package.json
├── docker-compose.yml          # Infrastructure setup
├── test_api.sh                # API testing script
└── README.md
```

### Local Development

```bash
# API development
cd apps/api
npm install
npm run dev

# Frontend development  
cd apps/web
npm install
npm run dev
```

### Testing

```bash
# Run comprehensive API tests
./test_api.sh

# Test specific endpoints
curl -X POST https://api.pandatrack.com.ua/api/tracking \
  -H "Content-Type: application/json" \
  -d '{"trackingNumber":"20451192101724"}'

# Check service health
curl https://api.pandatrack.com.ua/health
```

## Deployment

### Production Infrastructure

**Server**: Hetzner CPX11 (€4.51/month)
- Ubuntu 24.04 LTS
- 2 vCPU, 4GB RAM, 40GB SSD
- Location: Nuremberg (minimal latency to Ukraine)

**Domains**:
- `https://pandatrack.com.ua` - Frontend (Vercel)
- `https://api.pandatrack.com.ua` - API (Hetzner)

### Deployment Commands

```bash
# Update production
git pull origin main
docker-compose down
docker-compose build --no-cache api  
docker-compose up -d

# Monitor logs
docker-compose logs -f api

# Check health
curl https://api.pandatrack.com.ua/health
```

## API Integration Examples

### Track Package
```javascript
const response = await fetch('https://api.pandatrack.com.ua/api/tracking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ trackingNumber: '20451192101724' })
});

const data = await response.json();
// Returns: carrier, status, events, estimated delivery
```

### Auto-detect Carrier
```javascript
const response = await fetch('https://api.pandatrack.com.ua/api/detect-carrier', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ trackingNumber: 'CP123456789UA' })
});

const data = await response.json();
// Returns: detectedCarrier, confidence level
```

## Business Model

### Pricing Tiers
- **Free**: 10 tracks/month + ads
- **Premium**: 49 UAH/month (unlimited tracking)
- **Business API**: 299 UAH/month (API access)

### Market Strategy
- **Phase 1**: Ukrainian market validation (target: €200-800 MRR)
- **Phase 2**: EU expansion as PaketSpuren.de
- **Competition**: vidstezhyty.com.ua (strong SEO presence)

## Monitoring & Maintenance

### Health Checks
```bash
# API status
curl https://api.pandatrack.com.ua/health

# Redis status  
docker exec pandatrack_redis redis-cli ping

# Database connection
# Check Supabase dashboard
```

### Performance Metrics
- Health endpoint: <100ms
- Carriers list: <200ms  
- Tracking (cached): <100ms
- Tracking (API call): <2000ms

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open Pull Request

## Security

- **Data Encryption**: Tracking numbers encrypted at rest
- **Rate Limiting**: IP-based with user tier support
- **CORS Protection**: Whitelist domains only
- **SSL/TLS**: Let's Encrypt with auto-renewal
- **API Keys**: Environment variables only

## License

Private project. All rights reserved.

## Support

For technical issues or business inquiries:
- Repository: https://github.com/oderiyov/pandatrack-api
- API Status: https://api.pandatrack.com.ua/health

---

**Status**: MVP Ready (95% complete)  
**Last Updated**: August 2025  
**Version**: 1.0.0
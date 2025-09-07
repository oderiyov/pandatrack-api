# PandaTrack Multi-Source Tracking System

Український сервіс відстеження посилок з multi-source архітектурою. MVP для тестування ніші перед розширенням на європейський ринок (майбутній PaketSpuren.de).

## Особливості

- **Multi-Source Tracking**: Один номер перевіряється у кількох джерелах одночасно
- **Нативні API**: Пряма інтеграція з Укрпошта, Nova Poshta, DHL без посередників
- **Cost Optimization**: Пріоритет безкоштовним API, платні як fallback
- **Provider Pattern**: Модульна архітектура для легкого додавання перевізників
- **Real-time Updates**: Швидкі відповіді (<200ms) з кешуванням

## Підтримувані перевізники

### Українські (Нативні API)
- **Укрпошта** - повна інтеграція з UPU Global Track & Trace
- **Nova Poshta** - нативний API
- **Delivery Auto** - подвійний підхід (API + web fallback)
- **SAT** - API + web fallback

### Міжнародні
- **DHL** - Unified Tracking API (250 запитів/день)
- **TrackingMore** - universal fallback для 500+ перевізників

### Покриття ринку
- Український ринок: **95%+**
- Міжнародний трекінг: **90%+**

## Архітектура

```
PandaTrack API v2.0
├── Provider Pattern Architecture
├── Multi-Source Resolution
├── Cost Optimization Layer
└── Real-time Aggregation
```

### Компоненти

**Providers:**
- `BaseProvider` - базовий клас з нормалізацією
- `UkrposhtaProvider` - множинні fallback стратегії
- `NovaPoshtaProvider` - нативна інтеграція
- `TrackingMoreProvider` - універсальний fallback
- `DHLProvider`, `DeliveryAutoProvider`, `SATProvider`

**Services:**
- `CarrierDetector` - автоматичне визначення перевізника
- `MultiSourceResolver` - паралельне опитування джерел
- `CacheManager` - Redis кешування з динамічним TTL
- `QuotaManager` - контроль витрат API

## Швидкий старт

### Системні вимоги

- Node.js 18+
- Docker & Docker Compose
- Redis
- PostgreSQL (Supabase)

### Локальна розробка

```bash
# Клонування репозиторію
git clone https://github.com/yourusername/pandatrack-api.git
cd pandatrack-api

# Встановлення залежностей
npm install

# Налаштування environment
cp .env.example .env
# Заповніть необхідні API ключі в .env

# Запуск через Docker
docker-compose up -d

# Перевірка статусу
curl http://localhost:3001/health
```

### Production Deployment

```bash
# На сервері (Ubuntu 24.04)
docker-compose -f docker-compose.prod.yml up -d

# Перевірка всіх провайдерів
curl https://api.pandatrack.com.ua/api/providers/health
```

## API Usage

### Базове відстеження

```bash
curl -X POST https://api.pandatrack.com.ua/api/track \
  -H "Content-Type: application/json" \
  -d '{"trackingNumber": "20450000000000"}'
```

### Multi-source response

```json
{
  "success": true,
  "trackingNumber": "20450000000000",
  "consolidatedStatus": "Delivered",
  "sources": [
    {
      "provider": "Nova Poshta",
      "status": "Delivered",
      "events": [...],
      "cost": 0,
      "supportsInternational": false
    }
  ],
  "meta": {
    "responseTime": 137,
    "totalSources": 1,
    "cached": false
  }
}
```

### Health Check

```bash
# Загальний статус системи
GET /health

# Статус усіх провайдерів
GET /api/providers/health
```

## Environment Configuration

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Ukrainian Carriers (Native APIs)
NOVAPOSHTA_API_KEY=your_nova_poshta_key
UKRPOSHTA_STATUS_BEARER=your_ukrposhta_bearer_token
DELIVERY_AUTO_PUBLIC_KEY=your_delivery_auto_public_key
DELIVERY_AUTO_SECRET_KEY=your_delivery_auto_secret_key
SAT_API_KEY=your_sat_api_key

# International Carriers
DHL_API_KEY=your_dhl_unified_api_key
DHL_API_SECRET=your_dhl_secret
TRACKINGMORE_API_KEY=your_trackingmore_key

# Security
ENCRYPTION_KEY=32_character_hex_key
TRACKING_SALT=32_character_hex_salt
```

## Database Schema

### Core Tables

```sql
-- Carrier configurations
carriers (id, code, name, api_type, enabled, config)

-- Encrypted tracking data
shipments (id, tracking_number_hash, carrier_id, encrypted_data, status)

-- Status history
events (id, shipment_id, status, location, timestamp, raw_data)

-- API cost control
carrier_quotas (carrier_id, daily_limit, used_today, cost_per_request)
```

## Performance

### Benchmarks (Production)

- **Response Time**: <200ms average
- **Success Rate**: >95% all providers
- **Cache Hit Rate**: 85%+
- **API Availability**: 99.9% uptime

### Cost Optimization

- Native APIs: **безкоштовно** (Укрпошта, Nova Poshta, SAT)
- DHL: 250 запитів/день безкоштовно
- TrackingMore: $0.019/запит (тільки fallback)

## Development

### Project Structure

```
apps/api/src/
├── providers/           # Provider implementations
├── services/           # Business logic
├── routes/            # API endpoints
└── utils/             # Utilities & encryption

supabase/migrations/    # Database migrations
infrastructure/        # Docker & Nginx configs
```

### Adding New Provider

1. Extend `BaseProvider` class
2. Implement required methods: `track()`, `healthCheck()`, `canHandle()`
3. Add patterns to `CarrierDetector`
4. Register in `ProviderFactory`
5. Add environment variables

### Testing

```bash
# Unit tests
npm test

# Provider health checks
npm run test:providers

# Integration tests
npm run test:integration
```

## Monitoring

### Health Endpoints

- `/health` - System status
- `/api/providers/health` - All providers status
- `/api/metrics` - Performance metrics

### Logs

```bash
# API logs
docker logs pandatrack_api

# Provider-specific logs
docker logs pandatrack_api | grep "ukrposhta"
```

## API Documentation

### Authentication

Currently using API keys. JWT implementation planned for v2.1.

### Rate Limiting

- Free tier: 10 requests/month
- Premium: unlimited
- Per-IP: 100 requests/hour

### Error Handling

Standard HTTP status codes with detailed error messages:

```json
{
  "success": false,
  "error": "Provider temporarily unavailable",
  "code": "PROVIDER_ERROR",
  "provider": "ukrposhta",
  "retryAfter": 300
}
```

## Roadmap

### v2.1 (Next)
- [ ] Frontend interface (React/Next.js)
- [ ] WebSocket real-time updates
- [ ] Background job processing
- [ ] Performance optimizations

### v2.2 (Future)
- [ ] Mobile API endpoints
- [ ] Additional carriers (Meest, Justin, FedEx)
- [ ] Advanced analytics
- [ ] European market expansion (PaketSpuren.de)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- ESLint configuration provided
- Provider pattern for new integrations
- Comprehensive error handling
- Security-first approach (PII encryption)

## License

MIT License - see LICENSE file for details.

## Support

- **Production Issues**: Create GitHub issue
- **Integration Help**: Check API documentation
- **Business Inquiries**: Contact via GitHub discussions

## Infrastructure

**Production Environment:**
- **Server**: Hetzner CPX11 (€4.51/month)
- **Database**: Supabase PostgreSQL
- **Cache**: Redis 7 Alpine
- **SSL**: Let's Encrypt (auto-renewal)
- **Domain**: pandatrack.com.ua via Cloudflare

**Architecture**: Multi-source provider pattern with cost optimization and real-time aggregation.

---

**Status**: Production-ready MVP with 6/6 operational providers covering 95%+ of Ukrainian market and 90%+ international tracking capabilities.
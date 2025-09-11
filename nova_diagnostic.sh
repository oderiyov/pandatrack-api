#!/bin/bash
# nova_diagnostic.sh - Комплексна діагностика Nova Poshta API

TRACKING_NUMBER="20451192101724"
API_BASE="https://api.pandatrack.com.ua"

echo "=== ДІАГНОСТИКА NOVA POSHTA API ==="
echo "Номер для тестування: $TRACKING_NUMBER"
echo "Час початку: $(date)"
echo

# 1. Перевірка здоров'я API
echo "1. 🏥 Перевірка здоров'я API..."
HEALTH_RESPONSE=$(curl -s "$API_BASE/health")
echo "Health check відповідь:"
echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
echo

# 2. Перевірка провайдерів
echo "2. 🏢 Перевірка провайдерів..."
PROVIDERS_RESPONSE=$(curl -s "$API_BASE/api/providers/health")
echo "Providers health відповідь:"
echo "$PROVIDERS_RESPONSE" | jq '.' 2>/dev/null || echo "$PROVIDERS_RESPONSE"
echo

# 3. Перевірка кешу Redis для цього номера
echo "3. 🗄️ Перевірка кешу Redis..."
CACHE_CHECK=$(docker exec pandatrack_redis redis-cli GET "tracking:$TRACKING_NUMBER" 2>/dev/null)
if [ "$CACHE_CHECK" != "" ] && [ "$CACHE_CHECK" != "(nil)" ]; then
    echo "❌ Знайдено кешовані дані (можливо застарілі):"
    echo "$CACHE_CHECK" | head -c 200
    echo "..."
    echo "Видаляємо кеш для цього номера..."
    docker exec pandatrack_redis redis-cli DEL "tracking:$TRACKING_NUMBER"
else
    echo "✅ Кеш порожній для цього номера"
fi
echo

# 4. Тестування API endpoints
echo "4. 🧪 Тестування tracking API..."
echo "Запит до: $API_BASE/api/track/$TRACKING_NUMBER"

TRACKING_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}\nTIME:%{time_total}" "$API_BASE/api/track/$TRACKING_NUMBER")
HTTP_STATUS=$(echo "$TRACKING_RESPONSE" | grep "HTTPSTATUS:" | cut -d: -f2)
TIME_TOTAL=$(echo "$TRACKING_RESPONSE" | grep "TIME:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$TRACKING_RESPONSE" | sed '/HTTPSTATUS:/d' | sed '/TIME:/d')

echo "HTTP статус: $HTTP_STATUS"
echo "Час відповіді: ${TIME_TOTAL}s"
echo

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ API відповідає успішно"
    echo "Відповідь API:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    
    # Аналіз відповіді
    echo
    echo "5. 📊 Аналіз відповіді..."
    
    # Перевіряємо consolidated status
    CONSOLIDATED_STATUS=$(echo "$RESPONSE_BODY" | jq -r '.consolidatedStatus' 2>/dev/null)
    echo "Consolidated Status: $CONSOLIDATED_STATUS"
    
    # Перевіряємо кількість джерел
    SOURCES_COUNT=$(echo "$RESPONSE_BODY" | jq '.sources | length' 2>/dev/null)
    echo "Кількість джерел: $SOURCES_COUNT"
    
    # Перевіряємо події
    EVENTS_COUNT=$(echo "$RESPONSE_BODY" | jq '.sources[0].events | length' 2>/dev/null)
    echo "Кількість подій: $EVENTS_COUNT"
    
    # Перевіряємо дати подій
    echo "Перша подія:"
    echo "$RESPONSE_BODY" | jq '.sources[0].events[0]' 2>/dev/null
    
    echo "Остання подія:"
    echo "$RESPONSE_BODY" | jq '.sources[0].events[-1]' 2>/dev/null
    
else
    echo "❌ API помилка. HTTP статус: $HTTP_STATUS"
    echo "Відповідь сервера:"
    echo "$RESPONSE_BODY"
fi

echo
echo "6. 🔍 Перевірка логів контейнера..."
echo "Останні 10 рядків логів API:"
docker logs pandatrack_api --tail 10

echo
echo "7. 📋 Рекомендації..."

if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ API не працює. Рекомендації:"
    echo "   - Перевірте чи запущений контейнер: docker ps"
    echo "   - Перезапустіть API: docker restart pandatrack_api"
    echo "   - Перевірте логи: docker logs pandatrack_api"
elif [ "$EVENTS_COUNT" = "0" ] || [ "$EVENTS_COUNT" = "null" ]; then
    echo "⚠️ Немає подій. Рекомендації:"
    echo "   - Перевірте Nova Poshta API ключ"
    echo "   - Перевірте JWT токен"
    echo "   - Перевірте з'єднання з Nova Poshta API"
elif [ "$CONSOLIDATED_STATUS" = "null" ] || [ "$CONSOLIDATED_STATUS" = "" ]; then
    echo "⚠️ Немає статусу. Рекомендації:"
    echo "   - Перевірте нормалізацію відповіді"
    echo "   - Перевірте обробку подій"
else
    echo "✅ API працює правильно!"
    echo "   - Статус: $CONSOLIDATED_STATUS"
    echo "   - Події: $EVENTS_COUNT"
    echo "   - Час відповіді: ${TIME_TOTAL}s"
fi

echo
echo "=== ДІАГНОСТИКА ЗАВЕРШЕНА ==="
echo "Час завершення: $(date)"

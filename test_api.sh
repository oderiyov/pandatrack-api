#!/bin/bash

# PandaTrack API Test Script
# Цей скрипт тестує всі основні endpoint'и API

API_BASE_URL="https://api.pandatrack.com.ua"
# Або для локального тестування:
# API_BASE_URL="http://localhost:3001"

echo "🧪 PandaTrack API Testing Script"
echo "================================"
echo "API Base URL: $API_BASE_URL"
echo ""

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функція для HTTP запитів
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    echo -e "${BLUE}Testing: $method $endpoint${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            "$API_BASE_URL$endpoint")
    fi
    
    # Розділяємо відповідь і статус код
    response_body=$(echo "$response" | head -n -1)
    status_code=$(echo "$response" | tail -n 1)
    
    # Перевіряємо статус код
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ Status: $status_code (Expected: $expected_status)${NC}"
        echo -e "${GREEN}Response: $(echo "$response_body" | jq -C 2>/dev/null || echo "$response_body")${NC}"
    else
        echo -e "${RED}❌ Status: $status_code (Expected: $expected_status)${NC}"
        echo -e "${RED}Response: $(echo "$response_body" | jq -C 2>/dev/null || echo "$response_body")${NC}"
    fi
    
    echo ""
    return $((status_code == expected_status ? 0 : 1))
}

# 1. Health Check
echo -e "${YELLOW}1. Health Check${NC}"
make_request "GET" "/health" "" 200

# 2. Root endpoint
echo -e "${YELLOW}2. Root Endpoint${NC}"
make_request "GET" "/" "" 200

# 3. Get Carriers
echo -e "${YELLOW}3. Get Carriers List${NC}"
make_request "GET" "/api/carriers" "" 200

# 4. Carrier Detection - Nova Poshta
echo -e "${YELLOW}4. Carrier Detection - Nova Poshta${NC}"
make_request "POST" "/api/detect-carrier" '{"trackingNumber":"20450000000001"}' 200

# 5. Carrier Detection - Ukrposhta
echo -e "${YELLOW}5. Carrier Detection - Ukrposhta${NC}"
make_request "POST" "/api/detect-carrier" '{"trackingNumber":"CP123456789UA"}' 200

# 6. Carrier Detection - Invalid format
echo -e "${YELLOW}6. Carrier Detection - Invalid Format${NC}"
make_request "POST" "/api/detect-carrier" '{"trackingNumber":"123"}' 400

# 7. Track Package - Valid Nova Poshta (можливо не існує)
echo -e "${YELLOW}7. Track Package - Nova Poshta${NC}"
make_request "POST" "/api/tracking" '{"trackingNumber":"20450000000001"}' 404

# 8. Track Package - Invalid format
echo -e "${YELLOW}8. Track Package - Invalid Format${NC}"
make_request "POST" "/api/tracking" '{"trackingNumber":"123"}' 400

# 9. Track Package - Missing tracking number
echo -e "${YELLOW}9. Track Package - Missing Tracking Number${NC}"
make_request "POST" "/api/tracking" '{}' 400

# 10. Track Package - Invalid characters
echo -e "${YELLOW}10. Track Package - Invalid Characters${NC}"
make_request "POST" "/api/tracking" '{"trackingNumber":"20450000000001@#$"}' 400

# 11. GET Track endpoint
echo -e "${YELLOW}11. GET Track Endpoint${NC}"
make_request "GET" "/api/tracking/20450000000001" "" 404

# 12. 404 endpoint
echo -e "${YELLOW}12. 404 Endpoint${NC}"
make_request "GET" "/api/nonexistent" "" 404

# 13. Rate limiting test (потрібно запустити кілька разів швидко)
echo -e "${YELLOW}13. Rate Limiting Test${NC}"
echo "Sending multiple requests quickly..."
for i in {1..12}; do
    curl -s -o /dev/null -w "%{http_code} " "$API_BASE_URL/api/carriers"
done
echo ""

# 14. Test with real tracking numbers (якщо є)
if [ "$1" = "real" ]; then
    echo -e "${YELLOW}14. Real Tracking Number Tests${NC}"
    
    # Приклад реального номера Nova Poshta (замініть на актуальний)
    echo "Testing with real Nova Poshta number..."
    make_request "POST" "/api/tracking" '{"trackingNumber":"20450000000001","forceRefresh":true}' 200
    
    # Приклад реального номера Ukrposhta (замініть на актуальний)  
    echo "Testing with real Ukrposhta number..."
    make_request "POST" "/api/tracking" '{"trackingNumber":"CP123456789UA","forceRefresh":true}' 200
fi

# 15. Performance test
echo -e "${YELLOW}15. Performance Test${NC}"
echo "Measuring response times..."
time curl -s -o /dev/null "$API_BASE_URL/health"
time curl -s -o /dev/null "$API_BASE_URL/api/carriers"

echo ""
echo -e "${GREEN}�� API Testing Complete!${NC}"
echo ""
echo -e "${BLUE}Tips for production:${NC}"
echo "• Замініть тестові tracking номери на реальні"
echo "• Додайте API ключі в .env файл"
echo "• Перевірте логи сервера: docker logs pandatrack_api_1"
echo "• Моніторинг Redis: docker exec -it pandatrack_redis_1 redis-cli info"

# Перевірка логів
echo ""
echo -e "${YELLOW}Recent API Logs:${NC}"
echo "Для перегляду логів запустіть:"
echo "docker logs --tail=20 pandatrack_api_1"

exit 0

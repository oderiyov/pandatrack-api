#!/bin/bash
# Діагностика Укрпошта API

BEARER="848d8bbd-0138-3955-92d3-18f4d95399be"
BASE_URL="https://www.ukrposhta.ua/status-tracking/0.0.1"

echo "=== ДІАГНОСТИКА УКРПОШТА API ==="
echo "Час: $(date)"
echo ""

# Тестові номери різних типів
declare -a test_numbers=(
    "0203400088576"           # Внутрішне замовлення
    "0504841007121"           # Український внутрішній (14 цифр)
    "RO959367426EE"           # Міжнародний UPU
    "RK356272728LV"           # З Аліекспресс 
)

# Тест різних endpoints
declare -a endpoints=(
    "statuses/last"
    "statuses"
)

for endpoint in "${endpoints[@]}"; do
    echo "=== ТЕСТУВАННЯ ENDPOINT: $endpoint ==="
    
    for number in "${test_numbers[@]}"; do
        echo ""
        echo "Номер: $number"
        echo "URL: $BASE_URL/$endpoint?barcode=$number&lang=en"
        
        # Виконуємо запит з timeout
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}\n" \
            --max-time 30 \
            -H "Authorization: Bearer $BEARER" \
            -H "Accept: application/json" \
            -H "User-Agent: PandaTrack-Diagnostic/1.0" \
            "$BASE_URL/$endpoint?barcode=$number&lang=en")
        
        # Парсимо відповідь
        http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
        time_total=$(echo "$response" | grep "TIME:" | cut -d: -f2)
        body=$(echo "$response" | sed '/HTTP_CODE:/,$d')
        
        echo "Статус: $http_code"
        echo "Час: ${time_total}s"
        echo "Відповідь: $body"
        echo "---"
        
        # Пауза між запитами
        sleep 2
    done
    
    echo ""
done

# Тест bulk endpoint
echo "=== ТЕСТУВАННЯ BULK ENDPOINT ==="
curl -s -w "\nHTTP_CODE:%{http_code}\nTIME:%{time_total}\n" \
    --max-time 30 \
    -X POST \
    -H "Authorization: Bearer $BEARER" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d '["0500100031143", "20450000000000"]' \
    "$BASE_URL/statuses/last"

echo ""
echo "=== ТЕСТ ЗАВЕРШЕНО ==="

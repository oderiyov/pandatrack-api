#!/bin/bash

# Покрокове тестування PandaTrack API v2.0
API_BASE="https://api.pandatrack.com.ua"
LOCAL_API="http://localhost:3001"

echo "========================================"
echo "КРОК 1: ПІДГОТОВКА СЕРЕДОВИЩА"
echo "========================================"

echo "1.1 Перевірка Docker статусу..."
docker ps | grep pandatrack

echo -e "\n1.2 Базовий health check..."
curl -s "$LOCAL_API/health" | jq '.' || curl -s "$LOCAL_API/health"

echo "========================================"
echo "КРОК 2: ТЕСТУВАННЯ ПРОВАЙДЕРІВ"
echo "========================================"

echo "2.1 Health check провайдерів..."
curl -s "$LOCAL_API/api/providers/health" | jq '.' || curl -s "$LOCAL_API/api/providers/health"

echo -e "\n2.2 Тест Укрпошти (критичний)..."
curl -X POST "$LOCAL_API/api/track" \
  -H "Content-Type: application/json" \
  -d '{"trackingNumber": "0500100031143", "source": "ukrposhta"}' \
  -s | jq '.sources[0].provider, .sources[0].status' || echo "FAILED"

echo -e "\n2.3 Multi-source тест..."
curl -X POST "$LOCAL_API/api/track" \
  -H "Content-Type: application/json" \
  -d '{"trackingNumber": "RO959367426EE", "multiSource": true}' \
  -s | jq '{sources: (.sources | length), status: .consolidatedStatus}' || echo "FAILED"

echo "========================================"
echo "РЕЗУЛЬТАТ"
echo "========================================"
echo "Перевірте результати вище для діагностики проблем"

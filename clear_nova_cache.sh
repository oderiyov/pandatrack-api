#!/bin/bash
# clear_nova_cache.sh - Скрипт для очищення кешу Nova Poshta

echo "🧹 Очищення кешу Nova Poshta..."

# Підключаємося до Redis контейнера
docker exec -it pandatrack_redis redis-cli << 'EOF'
# Видаляємо всі ключі що починаються з tracking:
EVAL "
local keys = redis.call('keys', 'tracking:*')
for i=1,#keys,5000 do
redis.call('del', unpack(keys, i, math.min(i+4999, #keys)))
end
return #keys
" 0

# Перевіряємо скільки ключів залишилось
KEYS tracking:*

# Виходимо з Redis CLI
quit
EOF

echo "✅ Кеш очищено!"

# Перезапускаємо API контейнер для применения исправлений
echo "🔄 Перезапускаємо API контейнер..."
docker restart pandatrack_api

echo "⏳ Чекаємо поки API стартує..."
sleep 10

# Тестуємо API
echo "🧪 Тестуємо API..."
curl -s "https://api.pandatrack.com.ua/health" | jq '.'

echo "🎉 Готово! Тепер можна тестувати номер 20451192101724"

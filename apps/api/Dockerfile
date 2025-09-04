# PandaTrack API Dockerfile
FROM node:18-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package файли для кешування залежностей
COPY package*.json ./

# Встановлюємо залежності
RUN npm install --omit=dev && npm cache clean --force

# Створюємо non-root користувача для безпеки
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pandatrack -u 1001

# Копіюємо вихідний код
COPY --chown=pandatrack:nodejs src/ ./src/

# Встановлюємо права доступу
RUN chown -R pandatrack:nodejs /app && \
    chmod -R 755 /app

# Перемикаємося на non-root користувача
USER pandatrack

# Відкриваємо порт
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { \
        if (res.statusCode === 200) process.exit(0); \
        else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Запускаємо додаток
CMD ["node", "src/index.js"]

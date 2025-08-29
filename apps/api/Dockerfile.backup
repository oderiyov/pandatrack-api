FROM node:18-alpine

# Встановлення базових залежностей
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Робоча директорія
WORKDIR /app

# Копіюємо package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --only=production && npm cache clean --force

# Копіюємо вихідний код
COPY . .

# Створюємо не-root користувача
USER nextjs

# Відкриваємо порт
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Запуск з dumb-init для правильної обробки сигналів
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
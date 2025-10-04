# PandaTrack API Dockerfile with Playwright Support
FROM node:20-bookworm

# Встановлюємо робочу директорію
WORKDIR /app

# Install Playwright system dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    libxshmfence1 \
    fonts-liberation \
    fonts-noto-color-emoji \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо package файли
COPY package*.json ./

# Встановлюємо Node.js залежності
RUN npm install --omit=dev && npm cache clean --force

# Створюємо користувача ПЕРЕД встановленням Playwright
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs pandatrack && \
    mkdir -p /home/pandatrack/.cache && \
    chown -R pandatrack:nodejs /home/pandatrack

# Перемикаємось на pandatrack для встановлення браузерів
USER pandatrack

# Install Playwright browsers під правильним користувачем
ENV PLAYWRIGHT_BROWSERS_PATH=/home/pandatrack/.cache/ms-playwright
RUN npx playwright install chromium

# Повертаємось до root для копіювання файлів
USER root

# Копіюємо вихідний код
COPY --chown=pandatrack:nodejs . ./

# Встановлюємо права
RUN chmod -R 755 /app

# Фінальне перемикання на non-root
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
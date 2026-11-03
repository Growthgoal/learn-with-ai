# Learn with AI: the API serves the built web app. Chromium prints the
# workbook PDFs; ffmpeg turns phone recordings into the WAV that
# Muse Voice Transcribe takes and shrinks photos before checking.
FROM node:22-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium ffmpeg poppler-utils fonts-noto-core fonts-noto-color-emoji ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY api/package.json api/package-lock.json api/
RUN cd api && npm ci --no-audit --no-fund
COPY web/package.json web/package-lock.json web/
RUN cd web && npm ci --no-audit --no-fund
COPY . .
RUN cd web && npm run build
ENV NODE_ENV=production PORT=4300 CHROME_PATH=/usr/bin/chromium SITE_URL=https://growthgoal.in/learn
EXPOSE 4300
WORKDIR /app/api
CMD ["npx", "tsx", "src/index.ts"]

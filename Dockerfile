# ベースイメージ
FROM node:22-alpine AS base

# 依存関係インストール
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ビルダー
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client生成
RUN npx prisma generate

# Next.jsビルド
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ランナー（本番環境）
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 必要なファイルのみコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

# Stage 1: Base Image
FROM node:20-alpine AS base

# Stage 2: Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1 \
    JWT_SECRET="docker_build_dummy_jwt_secret_key_1234567890" \
    REFRESH_TOKEN_SECRET="docker_build_dummy_refresh_token_secret_key_1234567890" \
    MONGODB_URI="mongodb://localhost:27017/proofchain_build" \
    NEXT_PUBLIC_CONTRACT_ADDRESS="0x0000000000000000000000000000000000000000" \
    POLYGON_RPC_URL="https://rpc-amoy.polygon.technology" \
    FASTAPI_URL="http://localhost:8000" \
    INTERNAL_AI_KEY="docker_build_dummy_ai_key"

# Build Next.js app
RUN npm run build

# Stage 4: Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]

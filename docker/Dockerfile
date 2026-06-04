# =============================================================================
# Production Dockerfile - Multi-stage build for minimal attack surface
# =============================================================================
# Stage 1: DEPS - Production dependencies only
# =============================================================================
FROM oven/bun:canary-alpine AS deps

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile --omit=dev --ignore-scripts

# =============================================================================
# Stage 2: BUILDER (Alpine) - Build the application
# =============================================================================
FROM oven/bun:canary-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile --ignore-scripts

COPY . .

RUN bun run db:generate 2>/dev/null || true

RUN bun run build

# =============================================================================
# Stage 3: RUNTIME EXTRACTOR - Extract Bun binary and CA certs from Alpine
# =============================================================================
FROM oven/bun:canary-alpine AS runtime-deps

WORKDIR /app

RUN which bun && cp "$(which bun)" /app/bun && \
    cp /etc/ssl/certs/ca-certificates.crt /app/ca-certificates.crt

# =============================================================================
# Stage 4: PRODUCTION (scratch) - Minimal runtime with Bun binary only
# =============================================================================
FROM scratch AS production

WORKDIR /app

COPY --from=runtime-deps /app/bun /app/bun
COPY --from=runtime-deps /app/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER 1000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV BUN_JSC_majorVersion=0
ENV BUN_JSC_minorVersion=0

EXPOSE 3000

CMD ["/app/bun", "run", "start"]

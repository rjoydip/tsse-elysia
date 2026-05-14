# =============================================================================
# Production Dockerfile - Multi-stage build for minimal attack surface
# =============================================================================
# Stage 1: DEPS (Alpine) - Production dependencies only
# =============================================================================
FROM oven/bun:alpine AS deps

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile --omit=dev --ignore-scripts

# =============================================================================
# Stage 2: BUILDER (Alpine) - Build the application
# =============================================================================
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage (production only)
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./

# Install all dependencies needed for building (vite, tailwind, typescript, etc.)
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Generate Drizzle schema
RUN bun run db:generate 2>/dev/null || true

# Build the application
RUN bun run build

# =============================================================================
# Stage 3: RUNTIME EXTRACTOR - Extract Bun binary and CA certs from Alpine
# =============================================================================
FROM oven/bun:alpine AS runtime-deps

WORKDIR /app

RUN cp /usr/bin/bun /app/bun && \
    cp /etc/ssl/certs/ca-certificates.crt /app/ca-certificates.crt

# =============================================================================
# Stage 4: PRODUCTION (scratch) - Minimal runtime with Bun binary only
# =============================================================================
FROM scratch AS production

WORKDIR /app

COPY --from=runtime-deps /app/bun /app/bun
COPY --from=runtime-deps /app/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

RUN /app/bun install --frozen-lockfile --omit=dev --ignore-scripts

RUN mkdir -p /app/artifacts /app/.artifacts

USER 1000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV BUN_JSC_majorVersion=0
ENV BUN_JSC_minorVersion=0

# Expose port
EXPOSE 3000

CMD ["/app/bun", "run", "start"]

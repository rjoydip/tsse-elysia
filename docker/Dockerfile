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
# Stage 3: RUNTIME (scratch) - Minimal runtime with Bun binary only
# =============================================================================
FROM oven/bun:alpine AS extractor

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

COPY --from=oven/bun:alpine /usr/bin/bun ./bun

COPY --from=oven/bun:alpine /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

FROM scratch AS production

WORKDIR /app

COPY --from=extractor /app/bun /app/bun
COPY --from=extractor /app/dist /app/dist
COPY --from=extractor /app/package.json /app/package.json
COPY --from=extractor /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

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

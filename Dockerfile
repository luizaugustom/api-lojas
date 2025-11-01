# ============================================
# BUILD STAGE
# ============================================
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install system build dependencies for native modules
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    libusb-1.0-0-dev \
    libudev-dev \
    pkg-config \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/* \
  && ln -sf /usr/bin/python3 /usr/bin/python

# Set environment for node-gyp
ENV PYTHON=/usr/bin/python
ENV npm_config_python=/usr/bin/python

# Install dependencies with clean cache
RUN npm ci --prefer-offline --no-audit && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Prune devDependencies for production
RUN npm prune --production

# ============================================
# PRODUCTION STAGE
# ============================================
FROM node:20-bullseye-slim AS production

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    dumb-init \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs || true \
  && useradd -u 1001 -r -g nodejs -m -d /home/nestjs -s /sbin/nologin nestjs || true

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/healthcheck.js ./healthcheck.js

# Create uploads directory
RUN mkdir -p /app/uploads && chown nestjs:nodejs /app/uploads

# Switch to non-root user
USER nestjs

# Expose port (will be overridden by HOST/PORT env vars)
EXPOSE 3000

# Health check with better defaults
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node healthcheck.js || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/src/main.js"]

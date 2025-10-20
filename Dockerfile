# Build stage
FROM node:18-bullseye-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install system build deps required for native modules (node-gyp)
# python3, make, g++, build-base and libusb-dev are needed for packages like `usb`
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    make \
    g++ \
    build-essential \
    libusb-1.0-0-dev \
    libudev-dev \
    pkg-config \
    ca-certificates \
    openssl \
    libssl1.1 \
  && rm -rf /var/lib/apt/lists/* \
  && ln -sf /usr/bin/python3 /usr/bin/python

# Ensure node-gyp will use python
ENV PYTHON=/usr/bin/python
ENV npm_config_python=/usr/bin/python

# Install all dependencies (needed to build the app)
RUN npm ci && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies from node_modules so we only ship production deps
RUN npm prune --production

# Production stage
FROM node:18-bullseye-slim AS production

WORKDIR /app

# Install dumb-init for proper signal handling and common runtime deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init ca-certificates libssl1.1 \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user and group
RUN groupadd -g 1001 nodejs || true \
  && useradd -u 1001 -r -g nodejs -m -d /home/nestjs -s /sbin/nologin nestjs || true

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Create uploads directory
# Create uploads directory and set ownership
RUN mkdir -p /app/uploads && chown nestjs:nodejs /app/uploads

# Switch to non-root user
# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]

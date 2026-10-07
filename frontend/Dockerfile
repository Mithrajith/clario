# ==============================================================================
# Clario Enterprise Platform — Production Frontend Dockerfile
# Multi-stage build (Node 20 build -> Nginx Alpine runtime)
# ==============================================================================

# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency lock files
COPY package.json package-lock.json ./

# Install dependencies cleanly
RUN npm ci

# Copy application source code
COPY . .

# Build production bundle with Vite
RUN npm run build

# ==============================================================================
# Stage 2: Production Nginx Runtime
# ==============================================================================
FROM nginx:1.27-alpine-slim AS runner

# Remove default nginx static html
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static bundle from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]


# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS dev
RUN npm ci
COPY . .
RUN mkdir -p logs && chown nextjs:nodejs logs
USER nextjs
EXPOSE 3000
CMD ["dumb-init", "node", "src/server.js"]

# Build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build 2>/dev/null || echo "No build script found"

# Production stage
FROM base AS production

# Build arguments
ARG NODE_ENV=production
ARG PORT=3000

# Environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

# Copy dependencies from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nextjs:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chown nextjs:nodejs logs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Use non-root user
USER nextjs

# Expose port
EXPOSE ${PORT}

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]

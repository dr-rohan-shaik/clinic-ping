# ClinicPing Web Dockerfile
# Multi-stage build for production

FROM node:20-alpine AS builder

# Install dependencies
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN npm ci

# Copy source files
COPY apps/web/src/ ./apps/web/src/
COPY apps/web/next.config.js ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/tailwind.config.ts ./apps/web/
COPY apps/web/next-env.d.ts ./apps/web/
COPY apps/web/postcss.config.js ./apps/web/
COPY packages/db/ ./packages/db/
COPY tsconfig.json ./
COPY turbo.json ./
COPY packages/db/drizzle.config.ts ./

# Ensure public directory exists
RUN mkdir -p apps/web/public

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application (standalone output)
COPY --from=builder /app/apps/web/.next/standalone/ ./apps/web/.next/standalone/
COPY --from=builder /app/apps/web/.next/static/ ./apps/web/.next/static/
COPY --from=builder /app/apps/web/public/ ./apps/web/public/
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/next.config.js ./apps/web/
COPY --from=builder /app/packages/db/dist/ ./packages/db/dist/
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/tsconfig.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "apps/web/.next/standalone/server.js"]

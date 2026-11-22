# ClinicPing Web Dockerfile
# Multi-stage build for production

FROM node:20-alpine AS builder

# Install dependencies
WORKDIR /app

# Copy package files first for better caching
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Install bun and dependencies
RUN npm install -g bun
RUN bun install

# Copy source files (excluding node_modules)
COPY apps/web/src/ ./apps/web/src/
COPY apps/web/next.config.js ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/tailwind.config.ts ./apps/web/
COPY apps/web/next-env.d.ts ./apps/web/
COPY packages/db/ ./packages/db/
COPY tsconfig.json ./
COPY turbo.json ./
COPY packages/db/drizzle.config.ts ./

# Ensure public directory exists
RUN mkdir -p apps/web/public

# Build the application
RUN bun run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
RUN npm install -g bun
RUN bun install --prod

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
ENV NODE_ENV=production

CMD ["node", "apps/web/.next/standalone/server.js"]
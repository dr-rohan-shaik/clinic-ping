# ClinicPing Web Dockerfile
# Multi-stage build for production

FROM node:20-alpine AS builder

# Install dependencies
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
RUN npm install -g bun
RUN bun install

# Copy source files
COPY apps/web/ ./apps/web/
COPY packages/db/ ./packages/db/
COPY tsconfig.json ./
COPY turbo.json ./
COPY packages/db/drizzle.config.ts ./

# Build the application
RUN bun run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies
COPY package.json ./
RUN npm install -g bun
RUN bun install --prod

# Copy built application
COPY --from=builder /app/apps/web/.next/ ./apps/web/.next/
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

CMD ["node", "apps/web/.next/server/standalone/server.js"]

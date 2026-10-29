# Production Container for Google Cloud Run, Render, Railway, or VPS
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies including dev tools
RUN npm ci

# Copy application source
COPY . .

# Build production frontend bundle into /app/dist
RUN npm run build

# -------------------------------------------------------------
# Runtime Stage
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Install tsx for running server.ts directly
RUN npm install tsx --save-exact

# Copy compiled frontend and server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/src/types.ts ./src/types.ts

# Non-root user for security
USER node

EXPOSE 8080

# Run Express server (serves API routes and static frontend)
CMD ["npx", "tsx", "server.ts"]

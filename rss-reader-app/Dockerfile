# Multi-stage build for RSS Reader App

# Stage 1: Build Angular frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy all source files
COPY . .

# Clean cache and install ALL dependencies (including dev for build)
RUN npm cache clean --force && npm ci

# Build Angular app for production with correct baseHref
RUN npm run build:prod

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install production dependencies for root
COPY package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY backend ./backend

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Back to app root
WORKDIR /app

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist/rss-reader-app/browser ./dist/rss-reader-app/browser

# Create data directory for SQLite database
RUN mkdir -p /app/backend/data

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the backend server (which will serve the Angular app)
CMD ["node", "backend/server.js"]

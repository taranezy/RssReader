# Multi-stage build for RSS Reader App

# Stage 1: Build Angular frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files from rss-reader-app directory
COPY rss-reader-app/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code from rss-reader-app directory
COPY rss-reader-app/ .

# Build Angular app for production
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy backend package files
COPY rss-reader-app/backend/package*.json ./backend/

# Install production dependencies
WORKDIR /app/backend
RUN npm ci --only=production

WORKDIR /app

# Copy backend code
COPY rss-reader-app/backend ./backend

# Rebuild better-sqlite3 for Alpine Linux
WORKDIR /app/backend
RUN npm rebuild better-sqlite3

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

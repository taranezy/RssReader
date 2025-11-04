# Multi-stage build for RSS Reader App

# Stage 1: Build Angular frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Angular app for production
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY backend ./backend

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

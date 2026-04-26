# Build frontend to get index.html for OG tag injection
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .
COPY --from=frontend-builder /frontend/dist/index.html ./public/index.html
EXPOSE 3000
CMD ["node", "src/index.js"]

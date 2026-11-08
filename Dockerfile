# Build:  docker build -t ielts-coach .
# Run:    docker run -p 3000:3000 -v ielts-data:/app/data --env-file .env ielts-coach
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY backend ./backend
COPY frontend ./frontend
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data TRUST_PROXY=1
VOLUME /app/data
EXPOSE 3000
CMD ["node", "backend/server.js"]

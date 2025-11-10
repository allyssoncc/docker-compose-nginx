FROM node:24-alpine
RUN apk add curl --no-cache
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi
COPY src/ .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "index.js"]
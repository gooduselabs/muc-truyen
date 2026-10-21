FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx nest build
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && (npx ts-node prisma/seed.ts || true) && node dist/main.js"]

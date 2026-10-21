FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx nest build
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && SEED_IF_EMPTY=1 npx ts-node prisma/seed.ts && node dist/main.js"]

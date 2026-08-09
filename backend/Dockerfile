# Local development only. Render builds on its native Node runtime (see M4).
FROM node:22-alpine

# Prisma's query engine links against OpenSSL, which alpine omits.
RUN apk add --no-cache openssl

WORKDIR /app

# Schema and config first: postinstall runs `prisma generate`, which needs them.
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

COPY . .

USER node

EXPOSE 3000

CMD ["node", "src/index.js"]

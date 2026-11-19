# ##############################################################################
# A4D Event Registration — Multi-stage Production Dockerfile
# ##############################################################################
# Stage 1: Dependencies and Prisma client generation
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig.json ./
RUN npx prisma generate

# Stage 2: Minimal runtime image
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl

# Copy dependencies and application source
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

# Runtime environment settings
ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
ENV PORT=3000
EXPOSE 3000

# Run as non-root user
USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]

# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/traide-ui/package.json ./apps/traide-ui/
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm --prefix apps/traide-ui run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=62008
EXPOSE 62008
COPY --from=builder /app/apps/traide-ui/.next ./apps/traide-ui/.next
COPY --from=builder /app/apps/traide-ui/package.json ./apps/traide-ui/package.json
COPY --from=builder /app/node_modules ./node_modules
CMD ["npm", "--prefix", "apps/traide-ui", "run", "start", "--", "-p", "62008", "-H", "0.0.0.0"]

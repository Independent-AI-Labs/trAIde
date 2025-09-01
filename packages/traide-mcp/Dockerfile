# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /srv
ENV NODE_ENV=production
ENV PORT=62007
EXPOSE 62007
RUN npm init -y >/dev/null 2>&1 \
 && npm install ws@^8 --no-audit --no-fund --silent
COPY packages/traide-mcp/dev-server.js ./dev-server.js
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O- http://127.0.0.1:${PORT}/health || exit 1
CMD ["node", "dev-server.js"]

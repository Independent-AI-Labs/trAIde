# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /srv
ENV NODE_ENV=production
ENV PORT=65000
EXPOSE 65000
COPY packages/traide-mcp/dev-server.js ./dev-server.js
CMD ["node", "dev-server.js"]


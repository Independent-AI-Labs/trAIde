# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /srv
ENV NODE_ENV=production
ENV PORT=62007
EXPOSE 62007
COPY packages/traide-mcp/dev-server.js ./dev-server.js
CMD ["node", "dev-server.js"]

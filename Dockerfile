FROM node:20-slim

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY client/package*.json ./client/
RUN cd client && npm install && npm run build

COPY server/ ./server/
COPY sample_transactions.csv ./

EXPOSE 8080

CMD ["node", "server/src/index.js"]


FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY index.html style.css script.js server.js ./

ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]

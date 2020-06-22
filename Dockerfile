FROM node:10-alpine

WORKDIR /src/app
COPY . .
RUN npm init --yes && \
    npm install express

EXPOSE 3000
CMD [ "node", "./src/server/app.js" ]


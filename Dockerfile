FROM node:10-alpine

RUN npm install express

WORKDIR /src/app

COPY . .

EXPOSE 3000
CMD [ "node", "app.js" ]


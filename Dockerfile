FROM node:10-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache bash git

WORKDIR /src/app
COPY . .

RUN npm install --loglevel verbose
RUN npm run wp_prod
RUN npm run build_server

RUN rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*

EXPOSE 3000
CMD [ "npm", "run", "start_server" ]


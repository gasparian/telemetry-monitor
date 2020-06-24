FROM node:10-alpine

WORKDIR /src/app
COPY . .

RUN npm install 
RUN npm run build

EXPOSE 3000
CMD [ "npm", "start" ]


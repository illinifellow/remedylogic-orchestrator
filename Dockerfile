FROM node:14.4.0-alpine

RUN apk update && apk add --no-cache openssh bash curl

COPY . /app
WORKDIR app
RUN npm i

#EXPOSE 4000
#80 for docker-compose
EXPOSE 80

CMD ./start.sh

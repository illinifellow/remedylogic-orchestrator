FROM node:14.4.0-alpine

ENV REGION=us-east-2
ENV DEPLOYMENT_ENV=dev
ENV CUSTOM_APP_LABEL=show
ENV PORT=80

#RUN apk update && apk add bash
RUN apk update && apk add --no-cache openssh bash

COPY . /app
WORKDIR app
RUN npm i

#EXPOSE 4000
#80 for docker-compose
EXPOSE 80
CMD ./start.sh

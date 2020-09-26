FROM node:14.4.0-alpine

ARG AWS_REGION=us-east-2
ARG DEPLOYMENT_ENV=dev
ARG CUSTOM_APP_LABEL=show
ARG PORT=80

ENV AWS_REGION=$AWS_REGION
ENV DEPLOYMENT_ENV=$DEPLOYMENT_ENV
ENV CUSTOM_APP_LABEL=$CUSTOM_APP_LABEL
ENV PORT=$PORT

#RUN apk update && apk add bash
RUN apk update && apk add --no-cache openssh bash

COPY . /app
WORKDIR app
RUN npm i

#EXPOSE 4000
#80 for docker-compose
EXPOSE 80
CMD ./start.sh

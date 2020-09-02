FROM node:14.4.0-alpine

ENV REGION=us-east-2
ENV APP_ENVIRONMENT=mvp
ENV AWS_ACCOUNT=dev
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

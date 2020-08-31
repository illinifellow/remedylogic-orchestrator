FROM node:14.4.0-alpine

ENV REGION=us-east-2
ENV APP_ENVIRONMENT=mvp1
ENV AWS_ACCOUNT=dev

#RUN apk update && apk add bash
RUN apk update && apk add --no-cache openssh bash

COPY . /app
WORKDIR app
RUN npm i

EXPOSE 4000
CMD ./start.sh

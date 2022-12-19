FROM node:18-alpine

RUN apk update && apk upgrade
RUN apk add git
RUN mkdir -p /usr/src/nuxt-app
COPY nuxt-app /usr/src/
RUN rm -rf /usr/src/nuxt-app/node_modules
WORKDIR /usr/src/nuxt-app
RUN npm install -g npm@9.1.2
RUN npm install


FROM node:12-stretch
WORKDIR /usr/app
COPY . /usr/app

ARG STAGE

RUN npm ci --silent \
    && npm run build

FROM microparts/static-server-php:2.0.3

COPY --from=0 /usr/app/dist /app
COPY --from=0 /usr/app/configuration /app/configuration

ARG VCS_SHA1
ARG STAGE
ENV STAGE $STAGE
ENV VCS_SHA1 $VCS_SHA1

#####################################
#                                   #
#               Base                #
#                                   #
#####################################

FROM node:16-alpine AS base

RUN apk update && \
    apk add --no-cache tini

ENTRYPOINT ["/sbin/tini", "--"]

#####################################
#                                   #
#               BUILD               #
#                                   #
#####################################

FROM base AS build

ARG NPM_TOKEN
ARG PLUGIN_PATH

ARG WORKDIR=./src/build
RUN mkdir -p $WORKDIR
WORKDIR $WORKDIR

# Just here to run scripts
RUN apk add --no-cache bash

COPY package*.json ./

# This is just to help with running scripts
RUN if [ -z "$PLUGIN_PATH"]; then echo "PLUGIN_PATH is not SET"; exit 1; else : ; fi
COPY "$PLUGIN_PATH" ./plugins/mock

RUN if [ -z "$NPM_TOKEN" ]; then echo "NPM_TOKEN is not SET"; exit 1; else : ; fi

RUN printf "//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n" >> .npmrc && \
    npm cache verify && \
    npm install && \
    bash ./plugins/mock/scripts/npm-install.sh && \
    rm -f .npmrc

COPY ./src ./src
COPY ./bin ./bin

RUN node ./plugins/mock/scripts/build.js --working-dir $WORKDIR --docker

# Remove all unwanted dependancies
# and audit the modules to check for
# any invulnerabilities, this should fail
# upon finding one...
RUN npm prune --production && \
    npm audit

#####################################
#                                   #
#            Deployment             #
#                                   #
#####################################

FROM base

# Just to add something to healthcheck
ARG DOCKER_TAG
ARG SOURCE_BRANCH
ARG SOURCE_COMMIT

ENV DOCKER=true
ENV DOCKER_TAG=$DOCKER_TAG
ENV SOURCE_BRANCH=$SOURCE_BRANCH
ENV SOURCE_COMMIT=$SOURCE_COMMIT

ENV HOME=/usr/src/app
ENV VOLUME=/data
ENV PORT 3000

WORKDIR $HOME

COPY --from=build ./src/build/package*.json ./
COPY --from=build ./src/build/src src
COPY --from=build ./src/build/bin bin
COPY --from=build ./src/build/node_modules node_modules

RUN mkdir "$HOME/$VOLUME"
VOLUME "$HOME/$VOLUME"

USER node

EXPOSE $PORT

ENV NODE_ENV=production

CMD node bin/www.js --port $PORT --volume "$HOME/$VOLUME"

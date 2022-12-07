# ================ #
#    Base Stage    #
# ================ #

FROM node:18-buster-slim as base

WORKDIR /opt/app

ENV HUSKY=0
ENV CI=true

RUN apt-get update && \
    apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends build-essential python3 libfontconfig1 dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --chown=node:node yarn.lock .

ENV NODE_OPTIONS="--enable-source-maps"

COPY --chown=node:node package.json .
COPY --chown=node:node tsconfig.json .

RUN sed -i 's/"prepare": "husky install\( .github\/husky\)\?"/"prepare": ""/' ./package.json

ENTRYPOINT ["dumb-init", "--"]

# =================== #
#  Development Stage  #
# =================== #

# Development, used for development only (defaults to watch command)
FROM base as development

ENV NODE_ENV="development"

USER node

CMD [ "yarn", "run", "docker:watch"]

# ================ #
#   Builder Stage  #
# ================ #

# Build stage for production
FROM base as build

RUN npm install

COPY . /opt/app

RUN npm run build

# ==================== #
#   Production Stage   #
# ==================== #

# Production image used to  run the bot in production, only contains node_modules & dist contents.
FROM base as production

ENV NODE_ENV="production"

COPY --from=build /opt/app/dist /opt/app/dist
COPY --from=build /opt/app/node_modules /opt/app/node_modules
COPY --from=build /opt/app/package.json /opt/app/package.json

RUN chown node:node /opt/app/

USER node

CMD [ "yarn", "run", "start:with:push:db"]
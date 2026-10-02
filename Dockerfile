FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile --ignore-scripts --ignore-engines \
  && yarn cache clean

COPY index.js bot.js discord-bot.js ./
COPY utils ./utils

USER node
CMD ["node", "discord-bot.js"]

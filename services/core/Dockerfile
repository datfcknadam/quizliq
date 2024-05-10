FROM node:20.13.1-alpine3.19 as development

WORKDIR /usr/src/app

COPY app/package*.json ./
RUN npm install

CMD ["npm", "run", "start:dev"]

FROM node:20.13.1-alpine3.19 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY app/package*.json ./

RUN npm install --only=prod

COPY app .

COPY --from=development /usr/src/app/dist ./app/dist

CMD ["node", "dist/main"]
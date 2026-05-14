FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]

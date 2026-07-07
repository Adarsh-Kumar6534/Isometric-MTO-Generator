FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run in dev mode for simplicity and hot-reloading in compose
CMD ["npm", "run", "dev"]

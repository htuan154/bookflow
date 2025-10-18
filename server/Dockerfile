FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# The app listens on PORT (default 8080 in index.js). Expose the same.
EXPOSE 8080

CMD ["npm", "start"]
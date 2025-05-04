FROM node:14
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY ../frontend ./frontend
RUN rm -rf frontend/node_modules
EXPOSE 3000
CMD ["node", "app.js"]

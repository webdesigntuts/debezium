FROM node:16-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i
RUN npm install tsconfig-paths -D
COPY . ./
# Exports
EXPOSE 8080
CMD [ "npm", "run", "dev" ]
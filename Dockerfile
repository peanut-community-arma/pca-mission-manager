FROM node:20-alpine

WORKDIR /opt/pca-mission-manager

COPY ["package.json", "package-lock.json", "./"]
RUN npm ci

COPY . .

CMD ["npm", "start"]
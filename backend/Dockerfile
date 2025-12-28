FROM node:20-bullseye
WORKDIR /workspace/backend
COPY package*.json ./
RUN npm install
ENV PORT=3000
CMD ["npm", "run", "dev"]

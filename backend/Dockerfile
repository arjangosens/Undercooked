FROM node:20-bullseye
WORKDIR /workspace/backend
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
ENV PORT=3000
CMD ["npm", "run", "dev"]

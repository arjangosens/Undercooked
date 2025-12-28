FROM node:20-bullseye
WORKDIR /workspace/frontend
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY src ./src
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

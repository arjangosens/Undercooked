FROM node:20-bullseye
WORKDIR /workspace/frontend
COPY package*.json ./
RUN npm install
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

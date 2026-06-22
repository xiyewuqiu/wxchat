FROM public.ecr.aws/docker/library/node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

CMD ["node", "server/index.js"]

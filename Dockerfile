FROM node:22-alpine

# 安装 curl 和 jq（用于脚本调用 API 和解析 JSON）
RUN apk add --no-cache curl jq

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV:-production}

WORKDIR /app

COPY . /app

RUN yarn

EXPOSE 80 443
ENTRYPOINT ["node", "src/index.js"]

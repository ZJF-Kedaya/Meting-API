FROM node:22-alpine

# 安装 curl 和 jq（用于脚本调用 API 和解析 JSON）
RUN apk add --no-cache curl jq

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV:-production}

WORKDIR /app

COPY . /app

RUN yarn

RUN chmod +x /app/update_qqmusic_key.sh

RUN echo "0 0,12 * * * $(pwd)/update_qqmusic_key.sh" >> /var/spool/cron/$(whoami)

EXPOSE 80 443
ENTRYPOINT ["node", "src/index.js"]

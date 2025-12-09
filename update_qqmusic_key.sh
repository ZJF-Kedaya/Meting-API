#!/bin/bash

# 配置
API_URL="https://www.hhlqilongzhu.cn/api/QQmusic_ck/cache_QQmusic/QQkey.php?qq=749513993&musickey=Q_H_L_63k3NXsw-HUAu6_B8Yl7zpVoIQSpB1kinYp56jM30JcDxqgpxpIEgyhIUl-KdvHrkpxsDhuGsFo92WDyo9fqOLVnh"
ENV_FILE=".env"  # 假设脚本和 .env 在同一目录

# 1. 请求 API
response=$(curl -s "$API_URL")
if [ $? -ne 0 ]; then
  echo "$(date): [ERROR] Failed to call API"
  exit 1
fi

# 2. 提取 musickey（使用 jq）
musickey=$(echo "$response" | jq -r '.["music.login.LoginServer.Login"].data.musickey // empty')
if [ -z "$musickey" ] || [ "$musickey" = "null" ]; then
  echo "$(date): [ERROR] Failed to extract musickey"
  echo "Response: $response"
  exit 1
fi

# 3. 替换 .env 中 qqmusic_key=... 的部分（支持 METING_COOKIE_TENCENT 中的子串）
if [ -f "$ENV_FILE" ]; then
  # 使用 sed 替换 qqmusic_key=旧值; 为 qqmusic_key=新值;
  # 注意：转义特殊字符（如 /）用 # 作分隔符
  sed -i "s/qqmusic_key=[^;]*/qqmusic_key=$musickey/" "$ENV_FILE"
  echo "$(date): [SUCCESS] Updated qqmusic_key in $ENV_FILE"
else
  echo "$(date): [ERROR] $ENV_FILE not found"
  exit 1
fi

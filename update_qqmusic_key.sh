#!/bin/sh

# 获取当前脚本的绝对路径
SCRIPT_PATH="$(realpath "$0" 2>/dev/null || readlink -f "$0")"

# 配置（注意：API_URL 中的 musickey 会被自动替换，此处初始值可任意）
API_URL="https://www.hhlqilongzhu.cn/api/QQmusic_ck/cache_QQmusic/QQkey.php?qq=749513993&musickey=Q_H_L_63k3NBSMglLLAlex9MCL4M5JBK-y6DMyL8LzOnS7yHdrGC5JOlp4sYh6NdHvB5N5LZ9fnFemcWOIhChSbCY69kPVN"
ENV_FILE=".env"

# 1. 请求 API
response=$(curl -k -s "$API_URL")
if [ $? -ne 0 ]; then
  echo "$(date): [ERROR] Failed to call API"
  exit 1
fi

# 2. 提取 musickey
musickey=$(echo "$response" | jq -r '.["music.login.LoginServer.Login"].data.musickey // empty')
if [ -z "$musickey" ] || [ "$musickey" = "null" ]; then
  echo "$(date): [ERROR] Failed to extract musickey"
  echo "Response: $response"
  exit 1
fi

# 3. 更新 .env 文件中的 qqmusic_key
if [ -f "$ENV_FILE" ]; then
  sed -i "s/qqmusic_key=[^;]*/qqmusic_key=$musickey/" "$ENV_FILE"
  echo "$(date): [SUCCESS] Updated qqmusic_key in $ENV_FILE"
else
  echo "$(date): [ERROR] $ENV_FILE not found"
  exit 1
fi

# 4. 【关键】更新本脚本中的 API_URL 的 musickey 参数
#    将 URL 中的 &musickey=旧值 或 ?musickey=旧值 替换为新值
escaped_key=$(printf '%s\n' "$musickey" | sed 's/[^^]/[&]/g; s/\^/\\^/g')
sed -i "s/\(musickey=\)[^&\"]*/\1$escaped_key/" "$SCRIPT_PATH"

echo "$(date): [SUCCESS] Updated musickey in script: $SCRIPT_PATH"

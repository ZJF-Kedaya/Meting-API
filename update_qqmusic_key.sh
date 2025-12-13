#!/bin/sh

SCRIPT_PATH="$(realpath "$0" 2>/dev/null || readlink -f "$0")"
ENV_FILE=".env"

# ====== 模板 URL（不要手动编码！）======
# 使用占位符 {{MUSICKEY}}
API_URL_TEMPLATE='https://www.hhlqilongzhu.cn/api/QQmusic_ck/cache_QQmusic/QQkey.php?qq=749513993&musickey={{MUSICKEY}}'

# 提取当前使用的 musickey（从脚本自身）
current_musickey=""
if grep -q 'API_URL_TEMPLATE' "$SCRIPT_PATH"; then
  # 从 .env 读取（推荐）
  if [ -f "$ENV_FILE" ]; then
    # 从 METING_COOKIE_TENCENT 中提取 qqmusic_key=...;
    line=$(grep -o 'qqmusic_key=[^;]*' "$ENV_FILE" | head -n1)
    if [ -n "$line" ]; then
      current_musickey=$(echo "$line" | cut -d'=' -f2)
    fi
  fi
fi

# 如果没有 current_musickey，用一个默认值（第一次运行）
if [ -z "$current_musickey" ]; then
  current_musickey="Q_H_L_63k3NXsw-HUAu6_B8Yl7zpVoIQSpB1kinYp56jM30JcDxqgpxpIEgyhIUl-KdvHrkpxsDhuGsFo92WDyo9fqOLVnh"
fi

# 构建实际 API URL
API_URL=$(echo "$API_URL_TEMPLATE" | sed "s/{{MUSICKEY}}/$current_musickey/")

# ====== 调用 API ======
response=$(curl -k -s "$API_URL")
if [ $? -ne 0 ]; then
  echo "$(date): [ERROR] Failed to call API"
  exit 1
fi

# ====== 提取新 musickey ======
new_musickey=$(echo "$response" | jq -r '.["music.login.LoginServer.Login"].data.musickey // empty')
if [ -z "$new_musickey" ] || [ "$new_musickey" = "null" ]; then
  echo "$(date): [ERROR] Failed to extract musickey"
  echo "Response: $response"
  exit 1
fi

# ====== 更新 .env 文件 ======
if [ -f "$ENV_FILE" ]; then
  sed -i "s/qqmusic_key=[^;]*/qqmusic_key=$new_musickey/" "$ENV_FILE"
  echo "$(date): [SUCCESS] Updated qqmusic_key in $ENV_FILE"
else
  echo "$(date): [ERROR] $ENV_FILE not found"
  exit 1
fi

# ====== 更新脚本中的 current_musickey（通过更新 .env，下次读新值）======
# 注意：我们不再修改 API_URL，而是每次从 .env 动态读取 current_musickey
# 所以无需修改脚本自身（更安全！）

echo "$(date): [INFO] New musickey loaded from .env on next run."

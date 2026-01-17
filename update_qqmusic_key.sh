#!/bin/sh

# 获取脚本所在目录（解决相对路径问题）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_PATH="$(realpath "$0" 2>/dev/null || readlink -f "$0")"
# 变更：目标文件改为脚本同目录下的 cookie/tencent
TARGET_FILE="${SCRIPT_DIR}/cookie/tencent"

# ====== 模板 URL（不要手动编码！）======
# 使用占位符 {{MUSICKEY}}
API_URL_TEMPLATE='https://www.hhlqilongzhu.cn/api/QQmusic_ck/cache_QQmusic/QQkey.php?qq=749513993&musickey={{MUSICKEY}}'

# 提取当前使用的 musickey
current_musickey=""
if grep -q 'API_URL_TEMPLATE' "$SCRIPT_PATH"; then
  # 变更：从 cookie/tencent 读取（替代原 .env）
  if [ -f "$TARGET_FILE" ]; then
    # 从文件中提取 qqmusic_key=...;（兼容行内或独立行）
    line=$(grep -o 'qqmusic_key=[^;]*' "$TARGET_FILE" | head -n1)
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

# ====== 提取新 musickey 和 musickeyCreateTime ======
new_musickey=$(echo "$response" | jq -r '.["music.login.LoginServer.Login"].data.musickey // empty')
new_createtime=$(echo "$response" | jq -r '.["music.login.LoginServer.Login"].data.musickeyCreateTime // empty')

# 验证提取结果
if [ -z "$new_musickey" ] || [ "$new_musickey" = "null" ]; then
  echo "$(date): [ERROR] Failed to extract musickey"
  echo "Response: $response"
  exit 1
fi

if [ -z "$new_createtime" ] || [ "$new_createtime" = "null" ]; then
  echo "$(date): [ERROR] Failed to extract musickeyCreateTime"
  echo "Response: $response"
  exit 1
fi

# ====== 更新目标文件（cookie/tencent）======
if [ -f "$TARGET_FILE" ]; then
  # 更新 qqmusic_key 值
  sed -i.bak "s/qqmusic_key=[^;]*/qqmusic_key=$new_musickey/" "$TARGET_FILE"
  # 更新 psrf_musickey_createtime 值
  sed -i.bak "s/psrf_musickey_createtime=[^;]*/psrf_musickey_createtime=$new_createtime/" "$TARGET_FILE"
  # 新增：更新 qm_keyst 值（使用相同的 musickey）
  sed -i.bak "s/qm_keyst=[^;]*/qm_keyst=$new_musickey/" "$TARGET_FILE"
  
  # 删除备份文件
  rm -f "${TARGET_FILE}.bak"
  echo "$(date): [SUCCESS] Updated qqmusic_key, psrf_musickey_createtime and qm_keyst in $TARGET_FILE"
else
  echo "$(date): [ERROR] $TARGET_FILE not found"
  exit 1
fi

# ====== 提示信息 ======
echo "$(date): [INFO] New musickey and related fields loaded from $TARGET_FILE on next run."

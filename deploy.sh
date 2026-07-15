#!/bin/bash
# 2048游戏前端部署脚本
# 用法: ./deploy.sh

# 本脚本不保存凭证。仅在已获生产操作授权并配置 SSH 密钥后使用。
: "${DEPLOY_SERVER:?请设置 DEPLOY_SERVER，例如 user@example.com}"
REMOTE_PATH="${DEPLOY_REMOTE_PATH:-/var/www/2048}"
LOCAL_FILE="${DEPLOY_LOCAL_FILE:-index.html}"

echo "=== 部署2048游戏前端 ==="
echo ""

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  有未提交的更改，请先提交"
    echo ""
    git status --short
    exit 1
fi

echo "当前版本："
git log -1 --oneline
echo ""

# 备份服务器文件
echo "1. 备份服务器文件..."
ssh -o BatchMode=yes "$DEPLOY_SERVER" \
    "sudo cp $REMOTE_PATH/index.html $REMOTE_PATH/index.html.bak_\$(date +%Y%m%d_%H%M%S)"

# 上传新版本
echo "2. 上传新版本..."
scp "$LOCAL_FILE" "$DEPLOY_SERVER:/tmp/"

# 替换文件
echo "3. 替换文件..."
ssh -o BatchMode=yes "$DEPLOY_SERVER" \
    "sudo mv /tmp/index.html $REMOTE_PATH/index.html && sudo chown ubuntu:ubuntu $REMOTE_PATH/index.html"

echo ""
echo "✅ 部署完成"
echo "访问: http://49.232.149.209:8080/"

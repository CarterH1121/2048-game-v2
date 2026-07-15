#!/usr/bin/env bash
# 2048 玩家端静态发布/回滚脚本。
# 默认仅做本地检查；deploy/rollback 必须在单独获得生产授权后显式执行。

set -euo pipefail

MODE="${1:---check}"
REMOTE_PATH="${DEPLOY_REMOTE_PATH:-/var/www/2048}"
INDEX_FILE="index.html"
SW_FILE="sw.js"

preflight() {
    test -s "$INDEX_FILE" || { echo "缺少 $INDEX_FILE" >&2; exit 1; }
    test -s "$SW_FILE" || { echo "缺少 $SW_FILE" >&2; exit 1; }
    grep -q "serviceWorker.register('./sw.js')" "$INDEX_FILE" || { echo "index.html 未注册 sw.js" >&2; exit 1; }
    grep -Eq "2048-v2-cache-[0-9]{8}-[0-9]+" "$SW_FILE" || { echo "sw.js 缺少显式缓存版本" >&2; exit 1; }

    if [ -n "$(git status --porcelain)" ]; then
        echo "工作树不干净，拒绝发布" >&2
        git status --short
        exit 1
    fi

    git diff --check
    npm test
    echo "本地发布前检查通过：index.html 与 sw.js 必须作为同一发布单元。"
}

require_remote_authorization() {
    : "${DEPLOY_SERVER:?请在获得生产授权后设置 DEPLOY_SERVER，例如 user@example.com}"
}

deploy_release() {
    require_remote_authorization
    preflight

    local release_id
    release_id="$(date +%Y%m%d_%H%M%S)"

    echo "备份远端 index.html 与 sw.js，发布编号：$release_id"
    ssh -o BatchMode=yes "$DEPLOY_SERVER" \
        "set -e; sudo test -s '$REMOTE_PATH/index.html'; sudo test -s '$REMOTE_PATH/sw.js'; sudo cp '$REMOTE_PATH/index.html' '$REMOTE_PATH/index.html.bak_$release_id'; sudo cp '$REMOTE_PATH/sw.js' '$REMOTE_PATH/sw.js.bak_$release_id'"

    echo "上传同一发布单元"
    scp "$INDEX_FILE" "$SW_FILE" "$DEPLOY_SERVER:/tmp/"

    echo "先替换 index.html，再替换带新缓存版本的 sw.js"
    ssh -o BatchMode=yes "$DEPLOY_SERVER" \
        "set -e; sudo mv /tmp/index.html '$REMOTE_PATH/index.html'; sudo mv /tmp/sw.js '$REMOTE_PATH/sw.js'"

    echo "发布完成。回滚命令：./deploy.sh rollback $release_id"
    if [ -n "${DEPLOY_PUBLIC_URL:-}" ]; then
        echo "验收地址：$DEPLOY_PUBLIC_URL"
    fi
}

rollback_release() {
    require_remote_authorization
    local release_id="${2:-}"
    if ! [[ "$release_id" =~ ^[0-9]{8}_[0-9]{6}$ ]]; then
        echo "用法：./deploy.sh rollback YYYYMMDD_HHMMSS" >&2
        exit 1
    fi

    echo "恢复发布编号 $release_id 的 index.html 与 sw.js"
    ssh -o BatchMode=yes "$DEPLOY_SERVER" \
        "set -e; sudo test -s '$REMOTE_PATH/index.html.bak_$release_id'; sudo test -s '$REMOTE_PATH/sw.js.bak_$release_id'; sudo cp '$REMOTE_PATH/index.html.bak_$release_id' '$REMOTE_PATH/index.html'; sudo cp '$REMOTE_PATH/sw.js.bak_$release_id' '$REMOTE_PATH/sw.js'"
    echo "回滚完成；旧 Service Worker 会按其缓存版本重新建立 app shell。"
}

case "$MODE" in
    --check) preflight ;;
    deploy) deploy_release ;;
    rollback) rollback_release "$@" ;;
    *) echo "用法：./deploy.sh [--check|deploy|rollback RELEASE_ID]" >&2; exit 1 ;;
esac

#!/bin/bash
# ============================================================
# 热量追踪 - macOS 启动 + 本地服务器（支持手机测试）
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing server on port 8787
lsof -ti:8787 | xargs kill -9 2>/dev/null

# Start local server
cd "$SCRIPT_DIR"
echo ""
echo "🔥 热量追踪已启动！"
echo ""
echo "  本地访问:  http://localhost:8787"
echo "  手机访问:  http://$(ipconfig getifaddr en0 2>/dev/null || echo 'YOUR_IP'):8787"
echo ""
echo "  按 Ctrl+C 停止服务器"
echo ""

python3 -m http.server 8787 &

# Open browser after a moment
sleep 1
open -a "Google Chrome" --args --app="http://localhost:8787"

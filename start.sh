#!/bin/bash

# GymOps 一键启动脚本
# 同时启动 Backend (FastAPI) 和 Frontend (Next.js)
# Ctrl+C 退出时自动杀掉所有子进程

DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
    echo ""
    echo "正在停止所有服务..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "所有服务已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 启动 Backend
echo "🚀 启动 Backend (http://localhost:8000)..."
cd "$DIR/backend"
if [ ! -d ".venv" ]; then
    echo "未检测到虚拟环境，正在创建..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi
python -m uvicorn main:app --reload &
BACKEND_PID=$!

# 启动 Frontend
echo "🚀 启动 Frontend (http://localhost:3000)..."
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "未检测到 node_modules，正在安装依赖..."
    pnpm install
fi
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "✅ 所有服务已启动"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

wait

# CLAUDE.md

## Project Overview

GymOps (GymOpus) — AI 驱动的健身教练平台。全栈 monorepo，前后端分离架构。

## Tech Stack

### Frontend (`frontend/`)
- **Next.js 16** + **React 19** + **TypeScript 5.7**
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI primitives)
- **Recharts** 数据可视化
- **React Hook Form** + **Zod** 表单验证
- 包管理器：**pnpm**

### Backend (`backend/`)
- **FastAPI** + **Python 3** (async)
- **SQLAlchemy 2** (async) + **aiosqlite** (SQLite)
- **LiteLLM** 多 LLM 提供商集成（OpenAI / Anthropic / DeepSeek / 自定义）
- **Pydantic 2** 数据验证
- **rank-bm25** + **jieba** 知识库检索
- **cryptography** API Key 加密存储

## Project Structure

```
gymops/
├── frontend/           # Next.js App Router
│   ├── app/            # 页面路由 (dashboard, checkin, plan, trends, suggestions, settings)
│   ├── components/
│   │   ├── gym/        # 业务组件 (sidebar, dashboard, checkin modules, trends)
│   │   └── ui/         # shadcn/ui 组件库
│   ├── hooks/          # 自定义 React hooks
│   └── lib/            # API 客户端 (api.ts), 工具函数
├── backend/
│   ├── main.py         # FastAPI 入口, CORS, 路由注册
│   ├── config.py       # Pydantic Settings 配置
│   ├── database.py     # SQLAlchemy async engine
│   ├── models/         # ORM 模型 (user, plan, checkin, suggestion, knowledge)
│   ├── schemas/        # Pydantic 请求/响应 schema
│   ├── routers/        # API 路由 (users, plans, checkins, suggestions, trends)
│   ├── services/       # 业务逻辑 (plan_generator, ai_analyzer, rule_engine, trend_service)
│   ├── knowledge/      # 知识库加载器 + BM25 检索器
│   │   └── data/       # YAML 知识库 (training, nutrition, recovery, general)
│   ├── prompts/        # Jinja2 AI prompt 模板
│   ├── rules/          # YAML 规则定义
│   └── utils/          # 工具函数 (crypto, calculations)
```

## Development Commands

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload          # http://localhost:8000
pytest                                        # 运行测试

# Frontend
cd frontend
pnpm install
pnpm dev                                      # http://localhost:3000
pnpm build && pnpm start                      # 生产构建
pnpm lint                                     # ESLint
```

## API

- Base URL: `http://localhost:8000/api/v1`
- Swagger UI: `http://localhost:8000/docs`
- 主要路由: `/users`, `/plans`, `/checkins`, `/suggestions`, `/trends`

## Environment Variables

Backend `.env` (参考 `backend/.env.example`):
```
DATABASE_URL=sqlite+aiosqlite:///./gymops.db
ENCRYPTION_KEY=          # 留空自动生成
AUTH_ENABLED=false
CORS_ORIGINS=["http://localhost:3000"]
```

Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Patterns

- 后端全异步 (async/await)，使用 FastAPI 依赖注入管理 DB session
- 前端使用 Next.js App Router，客户端组件标记 `"use client"`
- AI 计划生成采用 6 步流水线（参数预处理 → 营养计算 → LLM 生成 → 知识库增强 → 序列化 → 返回）
- UI 语言为简体中文，运动名称支持中英双语
- 数据库使用 SQLite，通过 aiosqlite 实现异步 I/O

# GymOps

AI 驱动的智能健身教练平台 — 训练计划生成、每日打卡记录、数据趋势分析、智能建议推送。

## 功能特性

- **AI 训练计划生成** — 根据用户体征、目标和经验，通过 LLM 自动生成个性化周期训练计划（支持 PPL / 上下肢 / 全身 / 分化等分割方式）
- **全维度每日打卡** — 训练日志（逐组记录）、营养摄入、睡眠质量、情绪状态、补剂追踪、体成分数据
- **数据趋势分析** — 多维度可视化图表，追踪训练容量、体重变化、睡眠质量等长期趋势
- **智能建议系统** — 规则引擎 + AI 分析双驱动，基于打卡数据自动发现问题并给出改进建议
- **知识库检索** — 内置训练、营养、恢复领域知识库，支持中文分词的 BM25 检索
- **多 LLM 支持** — 灵活接入 OpenAI / Anthropic / DeepSeek / 自定义 API，API Key 加密存储

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts |
| 后端 | FastAPI, Python (async), SQLAlchemy 2, Pydantic 2, LiteLLM |
| 数据库 | SQLite (aiosqlite async) |
| AI | LiteLLM (多提供商), Jinja2 prompt 模板, BM25 + jieba 知识检索 |

## 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+
- pnpm

### 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 配置环境变量（可选，有默认值）
cp .env.example .env

# 启动开发服务器
python -m uvicorn main:app --reload
# API: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

### 前端

```bash
cd frontend
pnpm install

# 启动开发服务器
pnpm dev
# App: http://localhost:3000
```

### 环境变量

**Backend** (`backend/.env`):

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | 数据库连接 | `sqlite+aiosqlite:///./gymops.db` |
| `ENCRYPTION_KEY` | API Key 加密密钥 | 自动生成 |
| `AUTH_ENABLED` | 启用认证 | `false` |
| `AUTH_TOKEN` | 认证 Token | - |
| `CORS_ORIGINS` | 允许的前端地址 | `["http://localhost:3000"]` |

**Frontend** (`frontend/.env.local`):

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `http://localhost:8000` |

## 项目结构

```
gymops/
├── frontend/                  # Next.js 前端
│   ├── app/                   # App Router 页面
│   │   ├── page.tsx           # 仪表盘
│   │   ├── checkin/           # 每日打卡
│   │   ├── plan/              # 训练计划
│   │   ├── trends/            # 趋势分析
│   │   ├── suggestions/       # 智能建议
│   │   └── settings/          # 用户设置
│   ├── components/
│   │   ├── gym/               # 业务组件
│   │   └── ui/                # shadcn/ui 组件
│   └── lib/                   # API 客户端、工具函数
│
├── backend/                   # FastAPI 后端
│   ├── main.py                # 应用入口
│   ├── routers/               # API 路由
│   ├── models/                # ORM 模型
│   ├── schemas/               # 请求/响应 Schema
│   ├── services/              # 业务逻辑层
│   ├── knowledge/             # 知识库
│   └── prompts/               # AI Prompt 模板
```

## API 概览

| 模块 | 端点 | 说明 |
|------|------|------|
| 用户 | `POST/GET/PUT/DELETE /api/v1/users` | 用户 CRUD + AI 配置管理 |
| 计划 | `POST /api/v1/plans/generate` | AI 生成训练计划 |
| 计划 | `GET /api/v1/plans/{id}/today` | 获取今日训练 |
| 打卡 | `POST /api/v1/checkins` | 提交每日打卡 |
| 建议 | `POST /api/v1/suggestions/trigger` | 触发 AI 分析 |
| 趋势 | `GET /api/v1/trends/{user_id}` | 获取趋势数据 |

## License

MIT

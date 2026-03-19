# GymOpus

知识约束型健身工作流智能体。通过对话交互，为有健身基础的用户提供基于知识库的训练计划编排和健身知识问答。

## 架构

```
用户 → Next.js 前端 → FastAPI 后端 → LangGraph 工作流 (Postgres Checkpointer)
                                         │
                    ┌────────┬───────────┼───────────┬────────┐
                    ▼        ▼           ▼           ▼        ▼
              PydanticAI  PydanticAI  PydanticAI  PydanticAI  PydanticAI
              Intent      Workout     Meal        Diet        QA Agent
              Agent       Agent       Agent       Agent          │
                    │        │           │           │        │
                    │   ┌────┴────┐ ┌────┴────┐     │        ▼
                    │   ▼         ▼ ▼         ▼     │   LangChain RAG
                    │ Exercise  Food DB   Nutrition  │        │
                    │   DB         │      Calc       │        │
                    └───┴──────────┴────────┴────────┴────────┘
                                         │
                                   PostgreSQL + pgvector
```

**三个核心框架：**
- **LangGraph** — 工作流编排、意图路由、状态管理
- **PydanticAI** — 节点内 LLM 调用、结构化输出、工具注册
- **LangChain** — RAG 管线（文档分块、Embedding、PGVector 检索）

## 前置要求

- Python 3.12+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/)（Python 包管理）
- [pnpm](https://pnpm.io/)（前端包管理）
- Docker（运行 PostgreSQL + pgvector）
- 一个 OpenAI 兼容的 LLM API Key（如 DeepSeek）
- 一个 Embedding API Key（如硅基流动，免费）

## 快速开始

### 1. 配置

```bash
cp config.example.yaml config.yaml
```

编辑 `config.yaml`，填入：
- `default_llm.api_key` — LLM API Key（如 DeepSeek）
- `embedding.api_key` — Embedding API Key（如硅基流动）

### 2. 启动数据库

```bash
docker compose up -d
```

### 3. 安装依赖

```bash
# 后端
cd backend && uv sync && cd ..

# 前端
cd frontend && pnpm install && cd ..
```

### 4. 初始化数据

```bash
# 数据库迁移
cd backend && uv run alembic upgrade head && cd ..

# 导入动作库（50 个核心动作）
uv run --project backend python scripts/seed_exercises.py

# 向量化方法论文档（需要 Embedding API Key）
uv run --project backend python scripts/ingest_documents.py
```

或者一键执行：

```bash
./scripts/bootstrap.sh
```

### 5. 启动服务

```bash
# 后端（终端 1）
cd backend && uv run uvicorn app.main:app --reload --port 8000

# 前端（终端 2）
cd frontend && pnpm dev
```

打开 http://localhost:3000

## 使用流程

1. 首次访问自动创建匿名账户
2. 完成 Onboarding 画像设置（身体数据、训练目标、器械等）
3. 确认免责声明
4. 在对话页输入训练需求（如"帮我制定一个增肌训练计划"）或知识问题（如"每个肌群每周该练多少组"）
5. 可在设置页配置自己的 LLM API Key 解除每日调用限制

## 项目结构

```
gymopus/
├── config.example.yaml          # 配置模板
├── docker-compose.yml           # PostgreSQL + pgvector
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # YAML 配置加载
│   │   ├── database.py          # SQLAlchemy async session
│   │   ├── models/              # ORM（User, Exercise, Food, WorkoutLog, MealLog, DailyStatus, RateLimitCounter）
│   │   ├── schemas/             # Pydantic 请求/响应模型
│   │   ├── api/                 # 路由（users, knowledge, chat, workouts, meals, status）
│   │   ├── graph/               # LangGraph 工作流
│   │   │   ├── state.py         # GymOpusState 定义
│   │   │   ├── workflow.py      # StateGraph 编排 + Postgres Checkpointer
│   │   │   └── nodes/           # 图节点（intent, workout, meal, diet, qa, validator, fallback）
│   │   ├── agents/              # PydanticAI Agent（intent, workout, meal, diet, qa, report）
│   │   ├── rag/                 # LangChain RAG（embeddings, splitter, vectorstore, retriever）
│   │   ├── tools/               # Agent 工具（exercise_search, food_lookup, methodology_search, nutrition_calc 等）
│   │   └── utils/               # 趋势计算（移动平均、周/月汇总）
│   ├── alembic/                 # 数据库迁移
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/                 # Next.js 页面（chat, onboarding, nutrition, dashboard, settings, privacy）
│       ├── components/          # UI 组件（chat, workout, nutrition, status, legal, layout）
│       ├── hooks/               # useUser, useStreamChat, useWorkouts, useMeals, useStatus 等
│       ├── lib/api.ts           # API 客户端（自动附加认证 headers）
│       └── types/               # TypeScript 类型
├── knowledge-base/
│   ├── exercises/               # 动作库 JSON
│   ├── foods/                   # 食物成分表 CSV
│   ├── methodology/             # 训练方法论 Markdown（4 篇）
│   └── nutrition-guidelines/    # 营养学指南 Markdown（2 篇）
└── scripts/                     # seed、ingest、bootstrap
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/users/me | 获取当前用户 |
| PUT | /api/users/me/profile | 更新画像 |
| DELETE | /api/users/me | 删除所有数据 |
| POST | /api/chat | 对话（触发 LangGraph 工作流） |
| POST | /api/chat/stream | 对话流式输出（SSE） |
| GET | /api/chat/history | 获取对话历史 |
| POST | /api/workouts/logs | 批量创建训练日志 |
| GET | /api/workouts/logs | 查询训练日志 |
| GET | /api/workouts/logs/exercise/:id/history | 单动作训练历史 |
| POST | /api/meals/logs | 创建饮食记录 |
| GET | /api/meals/logs | 查询饮食记录 |
| POST | /api/meals/analyze | 饮食分析 |
| POST | /api/status/daily | 记录每日状态 |
| GET | /api/status/daily | 查询状态记录 |
| GET | /api/status/report | 状态趋势报告 |
| GET | /api/status/weekly-report | AI 周报 |
| GET | /api/knowledge/exercises | 查询动作库（支持筛选） |
| GET | /api/knowledge/exercises/:id | 单个动作详情 |
| GET | /api/knowledge/foods | 查询食物库 |
| GET | /api/knowledge/foods/:id | 单个食物详情 |

所有请求通过 `X-Anonymous-Id` header 进行匿名认证。自带 LLM Key 的用户通过 `X-LLM-*` headers 传递配置。

## 设计决策

**训练计划生成走对话流程**：Spec 中的 `POST /api/workouts/generate` 等独立端点未实现为 REST API。训练计划通过 LangGraph 对话工作流（`POST /api/chat`）生成，因为计划生成依赖意图识别、知识库检索和多轮校验，这些都是图节点。独立端点会重复这些逻辑且失去对话上下文。

## 开发

```bash
# 生成新的数据库迁移
cd backend && uv run alembic revision --autogenerate -m "描述"

# 应用迁移
uv run alembic upgrade head

# 运行测试
uv run pytest

# 前端构建检查
cd frontend && pnpm build
```

## 当前状态

**Phase 1-4 已全部实现：**

- **Phase 1 — 训练编排 MVP**：匿名用户系统、Onboarding 引导流程、动作知识库、训练方法论 RAG、意图识别工作流、对话界面 + 训练计划卡片、Rate limiting、免责声明
- **Phase 2 — 饮食管理**：食物成分表、食谱生成 Agent、饮食诊断 Agent、营养素图表、饮食记录
- **Phase 3 — 状态追踪**：每日状态记录（体重/睡眠/疲劳/情绪）、趋势图表、疲劳度影响训练编排、训练日/休息日热量调整、AI 周报
- **Phase 4 — 打磨完善**：营养学知识库 RAG、训练日志 + 渐进超负荷建议、SSE 流式输出、对话持久化（Postgres Checkpointer）

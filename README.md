# GymOpus

知识约束型健身工作流智能体。通过对话交互，为有健身基础的用户提供基于知识库的训练计划编排和健身知识问答。

## 架构

```
用户 → Next.js 前端 → FastAPI 后端 → LangGraph 工作流
                                         │
                            ┌─────────────┼─────────────┐
                            ▼             ▼             ▼
                      PydanticAI     PydanticAI    PydanticAI
                      Intent Agent   Workout Agent  QA Agent
                            │             │             │
                            │        ┌────┴────┐        │
                            │        ▼         ▼        ▼
                            │   Exercise DB  LangChain RAG
                            │        │         │        │
                            └────────┴─────────┴────────┘
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
│   │   ├── models/              # ORM（User, Exercise, RateLimitCounter）
│   │   ├── schemas/             # Pydantic 请求/响应模型
│   │   ├── api/                 # 路由（users, knowledge, chat）
│   │   ├── graph/               # LangGraph 工作流
│   │   │   ├── state.py         # GymOpusState 定义
│   │   │   ├── workflow.py      # StateGraph 编排
│   │   │   └── nodes/           # 图节点（intent, workout, qa, validator, fallback）
│   │   ├── agents/              # PydanticAI Agent（intent, workout, qa）
│   │   ├── rag/                 # LangChain RAG（embeddings, splitter, vectorstore, retriever）
│   │   └── tools/               # Agent 工具（exercise_search, methodology_search）
│   ├── alembic/                 # 数据库迁移
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/                 # Next.js 页面（chat, onboarding, settings, privacy）
│       ├── components/          # UI 组件（chat, legal, layout）
│       ├── hooks/               # useUser, useAnonymousId
│       ├── lib/api.ts           # API 客户端（自动附加认证 headers）
│       └── types/               # TypeScript 类型
├── knowledge-base/
│   ├── exercises/               # 动作库 JSON（50 个动作）
│   └── methodology/             # 训练方法论 Markdown（4 篇）
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
| GET | /api/knowledge/exercises | 查询动作库（支持筛选） |
| GET | /api/knowledge/exercises/:id | 单个动作详情 |

所有请求通过 `X-Anonymous-Id` header 进行匿名认证。自带 LLM Key 的用户通过 `X-LLM-*` headers 传递配置。

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

**Phase 1（训练编排 MVP）已完成：**
- 匿名用户系统 + Onboarding
- 50 个动作知识库（来源：ExRx.net、free-exercise-db 等）
- 4 篇训练方法论 RAG 文档（来源：PubMed、RP Strength、NSCA 等）
- 意图识别 → 训练编排 / 知识问答 工作流
- 对话界面 + 训练计划卡片
- Rate limiting + 免责声明 + 隐私政策

**后续 Phase：**
- Phase 2：饮食管理（食物成分表、食谱生成、饮食诊断）
- Phase 3：状态追踪 + 跨模块联动（体重趋势、疲劳度影响训练编排）
- Phase 4：知识库扩充 + 训练记录 + 流式输出

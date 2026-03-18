# CLAUDE.md

## 项目简介

GymOpus — 知识约束型健身工作流智能体。用户通过对话获取基于知识库的训练计划和健身知识问答。不允许 LLM 自由编造内容。

## 技术栈

- **后端**：Python 3.12 / FastAPI / SQLAlchemy async / Pydantic v2
- **前端**：Next.js 14 (App Router) / TypeScript / TailwindCSS / shadcn/ui / TanStack Query
- **数据库**：PostgreSQL 16 + pgvector
- **包管理**：后端 uv，前端 pnpm

## 三个必须使用的 AI 框架

| 框架 | 职责 | 文档 |
|------|------|------|
| LangGraph | 工作流编排、状态管理、条件路由 | https://langchain-ai.github.io/langgraph/llms.txt |
| PydanticAI | LLM 调用、结构化输出、工具注册 | https://ai.pydantic.dev/llms.txt |
| LangChain | RAG 管线（分块、Embedding、PGVector 检索） | https://python.langchain.com/llms.txt |

**不确定 API 用法时，先 fetch 上方 llms.txt 链接阅读文档，不要凭记忆猜测。**

唯一允许纯 Python 的场景：数值计算、SQLAlchemy 查询、业务校验。

## 关键 API 注意事项

- **PydanticAI**：用 `output_type`（不是 `result_type`），结果在 `.output` 属性。模型构造：`OpenAIChatModel(name, provider=OpenAIProvider(base_url=..., api_key=...))`。可通过 `agent.run(prompt, model=...)` 在运行时传入模型。
- **LangGraph**：Graph 节点是普通 async 函数，不能用 FastAPI Depends。DB session 需通过 session factory 手动创建。
- **数据库有两种连接串**：`postgresql+asyncpg://`（SQLAlchemy）和 `postgresql+psycopg://`（LangChain PGVector）。`config.py` 的 `DatabaseConfig.url_psycopg` 属性自动转换。

## 常用命令

```bash
# 启动数据库
docker compose up -d

# 后端
cd backend && uv run uvicorn app.main:app --reload --port 8000

# 前端
cd frontend && pnpm dev

# 数据库迁移
cd backend && uv run alembic revision --autogenerate -m "描述"
cd backend && uv run alembic upgrade head

# 种子数据
uv run --project backend python scripts/seed_exercises.py
uv run --project backend python scripts/ingest_documents.py

# 测试
cd backend && uv run pytest
```

## 项目结构重点文件

```
config.yaml                          # 敏感配置（gitignored），从 config.example.yaml 复制
backend/app/config.py                # 配置加载，暴露双 DB URL
backend/app/api/deps.py              # 认证（X-Anonymous-Id）+ LLM 配置解析（X-LLM-* headers）
backend/app/graph/workflow.py        # LangGraph StateGraph 定义（核心）
backend/app/graph/state.py           # GymOpusState TypedDict
backend/app/agents/workout_agent.py  # 训练编排 Agent（output_type=WorkoutPlan）
backend/app/rag/vectorstore.py       # PGVector 向量存储（用 psycopg 连接串）
frontend/src/lib/api.ts              # API 客户端（自动附加所有认证 headers）
```

## 编码规范

- Python：async/await 所有 IO，完整类型注解，API 统一返回 `{"success": bool, "data": ..., "error": ...}`
- TypeScript：严格模式，不用 `any`
- 用户可见文本中文，代码/变量名英文
- Conventional commits
- 敏感信息只从 `config.yaml` 读取，不硬编码

## 设计约束

1. **知识库优先**：不允许 LLM 在没有知识库上下文的情况下生成训练计划。Agent 必须先调用工具检索数据。
2. **计算与生成分离**：数值（热量、营养素）用纯 Python 算，自然语言用 PydanticAI 生。
3. **匿名用户**：无注册/登录，通过 UUID header 识别。不收集实名信息。
4. **双 LLM 模式**：用户自带 Key（不限速）或使用默认模型（受 rate limiting 限制）。
5. **LLM 输出校验**：PydanticAI `output_type` 做结构校验 + LangGraph validator 节点做业务校验（exercise_id 存在性等）。

## 当前进度

Phase 1（训练编排 MVP）已完成。详见 project_spec.md 中的 Phase 2-4 规划。

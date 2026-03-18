# project_spec.md — GymOpus 项目规范

## 项目概述

GymOpus 是一个面向有健身基础用户的"知识约束型健康后勤工作流"智能体。提供训练编排、饮食管理、状态追踪和知识问答四大功能。

 **核心定位** ：这不是一个开放式聊天 Agent，而是一个强约束的业务工作流系统——预定义流程为主，只在少数节点内做 Agent 式推理。所有建议必须基于结构化知识库，不允许 LLM 自由编造。

 **目标用户** ：有 6 个月以上健身经验，能独立训练，但缺乏系统编排计划的知识或精力。

 **不做的事** ：不做动作教学/姿势纠正、不做社交功能、不做硬件对接、不做医疗建议。

---

## ⛔ 框架强制使用规则（最高优先级）

本项目必须使用以下三个框架，不允许手写替代实现。写代码前先查阅对应框架的官方文档。

| 职责                                 | 必须使用                       | 文档                                              |
| ------------------------------------ | ------------------------------ | ------------------------------------------------- |
| LLM 调用、结构化输出、工具注册       | **PydanticAI Agent**     | https://ai.pydantic.dev/llms.txt                  |
| 工作流编排、状态管理、条件路由       | **LangGraph StateGraph** | https://langchain-ai.github.io/langgraph/llms.txt |
| RAG（文档分块、Embedding、向量检索） | **LangChain 组件**       | https://python.langchain.com/llms.txt             |

**不确定怎么用？用 `fetch` 或 `curl` 拉取上方 llms.txt 链接，找到相关文档页面阅读后再写代码。不要凭记忆猜测 API 用法。**

唯一允许纯 Python 的场景：数值计算（热量、营养素）、SQLAlchemy 结构化查询、业务校验逻辑。

 **Embedding 说明** ：Embedding 通过 API 调用（LangChain 的 `OpenAIEmbeddings`，兼容所有 OpenAI 兼容接口的 `/v1/embeddings` 端点），不在本地运行模型。

---

## 技术栈

### AI 框架（核心三件套，缺一不可）

| 框架                            | 职责                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| **LangGraph**≥0.2        | 工作流编排、状态管理、checkpoint、条件路由、对话持久化                                     |
| **PydanticAI**≥0.2       | 节点内 LLM 调用、结构化输出、自动校验重试、工具注册、依赖注入                              |
| **LangChain 组件层**≥0.3 | RAG 管线：Document Loader、Text Splitter、OpenAIEmbeddings（兼容接口）、PGVector Retriever |

### 可观测性

| 工具                | 职责                                 |
| ------------------- | ------------------------------------ |
| **LangSmith** | LangGraph 工作流 trace、可视化、评估 |

### 基础设施

* **后端** ：Python 3.12+ / FastAPI / SQLAlchemy (async) / Pydantic v2
* **前端** ：Next.js 14+ (App Router) / TypeScript / TailwindCSS / shadcn/ui
* **数据库** ：PostgreSQL 16 + pgvector 扩展
* **LLM** ：任意 OpenAI 兼容接口（通过 PydanticAI model 参数配置）
* **Embedding** ：任意 OpenAI 兼容接口的 `/v1/embeddings` 端点（通过 LangChain OpenAIEmbeddings）
* **部署** ：Docker Compose
* **包管理** ：后端 uv，前端 pnpm

### 后端核心依赖

```toml
[project]
dependencies = [
    # AI 三件套
    "langgraph>=0.2",
    "pydantic-ai>=0.2",
    "langchain>=0.3",
    "langchain-community>=0.3",
    "langchain-openai>=0.3",
    "langchain-postgres>=0.0.12",
    # 可观测性
    "langsmith>=0.2",
    # Web
    "fastapi>=0.115",
    "uvicorn[standard]>=0.32",
    # 数据库
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.30",
    "alembic>=1.14",
    # 工具
    "pydantic>=2.10",
    "pyyaml>=6.0",
    "structlog>=24.0",
]
```

---

## 用户系统

### 匿名账户（无注册/登录）

* 用户首次访问时，前端在 localStorage 生成一个 UUID v4 作为 `anonymous_id`
* 所有 API 请求通过 `X-Anonymous-Id` header 传递此 ID
* 后端收到请求时：如果该 ID 不存在于数据库，自动创建用户记录；如果存在，直接关联
* **不收集**邮箱、手机号、姓名等任何实名信息
* **不需要** JWT、密码哈希、登录/注册端点

### 认证中间件

```python
# FastAPI Depends
async def get_current_user(
    x_anonymous_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await get_or_create_user(db, x_anonymous_id)
    return user
```

### LLM 配置传递

用户自定义的 LLM 配置存在浏览器 localStorage，通过请求 header 传递，后端不持久化：

* `X-LLM-Base-URL`：API 地址（如 `https://api.deepseek.com/v1`）
* `X-LLM-API-Key`：用户自己的 API Key
* `X-LLM-Model`：模型名称（如 `deepseek-chat`）

如果这三个 header 都存在，后端用它们创建 PydanticAI 的 OpenAI 兼容模型；如果缺失，回退到环境变量中的 `DEFAULT_LLM_*` 配置，并触发 rate limiting。

### 用户数据模型

```
User:
  - id: UUID (主键，即 anonymous_id)
  - gender: str | None
  - age: int | None
  - height_cm: float | None
  - weight_kg: float | None
  - body_fat_pct: float | None
  - training_goal: str | None          # 增肌/减脂/力量/体态改善/维持
  - training_experience_years: float | None
  - training_frequency_per_week: int | None
  - session_duration_minutes: int | None
  - available_equipment: list[str]      # 器械列表
  - dietary_restrictions: list[str]     # 饮食限制
  - dietary_preferences: list[str]      # 饮食偏好
  - injuries: list[str]                # 伤病/限制
  - onboarding_completed: bool          # 是否完成画像设置
  - created_at: datetime
  - updated_at: datetime
```

---

## 安全与合规

### Rate Limiting

* **自带 Key 用户** ：不限速（消耗的是用户自己的额度）
* **默认模式用户** ：按 anonymous_id 做每日调用次数限制，限制值通过环境变量 `DAILY_LLM_LIMIT` 配置
* 超限返回 HTTP 429 + 友好提示（"今日使用次数已达上限，配置自己的 API Key 可解除限制"）
* 计数器存在 PostgreSQL
* 每日 UTC 0:00 重置

### LLM 调用数据脱敏

* 发送给 LLM 的 prompt 中只包含必要的脱敏信息
* ✅ 允许发送：性别、年龄段（如"25岁"）、体重、身高、训练目标、训练频率、可用器械
* ❌ 禁止发送：anonymous_id、任何设备指纹、IP 地址、完整的历史对话记录（只发近 N 轮）
* 对话历史传给 LLM 时最多保留最近 10 轮

### 免责声明（Claude Code 生成草稿，开发者审定）

* 首次完成 Onboarding 后弹窗展示，用户必须点击"我已了解"才能继续
* 每次生成训练计划或饮食方案时，在结果顶部显示简短提示
* 内容要点：
  * 本工具不提供医疗建议，如有健康问题请咨询医生
  * 训练和饮食建议仅供参考，用户应根据自身情况判断
  * 如有伤病史请在画像中标注，但本工具不能替代物理治疗师的指导
  * AI 生成内容可能存在错误

### 隐私政策（Claude Code 生成草稿，开发者审定）

* 在设置页面或底部导航可访问
* 内容要点：
  * 收集的数据：健身画像（身高体重等）、训练记录、饮食记录、对话内容
  * 不收集的数据：姓名、邮箱、手机号、位置信息
  * 数据存储：所有数据存储在服务器数据库中
  * 第三方服务：对话内容会发送至用户选择的第三方 LLM API 处理（如 DeepSeek、通义千问等），受对应服务商隐私政策约束
  * 用户权利：可随时删除全部个人数据
  * 数据保留：账户删除后数据立即清除

### AI 生成内容标识

* 所有 AI 生成的训练计划、饮食方案、分析报告，在展示时标注"AI 生成"标签

### 数据删除

* 提供 `DELETE /api/users/me` 端点
* 级联删除该用户的所有数据（画像、训练记录、饮食记录、状态记录、对话历史）
* 前端在设置页提供"删除我的所有数据"按钮，需二次确认

### Prompt 注入防护

* PydanticAI 的 `result_type` 结构化输出自动拦截非预期格式
* LangGraph 校验节点做业务层面兜底（exercise_id 存在性、数值范围）
* system_prompt 中包含明确约束声明

---

## 项目结构

```
gymopus/
├── CLAUDE.md                            # 本文件
├── docker-compose.yml
├── config.example.yaml                  # 配置文件模板（提交到仓库）
├── config.yaml                          # 实际配置（.gitignore，不提交）
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── alembic/
│   │   ├── alembic.ini
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── main.py                      # FastAPI 入口 + CORS + rate limit 中间件
│   │   ├── config.py                    # 环境变量配置
│   │   ├── database.py                  # async session
│   │   ├── models/                      # SQLAlchemy ORM
│   │   │   ├── user.py
│   │   │   ├── exercise.py
│   │   │   ├── food.py
│   │   │   ├── workout.py
│   │   │   ├── meal.py
│   │   │   ├── daily_status.py
│   │   │   └── rate_limit.py            # 调用次数计数
│   │   ├── schemas/                     # Pydantic API 请求/响应
│   │   │   ├── user.py
│   │   │   ├── workout.py
│   │   │   ├── meal.py
│   │   │   └── chat.py
│   │   ├── api/                         # FastAPI 路由
│   │   │   ├── router.py
│   │   │   ├── deps.py                  # 依赖注入（get_current_user 等）
│   │   │   ├── users.py
│   │   │   ├── workouts.py
│   │   │   ├── meals.py
│   │   │   ├── status.py
│   │   │   └── chat.py                  # 对话主入口 → graph.ainvoke()
│   │   ├── graph/                       # ⭐ LangGraph 工作流
│   │   │   ├── state.py                 # GymOpusState TypedDict
│   │   │   ├── workflow.py              # StateGraph 定义和编译
│   │   │   └── nodes/                   # 图节点
│   │   │       ├── intent_router.py
│   │   │       ├── workout_planner.py
│   │   │       ├── meal_planner.py
│   │   │       ├── diet_analyzer.py
│   │   │       ├── knowledge_qa.py
│   │   │       ├── validator.py
│   │   │       └── fallback.py
│   │   ├── agents/                      # ⭐ PydanticAI Agent 定义
│   │   │   ├── workout_agent.py
│   │   │   ├── meal_agent.py
│   │   │   ├── diet_agent.py
│   │   │   ├── qa_agent.py
│   │   │   └── intent_agent.py
│   │   ├── rag/                         # ⭐ LangChain RAG 组件
│   │   │   ├── loader.py
│   │   │   ├── splitter.py
│   │   │   ├── embeddings.py
│   │   │   ├── vectorstore.py
│   │   │   └── retriever.py
│   │   ├── tools/                       # PydanticAI @agent.tool 的具体实现
│   │   │   ├── exercise_search.py       # SQLAlchemy 查动作库
│   │   │   ├── food_lookup.py           # SQLAlchemy 查食物成分表
│   │   │   ├── nutrition_calc.py        # 纯 Python 营养素计算
│   │   │   └── methodology_search.py    # 调用 LangChain retriever
│   │   └── utils/
│   │       ├── nutrition.py             # 纯 Python 计算函数
│   │       └── exercise.py              # 纯 Python 筛选函数
│   └── tests/
│       ├── conftest.py
│       ├── test_graph.py
│       ├── test_agents.py
│       ├── test_rag.py
│       └── test_tools.py
├── frontend/
│   ├── package.json
│   ├── Dockerfile
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                 # 对话页（主页面）
│   │   │   ├── onboarding/             # 画像设置引导
│   │   │   ├── workout/                # 训练计划页
│   │   │   ├── nutrition/              # 饮食日志页
│   │   │   ├── dashboard/              # 状态仪表盘
│   │   │   ├── settings/               # 设置（含数据删除、隐私政策链接）
│   │   │   ├── privacy/                # 隐私政策页
│   │   │   └── disclaimer/             # 免责声明页
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   ├── workout/
│   │   │   ├── nutrition/
│   │   │   ├── dashboard/
│   │   │   ├── legal/                  # 免责弹窗、AI 生成标识
│   │   │   └── ui/                     # shadcn/ui
│   │   ├── hooks/
│   │   │   └── useAnonymousId.ts       # 生成和管理 anonymous UUID
│   │   ├── lib/
│   │   │   ├── api.ts                  # 后端 API 客户端（自动附加 X-Anonymous-Id header）
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
│   └── public/
├── knowledge-base/
│   ├── exercises/
│   │   └── exercises.json
│   ├── foods/
│   │   └── chinese_food_composition.csv
│   ├── methodology/
│   │   ├── periodization.md
│   │   ├── volume_landmarks.md
│   │   ├── muscle_recovery.md
│   │   └── progressive_overload.md
│   └── nutrition-guidelines/
│       ├── dietary_guidelines_china.md
│       └── issn_position_stands.md
└── scripts/
    ├── seed_exercises.py
    ├── seed_foods.py
    └── ingest_documents.py              # LangChain Loader+Splitter+PGVector 导入文档
```

---

## 三个框架的职责边界

* **LangGraph** ："做什么、按什么顺序做"。用 StateGraph 定义节点和边，用 conditional_edges 做意图路由，用 checkpointer 做状态持久化。每个节点是一个 Python 函数，接收 state 返回 state 更新。
* **PydanticAI** ："在每个节点内，如何跟 LLM 交互"。每个业务功能对应一个 Agent，用 `result_type` 定义结构化输出，用 `@agent.tool` 注册工具，用 `deps_type` 做依赖注入。LangGraph 节点内调用 `agent.run()` 获取结果。
* **LangChain 组件** ："知识库怎么存、怎么查"。用 TextSplitter 分块、OpenAIEmbeddings（兼容接口）生成向量、PGVector 存储和检索。这些组件被 PydanticAI 的 tool 函数调用，不直接参与业务逻辑。

具体 API 用法查阅上方 llms.txt 链接。

---

## LangGraph 状态定义

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class GymOpusState(TypedDict):
    messages: Annotated[list, add_messages]
    user_id: str
    user_profile: dict
    intent: str                          # workout / meal / diet_analysis / qa / chitchat
    workout_plan: dict | None
    meal_plan: dict | None
    diet_analysis: dict | None
    qa_answer: str | None
    validation_result: dict | None
    retry_count: int
    response: str
```

---

## 核心设计约束

### 1. 知识库优先原则

**绝对不允许 LLM 在没有知识库上下文的情况下生成训练计划或饮食方案。**

PydanticAI Agent 通过 `@agent.tool` 从知识库检索数据，Agent 在生成结构化输出时必须引用 tool 返回的数据。LangGraph 校验节点负责检查输出中的所有 ID 和数值是否来源于知识库。

### 2. 计算与生成分离

* **纯 Python** ：热量、营养素汇总、TDEE 估算
* **PydanticAI Agent** ：自然语言描述、方案搭配、建议措辞
* 凡涉及数值的输出，必须由 Python 函数计算后注入 Agent 的 tool 返回值

### 3. LLM 输出校验

* PydanticAI 层：`result_type` 自动结构化校验 + `retries=3` 自动重试
* LangGraph 层：validator 节点做业务校验（exercise_id 存在性等），失败走 fallback

### 4. 模型配置（双模式）

项目支持两种使用模式，通过用户是否配置了自己的 API Key 来区分：

 **自带 Key 模式** ：用户在前端设置页填入自己的 API Key 和模型配置，不限速，可用任何 OpenAI 兼容接口的模型。Key 存在浏览器 localStorage，通过 header 传给后端，后端不持久化用户的 Key。

 **默认模式** ：用户不配置 Key，使用项目部署者提供的默认模型（便宜的小模型），受 rate limiting 限制。

后端通过 PydanticAI 的 OpenAI 兼容模式统一处理，所有 OpenAI 兼容接口（DeepSeek、通义千问、硅基流动、Ollama 等）都只需 base_url + api_key + model_name 三个参数。

前端设置页需要三个输入框：API Base URL、API Key、模型名称。提供常见供应商的预设按钮（一键填入 base_url）。

---

## API 端点

```
# 用户（匿名）
GET    /api/users/me                     # 获取当前用户画像（通过 X-Anonymous-Id）
PUT    /api/users/me/profile             # 更新画像
DELETE /api/users/me                     # 删除所有数据

# 对话
POST   /api/chat                         # 主入口 → graph.ainvoke()
GET    /api/chat/history                 # 对话历史

# 训练
POST   /api/workouts/generate
GET    /api/workouts/plans
GET    /api/workouts/plans/:id
POST   /api/workouts/logs
GET    /api/workouts/logs

# 饮食
POST   /api/meals/generate
POST   /api/meals/logs
GET    /api/meals/logs
POST   /api/meals/analyze

# 状态
POST   /api/status/daily
GET    /api/status/daily
GET    /api/status/report

# 知识库（只读）
GET    /api/knowledge/exercises
GET    /api/knowledge/exercises/:id
GET    /api/knowledge/foods
GET    /api/knowledge/foods/:id

# 系统
GET    /api/health
```

---

## 数据库约定

* Alembic 管理迁移，不手动 DDL
* 所有表包含 `id` (UUID), `created_at`, `updated_at`
* pgvector 列由 LangChain PGVector 管理
* LangGraph checkpoint 表由 checkpointer 自动创建
* 外键 `ON DELETE CASCADE`
* rate_limit 表：`user_id`, `date`, `call_count`

---

## 编码规范

### Python

* async/await 所有 IO
* 类型注解覆盖所有函数
* PydanticAI 的 `result_type` 和 `deps_type` 使用 Pydantic BaseModel
* API 统一返回 `{"success": bool, "data": ..., "error": ...}`
* structlog JSON 格式日志
* pytest + pytest-asyncio 测试

### TypeScript

* 严格模式，不用 any
* TanStack Query 管理服务端状态
* react-hook-form + zod 表单校验
* `lib/api.ts` 统一封装，自动附加 `X-Anonymous-Id` header

### 通用

* 用户可见文本中文，代码注释和变量名英文
* conventional commits
* 敏感信息只从 `config.yaml` 读取，不硬编码

---

## 配置文件

使用 YAML 配置文件 `config.yaml`（项目根目录），不使用环境变量管理 API Key。提供 `config.example.yaml` 作为模板。

```yaml
# config.yaml

database:
  url: postgresql+asyncpg://gymopus:gymopus@localhost:5432/gymopus

# 默认 LLM（供未配置自己 Key 的用户使用）
default_llm:
  base_url: https://api.deepseek.com/v1
  api_key: sk-xxx
  model: deepseek-chat

# Embedding API（用于 RAG 向量化）
embedding:
  base_url: https://api.siliconflow.cn/v1    # 硅基流动免费提供 bge embedding
  api_key: sk-xxx
  model: BAAI/bge-large-zh-v1.5

# LangSmith（可选，留空则关闭）
langsmith:
  api_key: ""
  project: gymopus

# 应用
app:
  secret_key: change-me
  daily_llm_limit: 20                        # 默认模式每用户每天调用上限
```

**`config.yaml` 必须加入 `.gitignore`，不得提交到仓库。只提交 `config.example.yaml`。**

后端通过 `app/config.py` 用 Pydantic Settings 或直接 `yaml.safe_load()` 读取配置文件。

---

## 开发步骤

**按 Phase 顺序执行。每个 Phase 内按 Step 顺序，每步完成后暂停确认。Phase 之间开发者会验收后再继续。**

---

### Phase 1：训练编排 MVP（目标：最小可用版本上线）

#### Step 1.1：项目骨架

1. `docker-compose.yml`：只包含 db 服务（pgvector/pgvector:pg16），前后端本地裸跑
2. 后端：`pyproject.toml` 按上方依赖列表，`app/main.py` + `config.py`（读取 config.yaml）+ `database.py`
3. 前端：Next.js App Router + TailwindCSS + shadcn/ui + TanStack Query
4. `config.example.yaml` + `.gitignore`（包含 `config.yaml`）
5. 验证：数据库容器启动，后端能连上，前端能访问 `/api/health`

#### Step 1.2：用户系统（匿名）+ 安全基础

1. `models/user.py`：User 表（匿名 UUID，画像字段）
2. Alembic 初始化 + 首次迁移
3. `api/deps.py`：`get_current_user`（X-Anonymous-Id header）+ LLM 配置解析（X-LLM-* headers，回退到 config.yaml 默认值）
4. API：`GET /api/users/me`、`PUT /api/users/me/profile`、`DELETE /api/users/me`（级联删除）
5. `models/rate_limit.py` + rate limiting 中间件（仅限默认模式用户）
6. 前端：`useAnonymousId` hook + Onboarding 多步表单

#### Step 1.3：动作知识库

1. `models/exercise.py`：Exercise 表
2. 种子数据：50 个核心动作（JSON），覆盖胸/背/腿/肩/手臂/核心
3. `scripts/seed_exercises.py`
4. API：`GET /api/knowledge/exercises`（按肌群/器械/动作模式筛选）

#### Step 1.4：训练方法论 RAG（必须用 LangChain 组件）

1. 4 个方法论 Markdown 文档（800-1500 字/篇）：volume_landmarks、periodization、muscle_recovery、progressive_overload
2. `rag/embeddings.py`：OpenAIEmbeddings（读取 config.yaml embedding 配置）
3. `rag/splitter.py`、`rag/vectorstore.py`（PGVector）、`rag/retriever.py`
4. `scripts/ingest_documents.py`

#### Step 1.5：PydanticAI Agent（必须用 PydanticAI）

1. `agents/intent_agent.py`：意图识别
2. `agents/workout_agent.py`：训练编排（result_type=WorkoutPlan, tools=[search_exercises, search_methodology]）
3. `agents/qa_agent.py`：知识问答
4. `tools/` 目录：exercise_search、methodology_search

#### Step 1.6：LangGraph 工作流（必须用 LangGraph）

1. `graph/state.py`：GymOpusState
2. `graph/nodes/`：intent_router、workout_planner、knowledge_qa、validator、fallback
3. `graph/workflow.py`：StateGraph 定义、条件边、checkpointer、编译
4. `api/chat.py`：`POST /api/chat` → `graph.ainvoke()`

#### Step 1.7：前端对话界面

1. 对话页（主页面）：消息气泡 + 训练计划卡片渲染 + 输入框
2. 训练计划详情页
3. 免责声明弹窗（Onboarding 完成后首次触发）
4. 隐私政策页面（草稿，开发者审定）
5. 设置页（含"删除我的数据"按钮 + LLM 配置输入框）
6. AI 生成内容标注"AI 生成"标签

#### Step 1.8：整合测试

1. 从零启动：建表 → 导入种子数据 → 向量化方法论文档
2. 关键路径测试（graph 工作流、agent 输出、RAG 检索）
3. README.md
4. 端到端验证：首次访问 → Onboarding → 免责确认 → "帮我生成一个增肌训练计划" → 计划展示

**⏸️ Phase 1 完成后暂停，开发者验收。**

---

### Phase 2：饮食管理

#### Step 2.1：食物成分表知识库

1. `models/food.py`：Food 表（名称、分类、每100g 热量/蛋白质/脂肪/碳水/膳食纤维/各微量营养素、常见份量描述）
2. 获取并结构化中国食物成分表数据（CSV）
3. `scripts/seed_foods.py`
4. API：`GET /api/knowledge/foods`（按名称/分类搜索）、`GET /api/knowledge/foods/:id`

#### Step 2.2：食谱生成

1. `agents/meal_agent.py`：食谱生成 Agent（result_type=MealPlan，tools=[search_foods, calc_nutrition]）
2. `tools/food_lookup.py`：从食物成分表查询
3. `tools/nutrition_calc.py`：纯 Python 热量/宏量计算（TDEE 估算、目标热量、宏量比例分配）
4. `graph/nodes/meal_planner.py`：食谱生成节点
5. 更新 `graph/workflow.py`：intent="meal" 路由到 meal_planner 节点
6. API：`POST /api/meals/generate`

#### Step 2.3：饮食记录与诊断

1. `models/meal.py`：MealLog 表（用户原始描述、解析后食物列表、营养素汇总）
2. `agents/diet_agent.py`：饮食诊断 Agent（result_type=DietAnalysis，tools=[search_foods, calc_nutrition]）
   * 接收用户的文字描述（如"中午吃了黄焖鸡米饭"），映射到食物成分表，计算营养素，与目标对比
3. `graph/nodes/diet_analyzer.py`：饮食诊断节点
4. 更新 `graph/workflow.py`：intent="diet_analysis" 路由到 diet_analyzer 节点
5. API：`POST /api/meals/logs`、`GET /api/meals/logs`、`POST /api/meals/analyze`

#### Step 2.4：饮食前端

1. 饮食日志页：每日饮食记录列表 + 营养素汇总图表（热量、蛋白质、碳水、脂肪柱状图）
2. 食谱展示卡片（嵌在对话流中）
3. 饮食记录输入：支持自然语言输入（"中午吃了一碗牛肉面"）
4. 营养诊断结果展示：与目标的偏差、缺口提示、改善建议

**⏸️ Phase 2 完成后暂停，开发者验收。**

---

### Phase 3：状态追踪 + 跨模块联动

#### Step 3.1：状态记录

1. `models/daily_status.py`：DailyStatus 表（体重、睡眠时长/质量、疲劳度、压力、情绪、备注）
2. API：`POST /api/status/daily`、`GET /api/status/daily`
3. 前端：每日状态快速录入表单（滑块 + 数字输入，低摩擦设计）

#### Step 3.2：趋势分析和可视化

1. `utils/` 中添加趋势计算函数：移动平均、标准差、变化率（纯 Python）
2. API：`GET /api/status/report`（返回周/月汇总数据）
3. 前端状态仪表盘：体重趋势折线图、睡眠/疲劳/情绪趋势图、训练进展图表

#### Step 3.3：跨模块联动

1. 更新训练编排节点：从 state 中读取最近的状态数据，疲劳度高时自动建议降低容量
2. 更新饮食诊断节点：结合训练记录（训练日 vs 休息日）调整热量建议
3. 周报生成：综合训练、饮食、状态数据，生成周度总结（通过一个新的 PydanticAI Agent）

**⏸️ Phase 3 完成后暂停，开发者验收。**

---

### Phase 4：打磨与完善

#### Step 4.1：知识问答增强

1. 扩充营养学指南知识库（中国居民膳食指南、ISSN 立场声明）
2. 向量化并加入 RAG 管线
3. 更新 qa_agent 的 tools，支持检索营养学文档

#### Step 4.2：训练记录和渐进超负荷

1. `models/workout.py`：WorkoutLog 表（实际完成的组数/次数/重量/RPE）
2. API：`POST /api/workouts/logs`、`GET /api/workouts/logs`
3. 训练编排 Agent 读取历史训练记录，生成渐进超负荷建议（"上次卧推 60kg×8，本次建议 62.5kg×8 或 60kg×9"）
4. 前端：训练中记录界面（勾选完成、填写实际数据）

#### Step 4.3：用户体验优化

1. 对话流式输出（SSE）
2. 动作库扩充到 200+
3. 食物成分表扩充（覆盖常见中式菜品）
4. 错误处理完善（LLM 超时、API 不可用的降级体验）
5. 前端 UI 打磨

**提醒：不确定框架用法时，先查阅上方 llms.txt 链接，不要凭记忆写代码。**

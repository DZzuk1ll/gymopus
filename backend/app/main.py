from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.database import check_db_connection
from app.config import get_config
from app.graph.workflow import compile_graph
from app.api.router import router, include_routers
from app.schemas import ApiResponse

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("database_connected")
    else:
        logger.error("database_connection_failed")

    config = get_config()
    try:
        async with AsyncPostgresSaver.from_conn_string(
            config.database.url_psycopg_raw
        ) as checkpointer:
            await checkpointer.setup()
            app.state.graph = compile_graph(checkpointer)
            logger.info("graph_initialized", checkpointer="postgres")
            yield
    except Exception as e:
        logger.warning("checkpointer_init_failed", error=str(e))
        app.state.graph = compile_graph()
        logger.info("graph_initialized", checkpointer="none")
        yield


app = FastAPI(title="GymOpus", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

include_routers()
app.include_router(router)


@app.get("/api/health")
async def health_check():
    db_ok = await check_db_connection()
    return ApiResponse.ok({"status": "ok", "db": db_ok})

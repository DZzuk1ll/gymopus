from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import check_db_connection
from app.api.router import router, include_routers
from app.schemas import ApiResponse

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("Database connection established")
    else:
        logger.error("Failed to connect to database")
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

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers import checkins, plans, suggestions, trends, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Load knowledge base into retriever
    from database import async_session
    from knowledge.loader import load_knowledge_from_yaml
    from knowledge.retriever import retriever
    async with async_session() as db:
        count = await load_knowledge_from_yaml(db)
        if count > 0:
            print(f"[INFO] Loaded {count} knowledge entries")
        await retriever.load(db)
        print(f"[INFO] Knowledge retriever initialized with {len(retriever.entries)} entries")
    yield


app = FastAPI(title="GymOps API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(plans.router)
app.include_router(checkins.router)
app.include_router(suggestions.router)
app.include_router(trends.router)


@app.get("/health")
async def health():
    return {"status": "ok"}

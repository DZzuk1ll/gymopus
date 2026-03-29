from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import settings

engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session() as session:
        yield session


async def init_db() -> None:
    from models import Base  # noqa: F811

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_run_legacy_migrations)


def _run_legacy_migrations(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "user_ai_configs" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("user_ai_configs")}
    if "max_tokens" not in columns:
        sync_conn.execute(text("ALTER TABLE user_ai_configs ADD COLUMN max_tokens INTEGER"))

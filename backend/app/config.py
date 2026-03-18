from pathlib import Path
from functools import lru_cache

import yaml
from pydantic import BaseModel


class DatabaseConfig(BaseModel):
    url: str  # postgresql+asyncpg://...

    @property
    def url_psycopg(self) -> str:
        """Connection string for LangChain PGVector (requires psycopg3)."""
        return self.url.replace("postgresql+asyncpg://", "postgresql+psycopg://")


class LLMConfig(BaseModel):
    base_url: str
    api_key: str
    model: str


class EmbeddingConfig(BaseModel):
    base_url: str
    api_key: str
    model: str


class LangSmithConfig(BaseModel):
    api_key: str = ""
    project: str = "gymopus"


class AppSectionConfig(BaseModel):
    secret_key: str = "change-me"
    daily_llm_limit: int = 20


class AppConfig(BaseModel):
    database: DatabaseConfig
    default_llm: LLMConfig
    embedding: EmbeddingConfig
    langsmith: LangSmithConfig = LangSmithConfig()
    app: AppSectionConfig = AppSectionConfig()


def _find_config_path() -> Path:
    """Find config.yaml walking up from backend/app/ to project root."""
    root = Path(__file__).resolve().parent.parent.parent  # gymopus/
    config_path = root / "config.yaml"
    if config_path.exists():
        return config_path
    example_path = root / "config.example.yaml"
    if example_path.exists():
        return example_path
    raise FileNotFoundError(
        f"Neither config.yaml nor config.example.yaml found in {root}"
    )


@lru_cache
def get_config() -> AppConfig:
    config_path = _find_config_path()
    with open(config_path) as f:
        raw = yaml.safe_load(f)
    return AppConfig(**raw)

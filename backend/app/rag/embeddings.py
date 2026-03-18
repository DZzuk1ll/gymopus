from functools import lru_cache
from langchain_openai import OpenAIEmbeddings
from app.config import get_config

@lru_cache
def get_embeddings() -> OpenAIEmbeddings:
    config = get_config()
    return OpenAIEmbeddings(
        base_url=config.embedding.base_url,
        api_key=config.embedding.api_key,
        model=config.embedding.model,
    )

from langchain_postgres import PGVector
from app.config import get_config
from app.rag.embeddings import get_embeddings

_vectorstore_cache: dict[str, PGVector] = {}


def get_vectorstore(collection: str = "methodology") -> PGVector:
    """Get a PGVector instance for the given collection.

    Supports multiple collections: 'methodology', 'nutrition_guidelines', etc.
    """
    if collection not in _vectorstore_cache:
        config = get_config()
        _vectorstore_cache[collection] = PGVector(
            embeddings=get_embeddings(),
            collection_name=collection,
            connection=config.database.url_psycopg,
            use_jsonb=True,
        )
    return _vectorstore_cache[collection]

from langchain_core.vectorstores import VectorStoreRetriever
from app.rag.vectorstore import get_vectorstore


def get_retriever(collection: str = "methodology") -> VectorStoreRetriever:
    return get_vectorstore(collection).as_retriever(
        search_type="mmr",
        search_kwargs={"k": 4, "fetch_k": 8},
    )

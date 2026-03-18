from app.rag.retriever import get_retriever


async def search_methodology(query: str, k: int = 4) -> list[dict]:
    retriever = get_retriever()
    docs = await retriever.ainvoke(query)
    return [
        {
            "content": doc.page_content,
            "source": doc.metadata.get("source", ""),
        }
        for doc in docs[:k]
    ]

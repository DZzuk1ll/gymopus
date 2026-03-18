from app.rag.retriever import get_retriever


async def search_nutrition_guidelines(query: str, k: int = 4) -> list[dict]:
    """Search nutrition guidelines vectorstore collection."""
    from app.rag.vectorstore import get_vectorstore

    vs = get_vectorstore(collection="nutrition_guidelines")
    retriever = vs.as_retriever(
        search_type="mmr",
        search_kwargs={"k": k, "fetch_k": k * 2},
    )
    docs = await retriever.ainvoke(query)
    return [
        {"content": doc.page_content, "source": doc.metadata.get("source", "")}
        for doc in docs
    ]

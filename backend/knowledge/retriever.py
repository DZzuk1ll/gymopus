"""BM25-based knowledge retrieval."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.knowledge import KnowledgeEntry

try:
    import jieba
except ImportError:
    jieba = None

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None


class KnowledgeRetriever:
    def __init__(self):
        self.entries: list[KnowledgeEntry] = []
        self.bm25: BM25Okapi | None = None
        self._loaded = False

    async def load(self, db: AsyncSession) -> None:
        """Load all knowledge entries from DB and build BM25 index."""
        result = await db.execute(select(KnowledgeEntry))
        self.entries = list(result.scalars().all())

        if not self.entries or BM25Okapi is None:
            self._loaded = True
            return

        tokenized = []
        for e in self.entries:
            if e.content_tokens:
                tokens = e.content_tokens.split()
            elif jieba:
                tokens = list(jieba.cut(f"{e.title} {e.content}"))
            else:
                tokens = f"{e.title} {e.content}".split()
            tokenized.append(tokens)

        self.bm25 = BM25Okapi(tokenized)
        self._loaded = True

    async def search(
        self,
        query: str,
        categories: list[str] | None = None,
        top_k: int = 5,
    ) -> list[KnowledgeEntry]:
        """Search knowledge base using BM25."""
        if not self._loaded or not self.entries or self.bm25 is None:
            return []

        if jieba:
            tokenized_query = list(jieba.cut(query))
        else:
            tokenized_query = query.split()

        scores = self.bm25.get_scores(tokenized_query)

        scored_entries = sorted(
            zip(self.entries, scores),
            key=lambda x: x[1],
            reverse=True,
        )

        results = []
        for entry, score in scored_entries:
            if categories and entry.category not in categories:
                continue
            if score > 0:
                results.append(entry)
            if len(results) >= top_k:
                break

        return results


# Global instance
retriever = KnowledgeRetriever()

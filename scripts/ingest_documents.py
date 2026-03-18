import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from langchain_core.documents import Document
from app.rag.splitter import get_text_splitter
from app.rag.vectorstore import get_vectorstore

KB_ROOT = Path(__file__).resolve().parent.parent / "knowledge-base"

COLLECTIONS = {
    "methodology": KB_ROOT / "methodology",
    "nutrition_guidelines": KB_ROOT / "nutrition-guidelines",
}


def load_docs(directory: Path) -> list[Document]:
    documents = []
    if not directory.exists():
        return documents
    for md_file in sorted(directory.glob("*.md")):
        content = md_file.read_text(encoding="utf-8")
        documents.append(Document(
            page_content=content,
            metadata={"source": md_file.name, "topic": md_file.stem},
        ))
    return documents


def ingest_collection(name: str, directory: Path) -> None:
    docs = load_docs(directory)
    if not docs:
        print(f"[{name}] No documents found in {directory}, skipping")
        return

    print(f"[{name}] Loaded {len(docs)} documents")

    splitter = get_text_splitter()
    chunks = splitter.split_documents(docs)
    print(f"[{name}] Split into {len(chunks)} chunks")

    vectorstore = get_vectorstore(collection=name)
    vectorstore.delete_collection()
    vectorstore.create_collection()
    vectorstore.add_documents(chunks)
    print(f"[{name}] Ingested {len(chunks)} chunks into PGVector")


def main():
    for collection_name, directory in COLLECTIONS.items():
        ingest_collection(collection_name, directory)
    print("All collections ingested successfully")


if __name__ == "__main__":
    main()

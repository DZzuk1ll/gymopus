from langchain_text_splitters import RecursiveCharacterTextSplitter

def get_text_splitter() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n## ", "\n### ", "\n\n", "\n", "。", "，", ""],
    )

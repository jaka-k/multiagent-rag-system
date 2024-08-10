from langchain_openai import OpenAIEmbeddings


def format_chapter_id(chunk):
    label = chunk.label
    parent_label = chunk.parent_label
    chunk_id = f"{parent_label.lower()}:{label.lower()}"

    return chunk_id.replace(" ", "-")


def get_embedding_function():
    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

    return embeddings

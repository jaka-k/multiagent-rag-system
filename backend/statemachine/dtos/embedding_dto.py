from typing import List


class EmbeddingDTO:
    def __init__(self, content: str, embedding: List[float]):
        self.content = content
        self.embedding = embedding

from abc import ABC, abstractmethod
from statemachine.dtos.embedding_dto import EmbeddingDTO


class EmbeddingInterface(ABC):
    @abstractmethod
    def generate_embedding(self, content: str) -> EmbeddingDTO:
        pass


class Embedding(EmbeddingInterface):
    def generate_embedding(self, content: str) -> EmbeddingDTO:
        # Implement embedding logic here
        embedding = [0.1, 0.2, 0.3, 0.4, 0.5]
        return EmbeddingDTO(content, embedding)

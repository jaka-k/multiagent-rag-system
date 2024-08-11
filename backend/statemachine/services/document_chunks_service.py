from typing import List
from statemachine.embeddings.embedding import Embedding
from statemachine.embeddings.utils import format_chapter_id
from statemachine.model.document_chunk import DocumentChunk
from statemachine.model.epub import Chapter, Epub


class DocumentChunkService:
    def __init__(self, epub: Epub):
        self.epub = epub

    def create_document_chunks(self) -> List[DocumentChunk]:
        document_chunks = []
        for chapter in self.epub.chapters:
            document_chunk = self.calculate_chunk_ids(chapter)
            document_chunks.append(document_chunk)

        return document_chunks

    def calculate_chunk_ids(self, chapter: Chapter) -> DocumentChunk:
        formatted_id = format_chapter_id(chapter)
        chunk_id = f"{self.epub.title}:{formatted_id}".replace(" ", "-").lower()

        return DocumentChunk(chapter.content, {"id": chunk_id})

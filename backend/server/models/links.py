import uuid
from sqlmodel import Field, SQLModel


class DocChunkQueueLink(SQLModel, table=True):
    doc_chunk_queue_id: uuid.UUID = Field(
        foreign_key="docchunkqueue.id", primary_key=True
    )
    document_chunk_id: uuid.UUID = Field(
        foreign_key="documentchunk.id", primary_key=True
    )

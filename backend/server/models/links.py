import uuid

from sqlmodel import Field, SQLModel


class ChapterQueueLink(SQLModel, table=True):
    chapter_queue_id: uuid.UUID = Field(
        foreign_key="chapterqueue.id",
        primary_key=True
    )
    chapter_id: uuid.UUID = Field(
        foreign_key="chapter.id",
        primary_key=True
    )

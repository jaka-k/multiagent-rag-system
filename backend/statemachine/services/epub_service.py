from statemachine.dtos.epub_dto import EpubDTO, ChapterDTO
from statemachine.model.epub import Epub, Chapter


class EpubService:
    @staticmethod
    def transform_dto_to_domain(epub_dto: EpubDTO) -> Epub:
        chapters = [
            Chapter(
                label=chapter.label,
                parent_label=chapter.parent_label,
                content=chapter.content,
            )
            for chapter in epub_dto.chapters
        ]
        return Epub(title=epub_dto.title, chapters=chapters)

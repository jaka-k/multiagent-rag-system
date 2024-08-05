from abc import ABC, abstractmethod
import os

from statemachine.dtos.epub_dto import ChapterDTO, EpubDTO
from tools.epub_parser.utils.chapter_extractor import extract_chapters
from tools.epub_parser.utils.inspector import inspect_epub
from tools.epub_parser.utils.logging import log_empty_chapters

class EpubParserInterface(ABC):
    @abstractmethod
    def parse(self, file_path: str) -> EpubDTO:
        pass

class EpubParser(EpubParserInterface):
    def parse(self, file_path: str) -> EpubDTO:
        title, parsed_chapters = self._parse_epub(file_path)
        log_empty_chapters(parsed_chapters)

        chapters = [
            ChapterDTO(
                label=chapter_info['label'],
                parent_label=chapter_info['parent_label'],
                content=chapter_info['content']
            )
            for chapter_info in parsed_chapters
        ]
        return EpubDTO(title, chapters)

    def _parse_epub(self, file_path: str):
        print(f"Processing EPUB: {file_path}")
        if not os.path.exists(file_path):
            # TODO: 📟 handle error with FileNotFoundError
            print(f"Error: File not found: {file_path}")
        inspect_epub(file_path)
        title, chapters = extract_chapters(file_path)

        return title, chapters
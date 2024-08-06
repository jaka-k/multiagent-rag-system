from typing import List


class ChapterDTO:
    def __init__(self, label: str, parent_label: str, content: str):
        self.label = label
        self.parent_label = parent_label
        self.content = content


class EpubDTO:
    def __init__(self, title: str, chapters: List[ChapterDTO]):
        self.title = title
        self.chapters = chapters

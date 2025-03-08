from typing import List


class ChapterDTO:
    def __init__(self, label: str, parent_label: str, content: str, play_order: str):
        self.label = label
        self.parent_label = parent_label
        self.content = content
        self.play_order = play_order


class EpubDTO:
    def __init__(self, title: str, chapters: List[ChapterDTO]):
        self.title = title
        self.chapters = chapters

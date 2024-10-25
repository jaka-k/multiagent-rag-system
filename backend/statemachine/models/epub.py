from typing import List


class Chapter:
    def __init__(self, parent_label: str, label: str, content: str):
        self.parent_label = parent_label
        self.label = label
        self.content = content


class Epub:
    def __init__(self, title: str, chapters: List[Chapter]):
        self.title = title
        self.chapters = chapters

import logging

logger = logging.getLogger("epub_parser")

def log_empty_chapters(chapters):
    empty_chapter_info = []

    for chapter_info in chapters:
        content = chapter_info["content"].strip()
        if not content or len(content) < 30:
            empty_chapter_info.append(
                {
                    "file": chapter_info.get("file", "unknown"),
                    "chapter": chapter_info["label"],
                    "playOrder": chapter_info["playOrder"],
                }
            )

    if empty_chapter_info:
        logger.info("⛔️ Chapters with empty or very short content:")
        for info in empty_chapter_info:
            logger.info(
                f"File: {info['file']}, Chapter: {info['chapter']}, PlayOrder: {info['playOrder']}"
            )

    else:
        logger.info("✅ No chapters with empty or very short content found.")

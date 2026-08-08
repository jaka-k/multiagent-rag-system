import zipfile

from bs4 import BeautifulSoup
from markdownify import MarkdownConverter

from tools.epub_parser.utils.file import (
    match_toc_reference,
    read_file_with_error_handling,
    resolve_relative_path,
)
from tools.epub_parser.utils.inspector import find_toc_file
from tools.epub_parser.utils.logging import logger
from tools.epub_parser.utils.toc import parse_toc_ncx


class EpubMarkdownConverter(MarkdownConverter):
    """HTML→Markdown for EPUB content. EPUB-internal anchor URLs are dropped:
    the link text usually carries the meaningful signal ("see chapter 3"),
    while the href is a per-file anchor that adds noise to the embedding."""

    def convert_a(self, el, text, parent_tags):
        return text or ""

    def convert_img(self, *_, **__):
        return ""


_md = EpubMarkdownConverter(
    heading_style="ATX",
    code_language="",
    strip=["figure", "figcaption", "nav", "header", "footer", "script", "style"],
)

# Top-level block elements we want to render. Children are subsumed by
# markdownify when it converts the parent, so we don't enumerate inline
# tags here.
BLOCK_TAGS = {
    "p", "div", "section", "article", "pre", "blockquote",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "table",
}


def extract_chapters(file_path):
    chapters = []

    with zipfile.ZipFile(file_path, "r") as zip_ref:
        file_list = zip_ref.namelist()

        toc_files = find_toc_file(zip_ref)
        logger.info(f"Found potential TOC files: {toc_files}")

        toc_file_used = None
        toc_content = None
        title = ""

        for toc_file in toc_files:
            if toc_file.endswith(".ncx"):
                toc_content = read_file_with_error_handling(zip_ref, toc_file)
                toc_file_used = toc_file
                break

        if not toc_content:
            for toc_file in toc_files:
                toc_content = read_file_with_error_handling(zip_ref, toc_file)
                if toc_content:
                    toc_file_used = toc_file
                    break

        if toc_content:
            title, toc_entries = parse_toc_ncx(toc_content)
            max_play_order = max(entry["playOrder"] for entry in toc_entries)

            for play_order in range(1, max_play_order + 1):
                entry = next(
                    (e for e in toc_entries if e["playOrder"] == play_order), None
                )
                next_entry = next(
                    (e for e in toc_entries if e["playOrder"] == play_order + 1), None
                )
                if entry:
                    content = entry["content"]
                    chapter_file = resolve_relative_path(
                        toc_file_used, content.split("#")[0]
                    )
                    fragment_id = content.split("#")[1] if "#" in content else None
                    next_fragment_id = None
                    if next_entry:
                        next_content = next_entry["content"]
                        next_chapter_file = resolve_relative_path(
                            toc_file_used, next_content.split("#")[0]
                        )
                        if chapter_file == next_chapter_file and "#" in next_content:
                            next_fragment_id = next_content.split("#")[1]
                    matched_file = match_toc_reference(chapter_file, file_list)
                    if matched_file:
                        file_content = read_file_with_error_handling(
                            zip_ref, matched_file
                        )
                        if file_content:
                            chapter_soup = BeautifulSoup(file_content, "html.parser")
                            chapter_text = extract_text_from_fragment(
                                chapter_soup, fragment_id, next_fragment_id
                            )
                            chapters.append(
                                {
                                    "content": chapter_text,
                                    "label": entry["label"],
                                    "parent_label": entry["parent_label"],
                                    "play_order": entry["playOrder"],
                                }
                            )

        else:
            logger.info("No TOC file found. Processing all document items.")

            for file_name in file_list:
                if (
                    file_name.endswith(".html")
                    or file_name.endswith(".xhtml")
                    or file_name.endswith(".htm")
                ):
                    file_content = read_file_with_error_handling(zip_ref, file_name)
                    if file_content:
                        soup = BeautifulSoup(file_content, "html.parser")
                        chapter_text = _md.convert_soup(soup)
                        chapters.append(
                            {
                                "content": chapter_text,
                                "label": file_name,
                                "parent_label": "",
                                "play_order": -1,
                            }
                        )

    return title, chapters


def extract_text_from_fragment(soup, fragment_id, next_fragment_id):
    """Render the slice of `soup` between fragment_id and next_fragment_id as Markdown.

    fragment_id is typically a heading anchor (O'Reilly, Manning, Packt all use this
    idiom — one XHTML file containing multiple TOC entries separated by ID anchors).
    When next_fragment_id is set, we stop just before that element.
    """
    start_tag = soup.find(id=fragment_id) if fragment_id else soup
    if not start_tag:
        return ""

    parts = []
    processed = set()

    for element in start_tag.next_elements:
        if is_descendant_of_processed(element, processed):
            continue
        if next_fragment_id and getattr(element, "name", None) and element.get("id") == next_fragment_id:
            break
        if isinstance(element, str):
            continue  # inter-block whitespace; markdownify produces its own
        if element.name in BLOCK_TAGS:
            # convert(html_string) treats the tag as a block (emitting ## etc.);
            # convert_soup(tag) on a bare Tag inlines its contents and loses
            # heading prefixes.
            rendered = _md.convert(str(element)).strip()
            if rendered:
                parts.append(rendered)
            processed.add(element)

    return "\n\n".join(parts)


def is_descendant_of_processed(element, processed_elements):
    """Check if the element is a descendant of any element in the processed_elements set."""
    for processed_element in processed_elements:
        if processed_element in element.parents:
            return True
    return False

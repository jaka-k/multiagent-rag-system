from tools.epub_parser.utils.file import (
    read_file_with_error_handling,
    resolve_relative_path,
    match_toc_reference,
)
from tools.epub_parser.utils.toc import parse_toc_ncx
from tools.epub_parser.utils.inspector import find_toc_file

from bs4 import BeautifulSoup

import zipfile


def extract_chapters(file_path):
    chapters = []

    with zipfile.ZipFile(file_path, "r") as zip_ref:
        file_list = zip_ref.namelist()

        toc_files = find_toc_file(zip_ref)
        print(f"Found potential TOC files: {toc_files}")

        toc_file_used = None
        toc_content = None

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
                                    "playOrder": entry["playOrder"],
                                }
                            )

        else:
            print("No TOC file found. Processing all document items.")

            for file_name in file_list:
                if (
                    file_name.endswith(".html")
                    or file_name.endswith(".xhtml")
                    or file_name.endswith(".htm")
                ):
                    file_content = read_file_with_error_handling(zip_ref, file_name)
                    if file_content:
                        soup = BeautifulSoup(file_content, "html.parser")
                        chapter_text = soup.get_text()
                        chapters.append(
                            {
                                "content": chapter_text,
                                "label": file_name,
                                "parent_label": "",
                                "playOrder": -1,
                            }
                        )

    return title, chapters


def extract_text_from_fragment(soup, fragment_id, next_fragment_id):
    """Extract text from a specific fragment ID to the next fragment ID or to the end of the file."""
    start_tag = soup.find(id=fragment_id)
    if not start_tag:
        return ""

    chapter_text = []
    processed_elements = set()

    for element in start_tag.next_elements:
        if is_descendant_of_processed(element, processed_elements):
            continue
        if next_fragment_id and element.name and element.get("id") == next_fragment_id:
            break

        if isinstance(element, str):
            chapter_text.append(element)
        elif element.name in [
            "p",
            "div",
            "span",
            "pre",
            "code",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
        ]:
            chapter_text.append(process_element(element, processed_elements))

    return "".join(chapter_text)


def process_element(element, processed_elements):
    """Recursively process an element to handle nested tags without duplication."""
    if is_descendant_of_processed(element, processed_elements):
        return ""

    processed_elements.add(element)

    if element.name in ["img", "figure", "figcaption"]:
        # Skip images and figures entirely
        return ""
    if element.name in ["pre"]:
        # add [CODE] tag around <pre> elements
        text = element.get_text()
        return f"[CODE]\n{text}[/CODE]"
    else:
        # Handle inline text elements
        text = element.get_text()
        return text


def is_descendant_of_processed(element, processed_elements):
    """Check if the element is a descendant of any element in the processed_elements set."""
    for processed_element in processed_elements:
        if processed_element in element.parents:
            return True
    return False

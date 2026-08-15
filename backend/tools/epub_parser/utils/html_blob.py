"""Reader-facing chapter HTML: image inlining + sanitization (docs/rework/07).

Publisher EPUB HTML is untrusted input that we re-serve to the browser, so
everything passes through nh3 (ammonia) before storage. Images are resolved
against the EPUB archive and inlined as data: URIs — heavier rows, but the
blob table quarantines the weight and the reader needs zero extra fetches.
"""
import base64
import mimetypes

import nh3
from bs4 import BeautifulSoup

from tools.epub_parser.utils.file import resolve_relative_path
from tools.epub_parser.utils.logging import logger

# data: is required for the inlined images; nh3 strips everything else risky.
_URL_SCHEMES = {"http", "https", "data"}


def inline_images(html: str, zip_ref, chapter_file: str) -> str:
    """Resolve <img src> against the archive and inline as base64 data URIs.
    Images that can't be resolved are dropped rather than left as dead refs."""
    soup = BeautifulSoup(html, "html.parser")
    file_list = zip_ref.namelist()

    for img in soup.find_all("img"):
        src = img.get("src", "")
        if src.startswith("data:"):
            continue

        # Exact archive lookup only — the fuzzy TOC matcher would happily
        # resolve a dead ref to a similarly-named image.
        resolved = resolve_relative_path(chapter_file, src.split("#")[0])
        matched = resolved if resolved in file_list else None
        if not matched:
            img.decompose()
            continue

        try:
            payload = zip_ref.read(matched)
        except Exception:
            logger.warning(f"Could not read EPUB image: {matched}")
            img.decompose()
            continue

        mime = mimetypes.guess_type(matched)[0] or "image/jpeg"
        encoded = base64.b64encode(payload).decode()
        img["src"] = f"data:{mime};base64,{encoded}"

    return str(soup)


def sanitize_html(html: str) -> str:
    return nh3.clean(html, url_schemes=_URL_SCHEMES)


def build_chapter_html(parts: list[str], zip_ref, chapter_file: str) -> str:
    """Assemble the chapter's block elements into a sanitized, self-contained
    fragment. Same slice boundaries as the Markdown path, so HTML and
    Markdown stay aligned per chapter."""
    if not parts:
        return ""

    with_images = inline_images("\n".join(parts), zip_ref, chapter_file)
    return sanitize_html(with_images)

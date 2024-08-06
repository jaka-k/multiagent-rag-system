import os
import difflib


def read_file_with_error_handling(zip_file, file_path):
    try:
        return zip_file.read(file_path)
    except KeyError:
        print(f"File not found: {file_path}")
        return None


def resolve_relative_path(base_path, relative_path):
    return os.path.normpath(os.path.join(os.path.dirname(base_path), relative_path))


def match_toc_reference(toc_ref, file_list):
    # Try to find the best match for the TOC reference in the actual file list
    matches = difflib.get_close_matches(toc_ref, file_list, n=1, cutoff=0.6)
    if matches:
        return matches[0]
    return None

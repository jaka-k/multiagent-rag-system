import sys
import os

# Add the project directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.tools.epub_parser.utils.inspector import inspect_epub
from backend.tools.epub_parser import extract_chapters

def main():
    file_paths = [
        'data/mastering-go.epub'
    ]

    for file_path in file_paths:
        print(f"Processing EPUB: {file_path}")
        inspect_epub(file_path)
        chapters = extract_chapters(file_path)

        # Determine the output file name based on the input file name
        output_file_name = f"{os.path.splitext(os.path.basename(file_path))[0]}.md"

        # Open the markdown file for writing
        with open(output_file_name, 'w', encoding='utf-8') as md_file:
            # Write out the chapter contents with metadata
            for chapter_info in chapters:
                md_file.write(f"## {chapter_info['label']}\n\n")
                md_file.write(f"**Parent Label:** {chapter_info['parent_label']}\n\n")
                md_file.write(f"**PlayOrder:** {chapter_info['playOrder']}\n\n")
                md_file.write(f"{chapter_info['content']}\n\n")
                md_file.write("---\n\n")

                # Print to console for verification
                print(f"Label: {chapter_info['label']}")
                print(f"Parent Label: {chapter_info['parent_label']}")
                print(f"PlayOrder: {chapter_info['playOrder']}")
                print(chapter_info['content'])  # Print the first 200 characters for brevity
                print("\n---\n")

if __name__ == "__main__":
    main()
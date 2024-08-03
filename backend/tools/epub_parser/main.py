import sys
import os
import json

# Add the project directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tools.epub_parser.utils.inspector import inspect_epub
from tools.epub_parser.utils.chapter_extractor import extract_chapters

def main():
    # Get the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the file paths relative to the script directory
    file_paths = [
        os.path.join(script_dir, 'data/mastering-go.epub'),
        os.path.join(script_dir, 'data/100-go-mistakes.epub'),
        os.path.join(script_dir, 'data/go-cookbook.epub')
    ]

    # Array to hold state when chapter content is empty or very short
    empty_chapter_info = []

    # Define the length threshold for considering a chapter's content as very short
    length_threshold = 50

    for file_path in file_paths:
        print(f"Processing EPUB: {file_path}")
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}")
            continue
        inspect_epub(file_path)
        chapters = extract_chapters(file_path)

        # Determine the output file name based on the input file name
        output_file_name = f"{os.path.splitext(os.path.basename(file_path))[0]}.md"
        output_file_path = os.path.join(script_dir, output_file_name)

        # Open the markdown file for writing
        with open(output_file_path, 'w', encoding='utf-8') as md_file:
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
                print(chapter_info['content'])
                print("\n---\n")

                # Check if the chapter content is empty or very short
                if not chapter_info['content'].strip() or len(chapter_info['content'].strip()) < length_threshold:
                    print(chapter_info['content'])
                    empty_chapter_info.append({
                        "file": os.path.basename(file_path),
                        "chapter": chapter_info['label'],
                        "playOrder": chapter_info['playOrder']
                    })

    # Save the array holding the information of empty or very short chapters to a JSON file
    json_output_path = os.path.join(script_dir, 'empty_chapters.json')
    with open(json_output_path, 'w', encoding='utf-8') as json_file:
        json.dump(empty_chapter_info, json_file, indent=4)

    # Print the array holding the information of empty or very short chapters
    print("Chapters with empty or very short content:")
    for info in empty_chapter_info:
        print(f"File: {info['file']}, Chapter: {info['chapter']}, playOrder: {info['playOrder']}")

if __name__ == "__main__":
    main()

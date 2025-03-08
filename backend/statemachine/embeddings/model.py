import argparse
import os
import shutil

# {page_content: str, metadata: dict}
from langchain_chroma import Chroma


from server.db.dtos.epub_dto import EpubDTO

from tools.epub_parser.parser import EpubParser


CHROMA_PATH = "chroma"
DATA_PATH = "data"


def main():
    placeholderPath = "/Users/jakakrajnc/Code/python/multiagent-rag-system/backend/tools/epub_parser/data/100-go-mistakes.epub"
    populate(placeholderPath)


def populate(placeholderPath):

    # Check if the database should be cleared (using the --clear flag).
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Reset the database.")
    args = parser.parse_args()
    if args.reset:
        print("✨ Clearing Database")
        clear_database()

    add_to_chroma(placeholderPath)


def add_to_chroma(epub_dto_: str):
    # client = get_chroma_db_client()

## client.create_collection()



    # Load the existing database.
    db = Chroma(
        # client=client,
        persist_directory=CHROMA_PATH,
        # embedding_function=get_embedding_function(),
    )



    # SHOULD HAPPEN WAY BEFOR
    # Initialize the parser
    epub_parser = EpubParser()
    print(EpubDTO)

    # Parse the EPUB file
    epub_dto = epub_parser.parse(epub_dto_)


    # Add or Update the documents.
    existing_items = db.get(include=[])  # IDs are always included by default
    existing_ids = set(existing_items["ids"])

    print(f"Number of existing documents in DB: {len(existing_ids)}")

    # Only add documents that don't exist in the DB.
    new_chunks = []
    # for chunk in document_chunks:
    #     if chunk.metadata["id"] not in existing_ids:
    #         new_chunks.append(chunk)

    if len(new_chunks):
        print(f"👉 Adding new documents: {len(new_chunks)}")
        new_chunk_ids = [chunk.metadata["id"] for chunk in new_chunks]
        db.add_documents(new_chunks, ids=new_chunk_ids)
    else:
        print("✅ No new documents to add")


def clear_database():
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)


if __name__ == "__main__":
    main()

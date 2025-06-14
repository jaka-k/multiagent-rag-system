from server.core.logger import app_logger
from server.db.vectordb.vectordb import delete_all_collections


def main():
    print("ChromaDB Deletion script running 🏃🏻‍♂️")
    delete_all_collections()
    print("ChromaDB Deletion script finished 🏁")

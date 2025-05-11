import logging
import os
import tempfile

import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate("/Users/jakakrajnc/Code/python/multiagent-rag-system/firebaseServiceAccount.json")
firebase_admin.initialize_app(cred, {
    'storageBucket': 'ninja-firegram-49725.firebasestorage.app'
})


class FirebaseFileDownloader:
    def __init__(self):
        self.temp_file = None
        self.temp_file_destination = None

    def download_epub(self, doc_path: str) -> str:
        try:

            bucket = storage.bucket()
            blob = bucket.blob(doc_path)

            # Create a temporary file to store the EPUB
            with tempfile.NamedTemporaryFile(delete=False, suffix=".epub") as temp_file:
                self.temp_file = temp_file
                self.temp_file_destination = temp_file.name

            blob.download_to_filename(self.temp_file_destination)
            logging.info(f"Downloaded EPUB to temporary file: {self.temp_file_destination}")

        except Exception as e:
            logging.error(f"Failed to download EPUB: {e}")
            raise

        return self.temp_file_destination

    def cleanup(self):
        """
        Removes the temporary file if it exists.
        """
        if self.temp_file_destination and os.path.exists(self.temp_file_destination):
            os.remove(self.temp_file_destination)
            logging.info(f"Temporary file {self.temp_file_destination} removed.")
            self.temp_file = None
            self.temp_file_destination = None
        else:
            logging.info("No temporary file to clean up.")

import os
import tempfile

from firebase_admin import storage

from server.core.exceptions import EmbeddingDownloadError
from server.core.logger import app_logger


class FirebaseFileDownloader:
    def __init__(self):
        self.temp_file = None
        self.temp_file_destination = None

    def download_epub(self, doc_path: str) -> str:
        try:
            bucket = storage.bucket()
            blob = bucket.blob(doc_path)

            with tempfile.NamedTemporaryFile(delete=False, suffix=".epub") as temp_file:
                self.temp_file = temp_file
                self.temp_file_destination = temp_file.name

            blob.download_to_filename(self.temp_file_destination)
            app_logger.info(
                "Downloaded EPUB from Firebase",
                extra={
                    "step": "embedding.download",
                    "doc_path": doc_path,
                    "local_path": self.temp_file_destination,
                },
            )
            return self.temp_file_destination

        except EmbeddingDownloadError:
            raise
        except Exception as exc:
            raise EmbeddingDownloadError(
                f"Failed to download EPUB from Firebase bucket: {doc_path}"
            ) from exc

    def cleanup(self):
        """Remove the temp EPUB if present. Safe to call multiple times."""
        if self.temp_file_destination and os.path.exists(self.temp_file_destination):
            os.remove(self.temp_file_destination)
            app_logger.info(
                "Removed temporary EPUB",
                extra={"local_path": self.temp_file_destination},
            )
            self.temp_file = None
            self.temp_file_destination = None

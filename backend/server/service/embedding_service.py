import os
import tempfile

from statemachine.dtos.epub_dto import EpubDTO
from statemachine.services.document_chunks_service import DocumentChunkService
from statemachine.services.epub_service import EpubService
from google.oauth2.credentials import Credentials
from google.cloud import storage

from server.models.document import Document

from tools.epub_parser.parser import EpubParser


class EmbeddingService:
    def __init__(self, document: Document, db_session):
        ## self.epub_path = self.download_epub(document.file_path)
        self.area = document.area_id
        self.user = document.user_id
        self.db_session = db_session

    def parse_chapters(self):
        epub_parser = EpubParser()

      #   epub_dto = epub_parser.parse(self.epub_path)
      #   parsed_epub = EpubService().transform_dto_to_domain(epub_dto)
      #
      # document = DocumentChunkService(parsed_epub)
      # document_chunks = document.create_document_chunks()

    def create_embeddings(self):
        print("placeholder", self.area)

    def download_epub(self, firebase_path: str) -> str:
        ## TODO: env
        gcs_api_key = os.getenv("NEXT_PUBLIC_FIREBASE_API_KEY", "AIzaSyBypQ8DXsn0O8SXzngwZ9-pYU8WmrGEUaM")
        bucket_name = os.getenv("GCS_PROJECT", "mrag-storage")
        project = os.getenv("GCS_BUCKET_NAME", "ninja-firegram-49725")

        credentials = Credentials(gcs_api_key)

        storage_client = storage.Client(project, credentials)
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(firebase_path)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".epub") as temp_file:
            destination = temp_file.name
        blob.download_to_filename(destination)

        return destination
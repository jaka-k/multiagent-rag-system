from typing import Optional


class AnkiServiceError(Exception):
    """Base exception class for AnkiService errors."""

    status_code = 500

    def __init__(self, message: str, error: Optional[str] = None):
        super().__init__(message)
        self.error = error


class AnkiDeckCreationError(AnkiServiceError):
    """Raised when deck creation fails."""

    status_code = 500


class AnkiNoteAdditionError(AnkiServiceError):
    """Raised when adding a note fails."""

    status_code = 500


class AnkiSyncError(AnkiServiceError):
    """Raised when collection sync fails."""

    status_code = 500

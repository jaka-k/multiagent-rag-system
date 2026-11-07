import firebase_admin
from firebase_admin import credentials

from server.core.config import settings


def init_firebase() -> firebase_admin.App:
    """Initialise the Firebase Admin SDK once.

    Credentials come from Google Application Default Credentials: set
    GOOGLE_APPLICATION_CREDENTIALS to the service-account key file (a mounted
    Secret in Kubernetes, a file outside the repo locally).
    """
    try:
        return firebase_admin.get_app()
    except ValueError:
        cred = credentials.ApplicationDefault()
        # ADC loads lazily; resolve it now so a missing key fails at startup,
        # not on the first upload.
        cred.get_credential()
        return firebase_admin.initialize_app(
            cred, {"storageBucket": settings.firebase_storage_bucket}
        )

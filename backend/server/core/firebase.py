import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials

_default_cred_path = Path(__file__).resolve().parents[3] / "firebaseServiceAccount.json"
_CRED_PATH = Path(os.getenv("FIREBASE_CRED_PATH", _default_cred_path))
_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "ninja-firegram-49725.firebasestorage.app")


def _get_or_create_app() -> firebase_admin.App:
    try:
        return firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate(str(_CRED_PATH))
        return firebase_admin.initialize_app(cred, {"storageBucket": _STORAGE_BUCKET})


# Initialise once at import time; subsequent imports reuse the same app.
firebase_app: firebase_admin.App = _get_or_create_app()

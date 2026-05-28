"""Idempotently register the default Anki profile in prefs21.db.

Anki's `-p NAME` flag only LOADS profiles; it doesn't create them. Without
a registered profile, Anki shows the Profile Manager dialog on launch and
the AnkiConnect web server (gated on the profileLoaded hook) never starts.

This script calls ProfileManager.create() directly — it's a thin SQL insert
into the `profiles` table and is idempotent (returns silently if the row
exists). We deliberately avoid pm.profiles() because that triggers
_ensureProfile() which needs Anki's i18n backend initialised.

Runs as the ankiuser before supervisord starts the main Anki process.
"""

import os
from pathlib import Path

from aqt.profiles import ProfileManager

ANKI_HOME = Path(os.environ.get("ANKI_HOME", "/home/ankiuser/.local/share/Anki2"))
PROFILE_NAME = os.environ.get("ANKI_PROFILE", "User 1")

ANKI_HOME.mkdir(parents=True, exist_ok=True)

pm = ProfileManager(ANKI_HOME)
pm.setupMeta()
pm.create(PROFILE_NAME)  # no-op if it already exists
print(f"[seed-profile] Profile {PROFILE_NAME!r} ensured.")

#!/usr/bin/env bash
#
# Per-container-start seeding of:
#   1. AnkiConnect addon into the user's profile addons dir
#   2. A registered "User 1" profile in prefs21.db so Anki -p loads it
#      cleanly instead of blocking on the Profile Manager dialog
#
# The anki_data volume is mounted at /home/ankiuser, which shadows anything
# baked into that path at build time — both steps below are idempotent so
# they're safe on existing volumes too.
#
set -euo pipefail

ANKI_HOME="/home/ankiuser/.local/share/Anki2"
ADDONS_DIR="${ANKI_HOME}/addons21"
ADDON_STAGE="/opt/anki-addons/anki-connect"
ADDON_TARGET="${ADDONS_DIR}/anki-connect"

# 1. AnkiConnect addon
if [ ! -d "${ADDON_TARGET}" ]; then
    echo "[entrypoint] Seeding AnkiConnect into ${ADDON_TARGET}"
    mkdir -p "${ADDONS_DIR}"
    cp -r "${ADDON_STAGE}" "${ADDON_TARGET}"
else
    echo "[entrypoint] AnkiConnect already present, skipping seed."
fi

# 2. Profile registration — must run AS ankiuser so the resulting prefs21.db
#    is owned by them. Must run BEFORE supervisord launches anki, otherwise
#    the SQLite lock blocks the registration.
chown -R ankiuser:ankiuser /home/ankiuser/.local
ANKI_HOME="${ANKI_HOME}" su ankiuser -s /bin/bash -c \
    "/opt/anki-venv/bin/python /opt/seed-profile.py"

exec "$@"

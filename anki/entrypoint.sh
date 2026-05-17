#!/usr/bin/env bash
#
# Seed the AnkiConnect addon into the user's profile addons directory.
#
# The anki_data volume is mounted at /home/ankiuser, which shadows anything
# we baked into that path at build time. Modern Anki only loads addons from
# the per-user `~/.local/share/Anki2/addons21/` path, so we stage the addon
# at /opt/anki-addons/ in the image and copy it into the mounted volume on
# first start. Subsequent starts are idempotent (skip if already present).
#
set -euo pipefail

ADDONS_DIR="/home/ankiuser/.local/share/Anki2/addons21"
STAGE_DIR="/opt/anki-addons/anki-connect"
TARGET_DIR="${ADDONS_DIR}/anki-connect"

if [ ! -d "${TARGET_DIR}" ]; then
    echo "[entrypoint] Seeding AnkiConnect into ${TARGET_DIR}"
    mkdir -p "${ADDONS_DIR}"
    cp -r "${STAGE_DIR}" "${TARGET_DIR}"
    chown -R ankiuser:ankiuser /home/ankiuser/.local
else
    echo "[entrypoint] AnkiConnect already present, skipping seed."
fi

exec "$@"

#!/usr/bin/env bash
set -euo pipefail

TARGET="$HOME/.local/share/Anki2"

if [ ! -d "$TARGET" ] || [ -z "$(ls -A "$TARGET")" ]; then
  echo "[entrypoint] Seeding Anki profile → $TARGET"
  mkdir -p "$(dirname "$TARGET")"
  cp -a /seed-profile/. "$TARGET/"
  chown -R ankiuser:ankiuser "$TARGET"
fi

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
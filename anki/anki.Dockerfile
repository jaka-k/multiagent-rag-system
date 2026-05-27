# syntax=docker/dockerfile:1.7
#
# =====================================================================
# Anki desktop in a container, served headlessly over noVNC.
#
# Multi-stage build:
#   1. builder  — installs build-only tooling (pip, python3-venv) to
#                 produce two staged artifacts: the aqt venv and the
#                 AnkiConnect addon directory.
#   2. runtime  — slim image that pulls only runtime apt packages and
#                 COPYs the prebuilt artifacts over from builder.
#
# Why two stages: pip, python3-venv, the pip download cache, and the
# AnkiConnect tarball/extract intermediates all stay behind in the
# builder layer and never appear in the final image. Combined with
# dropping the `xorg` meta-package and the `python3-pyqt6` meta-package
# (see the runtime stage below), this brings the image from ~2GB down
# substantially.
# =====================================================================


# =====================================================================
# Stage 1 — Builder
# =====================================================================
FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Build-time apt deps:
#
#   ca-certificates, curl  — fetch the AnkiConnect tarball from GitHub.
#   python3, python3-pip,
#   python3-venv           — create the venv and `pip install aqt`.
#   python3-pyqt6.*        — present at build time too, even though the
#                            runtime stage re-installs them, because
#                            `pip install aqt` resolves PyQt6 as a
#                            dependency. With --system-site-packages
#                            the venv sees the apt-provided PyQt6 and
#                            doesn't redownload the ~100MB wheel.
#                            These packages do NOT come along with the
#                            venv when we COPY --from=builder later, so
#                            they're truly build-only in this stage.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    python3 \
    python3-pip \
    python3-venv \
    python3-pyqt6.qtwebengine \
    python3-pyqt6.qtwebchannel \
    python3-pyqt6.qtmultimedia \
    python3-pyqt6.qtquick \
    python3-pyqt6.qtsvg \
    && rm -rf /var/lib/apt/lists/*

# Anki via the `aqt` PyPI package — works on linux/amd64 + linux/arm64.
#
# --system-site-packages lets the venv see the apt-installed PyQt6 so
# pip skips redownloading the wheel. --no-cache-dir avoids leaving
# pip's download cache inside the venv layer.
RUN python3 -m venv /opt/anki-venv --system-site-packages \
    && /opt/anki-venv/bin/pip install --no-cache-dir aqt

# AnkiConnect addon — extracted from the upstream tarball. The Anki
# addon loader requires __init__.py to live DIRECTLY inside the addon
# folder, so we strip the two leading path segments (anki-connect-
# master/plugin/) and untar straight into /opt/anki-addons/anki-connect.
#
# We also flip webBindAddress from the upstream default of 127.0.0.1
# to 0.0.0.0 so AnkiConnect's HTTP server is reachable from outside
# the container (Docker bridge networking, e.g. backend → anki:8765).
RUN mkdir -p /opt/anki-addons/anki-connect \
    && curl -fsSL https://github.com/FooSoft/anki-connect/archive/refs/heads/master.tar.gz \
        | tar -xz -C /opt/anki-addons/anki-connect --strip-components=2 \
            anki-connect-master/plugin \
    && sed -i 's/"webBindAddress": "127.0.0.1"/"webBindAddress": "0.0.0.0"/' \
        /opt/anki-addons/anki-connect/config.json


# =====================================================================
# Stage 2 — Runtime
# =====================================================================
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1

# C.UTF-8 is built into glibc — no `locales` package, no locale-gen
# step, and sufficient for Anki + Qt UTF-8 handling. (The previous
# image installed `locales` and ran locale-gen to produce en_US.UTF-8;
# that's retired.) Anki itself is forced to English via `--lang en`
# in supervisord.conf, so the system locale only governs C library
# UTF-8 behavior, not Anki's UI language.
ENV LANG=C.UTF-8
ENV LANGUAGE=C.UTF-8
ENV LC_ALL=C.UTF-8

# --- Runtime apt packages --------------------------------------------
# Why each one is here:
#
#   curl              — required by the docker-compose healthcheck,
#                       which POSTs to AnkiConnect on :8765.
#   ca-certificates   — TLS roots; needed by anything hitting HTTPS at
#                       runtime (notably Anki's sync server check on
#                       startup).
#   tzdata            — docker-compose sets TZ=Europe/Berlin; without
#                       tzdata the zone won't resolve and Anki's date
#                       handling falls back to UTC.
#   fonts-dejavu-core — without an installed font, xterm and Anki Qt
#                       windows render text as tofu boxes. The `xorg`
#                       meta-package used to pull a default font in
#                       transitively via Recommends; now that we don't
#                       install `xorg`, we ask for DejaVu explicitly.
#   xvfb              — headless X server. Anki + Qt need an X display;
#                       Xvfb gives one without any GPU/hardware. We
#                       deliberately do NOT install the `xorg` meta-
#                       package — it pulls the full X.Org server tree
#                       (drivers, fonts, xinit) which under Xvfb is
#                       ~400MB of dead weight.
#   xdg-utils         — provides xdg-open; used when a human VNCs in
#                       and clicks a link or help URL inside Anki.
#   xterm             — terminal a human can spawn from the fluxbox
#                       right-click menu when debugging inside the
#                       VNC session. Kept because this is NOT a
#                       headless-server deployment — humans drop in.
#   dbus, dbus-x11    — Qt/QtWebEngine expects a session bus. Without
#                       it you get noisy warnings and some IPC
#                       features (notifications, menu services) break.
#   fluxbox           — minimal window manager. Anki opens multiple
#                       top-level windows (Profile Manager dialog,
#                       add-card window, browse window); a WM is
#                       needed so a human can move/resize them.
#   x11vnc            — exposes the Xvfb display over the VNC protocol.
#   websockify        — bridges VNC's TCP socket to a WebSocket for
#                       noVNC.
#   novnc             — the browser-side VNC client (HTML/JS) served by
#                       websockify from /usr/share/novnc/. Apt-managed
#                       so it tracks Ubuntu's security backports.
#   supervisor        — process supervisor coordinating Xvfb, fluxbox,
#                       x11vnc, websockify, and anki.
#   python3           — runs the venv copied from the builder stage.
#                       We deliberately do NOT install python3-pip or
#                       python3-venv — neither is needed at runtime.
#   python3-pyqt6.*   — system PyQt6 bindings. The venv was built with
#                       --system-site-packages so aqt resolves these
#                       from /usr/lib/python3/dist-packages and never
#                       bundles its own copy. We install ONLY the
#                       submodules Anki actually touches — NOT the
#                       `python3-pyqt6` meta-package, which depends on
#                       every submodule (QtBluetooth, QtSensors,
#                       QtSerialPort, QtPositioning, QtRemoteObjects,
#                       …) and adds hundreds of MB for no benefit.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    tzdata \
    fonts-dejavu-core \
    xvfb \
    xdg-utils \
    xterm \
    dbus \
    dbus-x11 \
    fluxbox \
    x11vnc \
    websockify \
    novnc \
    supervisor \
    python3 \
    python3-pyqt6.qtwebengine \
    python3-pyqt6.qtwebchannel \
    python3-pyqt6.qtmultimedia \
    python3-pyqt6.qtquick \
    python3-pyqt6.qtsvg \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*.deb

# --- Application user ------------------------------------------------
RUN useradd -m ankiuser

# --- Copy build artifacts from the builder stage ---------------------
# The venv is portable across stages because both stages share the
# same ubuntu:24.04 base (same python3 version, same path), and we
# re-installed the python3-pyqt6.* submodules above so the venv's
# --system-site-packages lookup still resolves at runtime.
COPY --from=builder /opt/anki-venv   /opt/anki-venv
COPY --from=builder /opt/anki-addons /opt/anki-addons
ENV VENV=/opt/anki-venv
ENV PATH=${VENV}/bin:${PATH}

# --- VNC password ----------------------------------------------------
# Stored once at build time; x11vnc reads it via -rfbauth /etc/vncsecret.
RUN x11vnc -storepasswd 1990 /etc/vncsecret

# --- Filesystem prep -------------------------------------------------
# All directory creation + ownership in a single RUN so we don't
# inflate the image with one layer per chown -R (each of which would
# write a full copy of the chowned files into the layer's diff).
#
# /home/ankiuser is chowned for symmetry but is shadowed at runtime
# by the `anki_data` volume mount in docker-compose; the entrypoint
# re-chowns the mounted volume's .local subdir on each container start.
#
# /usr/share/novnc is intentionally NOT chowned — websockify only
# needs read access, and apt already left the files world-readable.
RUN mkdir -p /config/app /var/log/supervisor \
    && chmod -R 755 /var/log/supervisor \
    && chown -R ankiuser:ankiuser /config/app /opt/anki-addons /home/ankiuser

# --- Supervisor config, profile seeder, entrypoint -------------------
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY seed-profile.py  /opt/seed-profile.py
COPY entrypoint.sh    /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /config/app

EXPOSE 3100 8765

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

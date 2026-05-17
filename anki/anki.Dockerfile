FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1

# Multi-arch build — Anki is installed via pip (the `aqt` package), which has
# wheels for both linux/amd64 and linux/arm64. We deliberately do NOT use the
# ankitects/anki GitHub release tarball — it's x86_64-only and would force
# qemu emulation on Apple Silicon.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    xorg \
    openbox \
    xdg-utils \
    xterm \
    xvfb \
    dbus \
    dbus-x11 \
    python3 \
    python3-pip \
    git \
    supervisor \
    fluxbox \
    x11vnc \
    websockify \
    novnc \
    ca-certificates \
    locales \
    libxkbcommon-x11-0 \
    libxcb-util0-dev \
    libnss3 \
    libasound2 \
    libxkbcommon0 \
    libxcb-xkb1 \
    libxcb-icccm4 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-randr0 \
    libxcb-xinerama0 \
    libxcb-shape0 \
    libxcb-sync1 \
    libxcb-render-util0 \
    libxcb-glx0 \
    libxcb-shm0 \
    libxcb-xfixes0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxi6 \
    libxss1 \
    libxcursor1 \
    libxinerama1 \
    libxft2 \
    libxpm4 \
    libxtst6 \
    libxt6 \
    libx11-xcb1 \
    libqt5core5a \
    libqt5gui5 \
    libqt5widgets5 \
    libqt5x11extras5 \
    libgl1-mesa-glx \
    libglu1-mesa \
    libegl1-mesa \
    libxcb-cursor0 \
    && rm -rf /var/lib/apt/lists/*

RUN locale-gen en_US.UTF-8 && \
    update-locale LANG=en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

RUN useradd -m ankiuser

# Anki via the official `aqt` PyPI package. `aqt` is pure-Python; the
# underlying `anki` package ships manylinux wheels for both x86_64 and
# aarch64 (glibc ≥ 2.35 — Ubuntu 22.04 hits this exactly).
ARG ANKI_VERSION=25.2.5
RUN pip3 install --no-cache-dir "aqt[qt6]==${ANKI_VERSION}"

ARG ANKI_CONNECT_REF=4064fa142785975255457abd6a496015f5b71f38
RUN mkdir -p /usr/share/anki/addons21 && \
    git clone https://github.com/FooSoft/anki-connect.git \
        /usr/share/anki/addons21/anki-connect && \
    git -C /usr/share/anki/addons21/anki-connect checkout ${ANKI_CONNECT_REF} && \
    rm -rf /usr/share/anki/addons21/anki-connect/.git

ARG FLASK_VERSION=3.0.3
RUN pip3 install --no-cache-dir flask==${FLASK_VERSION}

RUN x11vnc -storepasswd 1990 /etc/vncsecret

RUN chown -R ankiuser:ankiuser /usr/share/novnc

RUN mkdir -p /config/app /var/log/supervisor && \
    chmod -R 755 /var/log/supervisor

RUN chown -R ankiuser:ankiuser /config/app /usr/share/anki

RUN chown -R ankiuser:ankiuser /home/ankiuser

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /config/app


EXPOSE 3100 8765

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
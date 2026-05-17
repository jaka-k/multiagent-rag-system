FROM --platform=linux/amd64 ubuntu:jammy AS build_amd64

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    gnupg2 \
    software-properties-common \
    xorg \
    openbox \
    zstd \
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

RUN wget https://github.com/ankitects/anki/releases/download/25.02.5/anki-25.02.5-linux-qt6.tar.zst && \
    tar --use-compress-program=unzstd -xvf anki-25.02.5-linux-qt6.tar.zst && \
    cd anki-25.02.5-linux-qt6 && \
    ./install.sh && \
    cd .. && \
    rm -rf anki-25.02.5-linux-qt6 anki-25.02.5-linux-qt6.tar.zst

ARG ANKI_CONNECT_REF=4064fa142785975255457abd6a496015f5b71f38
RUN mkdir -p /usr/share/anki/addons21 && \
    git clone https://github.com/FooSoft/anki-connect.git \
        /usr/share/anki/addons21/anki-connect && \
    git -C /usr/share/anki/addons21/anki-connect checkout ${ANKI_CONNECT_REF} && \
    rm -rf /usr/share/anki/addons21/anki-connect/.git

RUN pip3 install flask

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
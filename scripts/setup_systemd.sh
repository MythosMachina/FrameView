#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${FRAMEVIEW_ROOT:-$(pwd)}"
API_SERVICE="/etc/systemd/system/frameview-api.service"
UI_SERVICE="/etc/systemd/system/frameview-ui.service"
INDEXER_SERVICE="/etc/systemd/system/frameview-indexer.service"
INDEXER_PATH="/etc/systemd/system/frameview-indexer.path"

cat <<SERVICE | sudo tee "$API_SERVICE" > /dev/null
[Unit]
Description=FrameView API Service
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=${ROOT_DIR}/services/api
Environment=NODE_ENV=production
Environment=PORT=4010
Environment=PGHOST=${FRAMEVIEW_PGHOST:-127.0.0.1}
Environment=PGPORT=${FRAMEVIEW_PGPORT:-5432}
Environment=PGUSER=${FRAMEVIEW_PGUSER:-frameview}
Environment=PGPASSWORD=${FRAMEVIEW_PGPASSWORD:-frameview}
Environment=PGDATABASE=${FRAMEVIEW_PGDATABASE:-frameview}
Environment=IMAGE_ROOT=${FRAMEVIEW_IMAGE_ROOT:-${ROOT_DIR}/images}
ExecStart=/usr/bin/node ${ROOT_DIR}/services/api/dist/main.js
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
SERVICE

cat <<SERVICE | sudo tee "$UI_SERVICE" > /dev/null
[Unit]
Description=FrameView UI Service
After=network.target

[Service]
Type=simple
WorkingDirectory=${ROOT_DIR}/services/ui
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 4173
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
SERVICE

cat <<SERVICE | sudo tee "$INDEXER_SERVICE" > /dev/null
[Unit]
Description=FrameView Indexer (one-shot)
After=network.target postgresql.service

[Service]
Type=oneshot
WorkingDirectory=${ROOT_DIR}/services/indexer
Environment=NODE_ENV=production
Environment=PGHOST=${FRAMEVIEW_PGHOST:-127.0.0.1}
Environment=PGPORT=${FRAMEVIEW_PGPORT:-5432}
Environment=PGUSER=${FRAMEVIEW_PGUSER:-frameview}
Environment=PGPASSWORD=${FRAMEVIEW_PGPASSWORD:-frameview}
Environment=PGDATABASE=${FRAMEVIEW_PGDATABASE:-frameview}
Environment=INDEX_ROOTS=${FRAMEVIEW_IMAGE_ROOT:-${ROOT_DIR}/images}
ExecStart=/usr/bin/node ${ROOT_DIR}/services/indexer/dist/main.js
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
SERVICE

cat <<SERVICE | sudo tee "$INDEXER_PATH" > /dev/null
[Unit]
Description=FrameView Indexer Path Trigger

[Path]
PathChanged=${FRAMEVIEW_IMAGE_ROOT:-${ROOT_DIR}/images}
PathModified=${FRAMEVIEW_IMAGE_ROOT:-${ROOT_DIR}/images}
Unit=frameview-indexer.service

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable --now frameview-api.service frameview-ui.service frameview-indexer.service frameview-indexer.path

echo "Systemd services installed and started."

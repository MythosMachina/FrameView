#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${FRAMEVIEW_ROOT:-$(pwd)}"
DB_NAME="${FRAMEVIEW_DB_NAME:-frameview}"
DB_USER="${FRAMEVIEW_DB_USER:-frameview}"
DB_PASS="${FRAMEVIEW_DB_PASS:-frameview}"
SCHEMA_FILE="${ROOT_DIR}/services/db/schema.sql"

mkdir -p "${ROOT_DIR}/images" "${ROOT_DIR}/logs"

sudo apt-get update
sudo apt-get install -y postgresql

sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}'; END IF; END \$\$;"

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
fi

sudo -u postgres psql -d "${DB_NAME}" -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"
sudo -u postgres psql -d "${DB_NAME}" -c "ALTER SCHEMA public OWNER TO ${DB_USER}; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER}; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};"

sudo -u postgres psql -d "${DB_NAME}" -f "${SCHEMA_FILE}"

echo "Postgres installed and ${DB_NAME} initialized."

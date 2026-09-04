#!/usr/bin/env bash
# ==============================================================================
# RenderNest — Automated PostgreSQL Backup Script
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ] && [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/rendernest_db_${TIMESTAMP}.sql.gz"

DB_CONTAINER="${DB_CONTAINER:-rendernest-postgres}"
DB_USER="${POSTGRES_USER:-rendernest}"
DB_NAME="${POSTGRES_DB:-rendernest_production}"

echo "📦 Starting automated backup of PostgreSQL database '${DB_NAME}'..."

if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    # Backup via running Docker container
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
else
    # Fallback to local pg_dump using DATABASE_URL if container is not running
    if [ -n "${DATABASE_URL:-}" ]; then
        pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
    else
        echo "❌ Error: Neither docker container '${DB_CONTAINER}' is running nor DATABASE_URL is set." >&2
        exit 1
    fi
fi

if [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "✅ Backup completed successfully: $BACKUP_FILE (${BACKUP_SIZE})"
else
    echo "❌ Error: Backup file was created but is empty." >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Retention policy: retain backups for 14 days
echo "🧹 Pruning backups older than 14 days..."
find "$BACKUP_DIR" -name "rendernest_db_*.sql.gz" -type f -mtime +14 -delete || true

echo "📋 Recent backups:"
ls -lh "$BACKUP_DIR"

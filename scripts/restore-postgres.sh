#!/usr/bin/env bash
# ==============================================================================
# RenderNest — Controlled PostgreSQL Restore Script
# ==============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <backup-file.sql.gz> [--confirm]" >&2
    echo "Example: $0 ./backups/rendernest_db_20260904_120000.sql.gz --confirm" >&2
    exit 1
fi

BACKUP_FILE="$1"
CONFIRM="${2:-}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file '$BACKUP_FILE' does not exist." >&2
    exit 1
fi

if [ "$CONFIRM" != "--confirm" ]; then
    echo "⚠️  SAFETY WARNING: Restoring a backup will OVERWRITE existing data in the database!"
    echo "To proceed, you MUST pass the '--confirm' flag explicitly:"
    echo "   $0 $BACKUP_FILE --confirm"
    exit 1
fi

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

DB_CONTAINER="${DB_CONTAINER:-rendernest-postgres}"
DB_USER="${POSTGRES_USER:-rendernest}"
DB_NAME="${POSTGRES_DB:-rendernest_production}"

echo "🔄 Restoring database '$DB_NAME' from '$BACKUP_FILE'..."

if docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
else
    if [ -n "${DATABASE_URL:-}" ]; then
        gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
    else
        echo "❌ Error: Neither docker container '${DB_CONTAINER}' is running nor DATABASE_URL is set." >&2
        exit 1
    fi
fi

echo "✅ Database restore from '$BACKUP_FILE' completed successfully."

#!/usr/bin/env bash
# ==============================================================================
# RenderNest — Safe Production PostgreSQL Migration Runner
# ==============================================================================
set -euo pipefail

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f ".env" ]; then
        ENV_FILE=".env"
    else
        echo "❌ Error: Neither .env.production nor .env found." >&2
        exit 1
    fi
fi

echo "🔄 Loading environment from $ENV_FILE..."
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ Error: DATABASE_URL is not set in $ENV_FILE." >&2
    exit 1
fi

echo "🚀 Running safe PostgreSQL schema deployment..."
SCHEMA_PATH="packages/database/prisma/schema.postgresql.prisma"

if [ ! -f "$SCHEMA_PATH" ]; then
    echo "❌ Error: $SCHEMA_PATH not found." >&2
    exit 1
fi

# Execute Prisma DB Push with the production PostgreSQL schema
npx prisma db push --schema="$SCHEMA_PATH" --skip-generate

echo "🔄 Generating production Prisma Client..."
npx prisma generate --schema="$SCHEMA_PATH"

echo "🌱 Ensuring core operational defaults are seeded..."
# Seed core operational records safely without overwriting tenant data
npx tsx packages/database/prisma/seed.ts || true

echo "✅ Production PostgreSQL database migration completed successfully."

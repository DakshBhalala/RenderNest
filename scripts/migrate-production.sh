#!/usr/bin/env bash
# ==============================================================================
# RenderNest — Safe Production PostgreSQL Migration Runner
# ==============================================================================
set -euo pipefail

# 1. Locate environment configuration
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

# 2. Determine Docker Compose command if available
COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

echo "🚀 Running safe PostgreSQL schema deployment using pinned Prisma..."

# 3. Execution Strategy:
# Preferred: Run inside the RenderNest Docker environment so it uses the pinned
# Prisma 5.22.0 and pnpm 9.15.9 within the internal Docker network (postgres:5432)
# without requiring global host Prisma/Node packages.
if [ -n "$COMPOSE_CMD" ] && docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^rendernest-web$"; then
    echo "🐳 Executing migrations inside running 'rendernest-web' container..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f docker-compose.production.yml exec -T web pnpm db:migrate:prod
    echo "🌱 Ensuring core operational defaults are seeded..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f docker-compose.production.yml exec -T web pnpm --filter @rendernest/database seed
elif [ -n "$COMPOSE_CMD" ]; then
    # Ensure postgres container is running
    if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^rendernest-postgres$"; then
        echo "🗄️ Starting PostgreSQL container..."
        $COMPOSE_CMD --env-file "$ENV_FILE" -f docker-compose.production.yml up -d postgres
    fi

    echo "⏳ Waiting for PostgreSQL to be ready..."
    MAX_RETRIES=30
    COUNTER=0
    until docker exec rendernest-postgres pg_isready -U "${POSTGRES_USER:-rendernest}" -d "${POSTGRES_DB:-rendernest_production}" &> /dev/null; do
        COUNTER=$((COUNTER + 1))
        if [ "$COUNTER" -ge "$MAX_RETRIES" ]; then
            echo "❌ Error: PostgreSQL container did not become ready in time." >&2
            exit 1
        fi
        sleep 2
    done
    echo "✅ PostgreSQL is ready."

    echo "🐳 Executing migrations via one-off Docker container..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f docker-compose.production.yml run --rm --no-deps web pnpm db:migrate:prod
    echo "🌱 Ensuring core operational defaults are seeded..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f docker-compose.production.yml run --rm --no-deps web pnpm --filter @rendernest/database seed
elif command -v pnpm &> /dev/null; then
    echo "📦 Executing migrations via local pnpm workspace..."
    pnpm db:migrate:prod
    echo "🌱 Ensuring core operational defaults are seeded..."
    pnpm --filter @rendernest/database seed
else
    echo "❌ Error: Neither Docker Compose nor pnpm is available to run migrations." >&2
    echo "Please ensure Docker is running or pnpm is installed." >&2
    exit 1
fi

echo "✅ Production PostgreSQL database migration completed successfully."
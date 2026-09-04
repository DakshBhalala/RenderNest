#!/usr/bin/env bash
# ==============================================================================
# RenderNest — Automated Production Deployment Script
# Target: Oracle Cloud Infrastructure VM (Ubuntu Linux)
# ==============================================================================
set -euo pipefail

echo "========================================================"
echo " 🚀 RenderNest Production Deployment Automation"
echo "========================================================"

# 1. Check prerequisites
for cmd in docker git; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "❌ Error: '$cmd' is required but not installed." >&2
        exit 1
    fi
done

COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Docker Compose is required." >&2
    exit 1
fi

# 2. Check for .env.production
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production file not found!" >&2
    echo "Please copy .env.production.example to .env.production and configure secrets:" >&2
    echo "   cp .env.production.example .env.production" >&2
    echo "   bash scripts/generate-production-secrets.sh" >&2
    exit 1
fi

echo "📋 Checking .env.production configuration..."
set -a
# shellcheck disable=SC1090
source .env.production
set +a

if [ -z "${AUTH_SECRET:-}" ] || [ "$AUTH_SECRET" = "REPLACE_WITH_RANDOM_64_CHAR_HEX_SECRET" ]; then
    echo "❌ Error: AUTH_SECRET must be set to a cryptographically secure random value in .env.production." >&2
    exit 1
fi

if [ -z "${POSTGRES_PASSWORD:-}" ] || [ "$POSTGRES_PASSWORD" = "REPLACE_WITH_STRONG_POSTGRES_PASSWORD" ]; then
    echo "❌ Error: POSTGRES_PASSWORD must be configured in .env.production." >&2
    exit 1
fi

# 3. Pull / Build Images
echo "🔨 Building production Docker images..."
$COMPOSE_CMD -f docker-compose.production.yml build

# 4. Start Database & Redis first to run migrations
echo "🗄️ Starting PostgreSQL and Redis containers..."
$COMPOSE_CMD -f docker-compose.production.yml up -d postgres redis

echo "⏳ Waiting for PostgreSQL to become healthy..."
until docker exec rendernest-postgres pg_isready -U "${POSTGRES_USER:-rendernest}" -d "${POSTGRES_DB:-rendernest_production}" &> /dev/null; do
    echo "   Waiting for database ready probe..."
    sleep 2
done
echo "✅ PostgreSQL is healthy."

# 5. Run Database Migrations
echo "🔄 Executing production schema migrations..."
bash scripts/migrate-production.sh

# 6. Start Web, Worker, and Caddy Reverse Proxy
echo "🌐 Starting Web, Worker, and Caddy services..."
$COMPOSE_CMD -f docker-compose.production.yml up -d

# 7. Verify Health
echo "⏳ Waiting for Web Application to become healthy..."
MAX_RETRIES=15
COUNTER=0
until docker exec rendernest-web node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))" &> /dev/null; do
    COUNTER=$((COUNTER + 1))
    if [ "$COUNTER" -ge "$MAX_RETRIES" ]; then
        echo "❌ Error: Web application failed to become healthy within timeout." >&2
        $COMPOSE_CMD -f docker-compose.production.yml logs --tail=50 web
        exit 1
    fi
    echo "   Waiting for healthcheck ($COUNTER/$MAX_RETRIES)..."
    sleep 3
done
echo "✅ Web Application is healthy."

echo "--------------------------------------------------------"
echo "🎉 RenderNest Production deployment succeeded!"
echo "--------------------------------------------------------"
$COMPOSE_CMD -f docker-compose.production.yml ps

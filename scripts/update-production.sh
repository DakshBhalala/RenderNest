#!/usr/bin/env bash
# ==============================================================================
# RenderNest — Rolling Update Automation Script
# ==============================================================================
set -euo pipefail

echo "========================================================"
echo " 🔄 RenderNest Production Rolling Update"
echo "========================================================"

BRANCH="${1:-main}"

echo "📥 Fetching latest code from branch '$BRANCH'..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

# Pre-build new images before touching running containers
echo "🔨 Building updated container images..."
$COMPOSE_CMD -f docker-compose.production.yml build

# Run migrations if schema changed
echo "🔄 Checking and applying database migrations..."
bash scripts/migrate-production.sh

# Gracefully restart worker and web
echo "🔄 Gracefully updating web and worker containers..."
$COMPOSE_CMD -f docker-compose.production.yml up -d --no-deps web worker

# Verify health
echo "⏳ Verifying post-update health..."
sleep 5
docker exec rendernest-web node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

echo "✅ RenderNest update completed successfully."
$COMPOSE_CMD -f docker-compose.production.yml ps

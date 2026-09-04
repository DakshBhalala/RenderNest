#!/usr/bin/env bash
# ==============================================================================
# RenderNest — Production Rollback Automation Script
# ==============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <git-commit-sha-or-tag>" >&2
    echo "Example: $0 abc1234" >&2
    exit 1
fi

TARGET_REF="$1"

echo "========================================================"
echo " ⏪ RenderNest Production Rollback to $TARGET_REF"
echo "========================================================"

COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

echo "🔄 Checking out target ref: $TARGET_REF..."
git checkout "$TARGET_REF"

echo "🔨 Rebuilding container images for rollback version..."
$COMPOSE_CMD -f docker-compose.production.yml build

echo "🚀 Restarting application services..."
$COMPOSE_CMD -f docker-compose.production.yml up -d --no-deps web worker

echo "⏳ Verifying post-rollback health..."
sleep 5
docker exec rendernest-web node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

echo "✅ Rollback to $TARGET_REF completed successfully."
$COMPOSE_CMD -f docker-compose.production.yml ps

#!/usr/bin/env bash
# ==============================================================================
# RenderNest — Cryptographic Production Secret Generator
# ==============================================================================
set -euo pipefail

echo "========================================================"
echo " 🔐 RenderNest Production Cryptographic Secret Generator"
echo "========================================================"
echo ""

# Check for openssl
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: 'openssl' command is required but not installed." >&2
    exit 1
fi

AUTH_SECRET=$(openssl rand -hex 32)
STORAGE_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 24)
REDIS_PASSWORD=$(openssl rand -hex 24)
RAPIDAPI_PROXY_SECRET=$(openssl rand -hex 32)

cat << EOF
Copy and paste the following generated secrets into your .env.production file:

--------------------------------------------------------------------------------
AUTH_SECRET="${AUTH_SECRET}"
STORAGE_SECRET="${STORAGE_SECRET}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
REDIS_PASSWORD="${REDIS_PASSWORD}"
RAPIDAPI_PROXY_SECRET="${RAPIDAPI_PROXY_SECRET}"
--------------------------------------------------------------------------------

DATABASE_URL="postgresql://rendernest:${POSTGRES_PASSWORD}@postgres:5432/rendernest_production?schema=public"
REDIS_URL="redis://:${REDIS_PASSWORD}@redis:6379"

⚠️  Keep these secrets secure. Never commit .env.production to Git!
EOF

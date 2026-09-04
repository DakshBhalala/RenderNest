# RenderNest Production Release Checklist

Use this release gate before every staging and production deployment of RenderNest. Every check must be evaluated and signed off.

---

## 1. Codebase & Quality Gates (Pre-Build)

- [ ] **Clean Git Working Tree**: All intended changes committed; no untracked or debugging files lingering.
- [ ] **Typecheck**: `pnpm typecheck` succeeds with 0 errors across all monorepo packages (`@rendernest/shared`, `@rendernest/database`, `@rendernest/providers`, `@rendernest/web`, `@rendernest/worker`).
- [ ] **Lint**: `pnpm lint` reports zero critical errors or unused variables.
- [ ] **Unit & Provider Tests**: `pnpm test` passes 100% of test suites.
- [ ] **OpenAPI Sync**: OpenAPI specification is valid and matches actual route handler schemas.
- [ ] **No Committed Secrets**: Ripgrep scan confirms no private keys, passwords, or live tokens in source code (`git status`, `.env` gitignored).

---

## 2. Environment & Configuration Audit

- [ ] `NODE_ENV=production` is strictly set.
- [ ] `DEMO_MODE=false` is strictly set.
- [ ] `AUTH_SECRET` has 32+ bytes of cryptographic entropy (`openssl rand -hex 32`).
- [ ] `STORAGE_SECRET` has 32+ bytes of cryptographic entropy.
- [ ] `RAPIDAPI_PROXY_SECRET` is set and matches the RapidAPI Provider Portal.
- [ ] `DATABASE_URL` references private PostgreSQL connection string.
- [ ] `REDIS_URL` references private Redis connection string.
- [ ] Storage driver configured (`STORAGE_DRIVER=r2`) with valid R2 credentials and private bucket.

---

## 3. Database Safety & Pre-Migration

- [ ] **Pre-Deployment Backup**: Run `bash scripts/backup-postgres.sh` and verify `.sql.gz` dump was created and non-empty.
- [ ] **Migration Check**: Inspect pending migrations (`packages/database/prisma/schema.prisma`).
- [ ] **Safe Migration**: Run `bash scripts/migrate-production.sh`. Confirm schema was synchronized without destructive column drops.

---

## 4. Container Build & Orchestration

- [ ] **Multi-stage Production Build**: Dockerfiles build using multi-stage targets without devDependencies.
- [ ] **Non-root Execution**: Web and worker containers run as user `node` (UID/GID 1000).
- [ ] **Healthchecks**: Docker compose file defines healthcheck intervals, timeouts, and retries for postgres, redis, web, and caddy.
- [ ] **Isolated Network**: All services attached to `rendernest_prod_net` internal bridge; only Caddy exposes ports `80` and `443` to the host.

---

## 5. Deployment Execution

- [ ] Execute `bash scripts/deploy.sh` (or `bash scripts/update-production.sh` for rolling updates).
- [ ] Check container statuses: `docker compose -f docker-compose.production.yml ps`. All 5 services show `Up (healthy)`.
- [ ] Check logs: `docker compose -f docker-compose.production.yml logs --tail=50`. No uncaught exceptions or crash loops.

---

## 6. Post-Deployment Verification Gates

- [ ] **Liveness Probe**: `curl -f https://api.rendernest.com/health` returns `200 OK` (`{"status":"ok","process":"alive"}`).
- [ ] **Readiness Probe**: `curl -f https://api.rendernest.com/ready` returns `200 OK` (`{"ready":true,"database":true,"redis":true}`).
- [ ] **Production Smoke Test**: Run `API_KEY=wf_live_xxx node --import tsx scripts/production-smoke-test.ts`. All endpoint checks pass.
- [ ] **RapidAPI Gateway Test**: Run `node --import tsx scripts/verify-rapidapi.ts`. All 10 checks return `PASS`.
- [ ] **SSRF Guard**: Verify attempt to access `http://169.254.169.254` returns HTTP `400` / `422` with safety block.
- [ ] **Audit Logging**: Confirm logs output structured JSON with `request_id` and latency; confirm `Authorization` headers are omitted from logs.

---

## 7. Rollback Preparedness

- [ ] The previous Docker image tag or Git commit SHA is recorded.
- [ ] Database backup file from Step 3 is verified in `/opt/rendernest/backups/`.
- [ ] `bash scripts/rollback-production.sh` is tested and ready to execute immediately if any health gate fails.

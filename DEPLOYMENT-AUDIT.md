# RenderNest — Production Deployment Audit

This document records the exact findings from inspecting the current RenderNest codebase. Every finding is verified directly against repository configuration, source code, and package declarations.

---

## 1. Application Runtime

- **Web / API Process**:
  - Started by: `pnpm --filter @rendernest/web start` (which runs `next start -p 3000`).
  - Production port: `3000` (HTTP).
  - Framework: Next.js 14.2.35 (App Router).
  - Runtime environment: Node.js >= 20.0.0 (Node 22 Bookworm Slim recommended in Docker).
  - Package location: `apps/web`.
  - Process responsibility: Handles user dashboard UI, API key management, usage analytics, billing dashboard, documentation, OpenAPI specification, and all `/v1/*` synchronous and asynchronous API endpoints.

- **Background Worker Process**:
  - Started by: `pnpm --filter @rendernest/worker start` or `tsx src/index.ts`.
  - Package location: `apps/worker`.
  - Port: No HTTP port exposed. Worker operates as an asynchronous consumer pulling jobs from Redis.
  - Process responsibility: BullMQ queue listener for `batch` jobs, Playwright Chromium headless rendering, artifact uploads to storage, webhook event delivery, and hourly expiration cleanup (`cleanupExpired`).

- **Shared Packages & Internal Dependencies**:
  - `@rendernest/shared`: Common types, schemas, operation definitions, credit calculators, and RFC 7807 error classes.
  - `@rendernest/database`: Prisma ORM client with schema definitions.
  - `@rendernest/providers`: Core abstractions for Playwright browser, BullMQ/Memory queues, Local/S3/R2 storage, and deterministic extractors.
  - `@rendernest/api-client`: Typed TypeScript SDK for consuming the RenderNest API.

---

## 2. Database Configuration

- **Development vs. Production Datasources**:
  - Development datasource: Local SQLite database located at `packages/database/prisma/dev.db` via `packages/database/prisma/schema.prisma` (`provider = "sqlite"`).
  - Production datasource: PostgreSQL 16 Alpine via `packages/database/prisma/schema.postgresql.prisma` (`provider = "postgresql"`).
- **Datasource Connection Variable**:
  - `DATABASE_URL`: Connection string formatted as `postgresql://<user>:<password>@<host>:5432/<dbname>?schema=public`.
- **Production Migration Mechanism**:
  - In production, migrations are applied using `npx prisma db push --schema=prisma/schema.postgresql.prisma` or `npx prisma migrate deploy --schema=prisma/schema.postgresql.prisma`.
  - A dedicated migration wrapper script `scripts/migrate-production.sh` executes this safely against the PostgreSQL container without dropping existing tenant data.

---

## 3. Queue Configuration

- **Queue Provider**:
  - In production, BullMQ (`bullmq` v5) is used, connected to Redis via `ioredis`.
  - Controlled by environment variable: `REDIS_URL` (e.g. `redis://redis:6379`).
  - Fallback mechanism: When `REDIS_URL` is unset, `getQueueProvider()` in `packages/providers` falls back to `MemoryQueueProvider` for local standalone testing. In production, `REDIS_URL` must be configured.
- **Queues Utilized**:
  - `batch`: Long-running batch URL processing jobs.
  - `webhooks`: Webhook event deliveries with exponential backoff retries.

---

## 4. Browser & Playwright Runtime

- **Chromium Installation**:
  - Installed via Playwright CLI: `npx playwright install chromium`.
  - Chromium binaries are stored in the standard cache directory (`~/.cache/ms-playwright`).
- **System Dependencies**:
  - Playwright requires Debian system packages: `libnss3`, `libnspr4`, `libatk1.0-0`, `libatk-bridge2.0-0`, `libcups2`, `libdrm2`, `libxkbcommon0`, `libxcomposite1`, `libxdamage1`, `libxfixes3`, `libxrandr2`, `libgbm1`, `libasound2`, `libpango-1.0-0`, `libcairo2`, `fonts-liberation`, and `libglib2.0-0`.
  - Both `Dockerfile` and `Dockerfile.worker` include these dependencies in their base stages.
- **Sandbox Configuration**:
  - Executed with `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, and `--disable-gpu` for containerized environments.
  - Isolated browser contexts are created per job and closed in `finally` blocks to guarantee zero resource leaks.
  - Subresource request interception actively blocks requests to internal IP addresses (anti-SSRF).

---

## 5. Storage Architecture

- **Supported Drivers**:
  - `STORAGE_PROVIDER="local"`: Files stored in `.storage` directory with HMAC-SHA256 signed URLs.
  - `STORAGE_PROVIDER="s3"`: AWS S3 compatible object storage.
  - `STORAGE_PROVIDER="r2"`: Cloudflare R2 object storage using S3-compatible API.
- **Cloudflare R2 Configuration**:
  - `R2_ACCOUNT_ID`: Cloudflare account identifier.
  - `R2_ACCESS_KEY`: Cloudflare R2 API token access key ID.
  - `R2_SECRET_KEY`: Cloudflare R2 API token secret access key.
  - `R2_BUCKET` / `S3_BUCKET`: Target bucket name.
  - Endpoint resolved as: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`.
- **Signed URLs**:
  - Generated using `@aws-sdk/s3-request-presigner` via `GetObjectCommand` with configurable expiration (default 86,400s / 24 hours).
  - Storage bucket remains private; artifacts are only accessible via signed URLs.

---

## 6. Authentication & Security Secrets

- **Required Secrets in Production**:
  - `AUTH_SECRET`: Minimum 32-character high-entropy secret used for JWT session cookies and HMAC URL signatures.
  - `STORAGE_SECRET`: Secret used for HMAC-SHA256 artifact download signatures.
  - `POSTGRES_PASSWORD`: Strong password for PostgreSQL database user.
  - `RAPIDAPI_PROXY_SECRET`: Secret header configured in RapidAPI provider dashboard to verify that requests originate from the RapidAPI gateway.
- **API Key Security**:
  - API keys are hashed with SHA-256 before storage (`prisma.apiKey.keyHash`).
  - Plaintext keys are never stored in the database and never logged.
- **Demo Mode Enforcement**:
  - In production (`NODE_ENV=production`), `DEMO_MODE=false` is strictly enforced. Any demo-key bypass attempts are rejected with `401 Unauthorized`.

---

## 7. Billing & Distribution Strategy

- **Initial Distribution Channel**: RapidAPI marketplace.
  - RapidAPI manages developer subscriptions, metering tiers, payment collection, and developer invoicing.
  - RenderNest acts as the fulfillment engine, verifying proxy secrets, tracking tenant quotas in its internal database, and attributing usage to a dedicated RapidAPI workspace.
- **Direct Stripe Billing**:
  - Direct Stripe integration (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) is kept optional for the initial release to eliminate unnecessary operational complexity.

---

## 8. Summary of Findings

| Subsystem | Development | Target Production (OCI) | Verified |
| :--- | :--- | :--- | :---: |
| **App Server** | Next.js dev (`:3000`) | Next.js standalone container (`:3000`) | YES |
| **Worker** | `tsx src/index.ts` | Docker container with Chromium + BullMQ | YES |
| **Database** | SQLite (`dev.db`) | PostgreSQL 16 Alpine container | YES |
| **Queue** | In-Memory fallback | Redis 7 Alpine container (private) | YES |
| **Storage** | Local disk (`.storage`) | Cloudflare R2 (S3-compatible API) | YES |
| **Reverse Proxy**| None (direct localhost) | Caddy with automated HTTPS & security headers | YES |
| **Marketplace** | Local test keys | RapidAPI proxy adapter with secret verification | YES |

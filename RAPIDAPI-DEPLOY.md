# RenderNest RapidAPI Deployment & Gateway Integration Guide

This guide details how RenderNest connects to RapidAPI as an external distribution and monetization channel while preserving zero-trust security, tenant isolation, credit tracking, and internal rate limits.

---

## 1. Architectural Model

```text
       Client (Developer)
               |
               v
     RapidAPI Marketplace
  (Billing, API Key, Quota)
               |
               | (Adds X-RapidAPI-Key, X-RapidAPI-Proxy-Secret, X-RapidAPI-User)
               v
       Cloudflare / Caddy
               |
               v
     RenderNest API Engine (/v1/*)
  [RapidAPI Gateway Auth Adapter]
               |
               +---> Verified Proxy Secret matches RAPIDAPI_PROXY_SECRET?
               |     YES:
               |       - Resolves/creates dedicated RapidAPI Workspace
               |       - Enforces tenant isolation (workspaceId)
               |       - Runs URL safety (SSRF guard)
               |       - Logs request_id & caller metrics
               |       - Executes operation (Shared Browser / Extract / Render / Batch)
               |       - Returns standardized RFC 7807 JSON or binary artifact
               |     NO:
               |       - 401 Unauthorized ("Invalid RapidAPI Proxy Secret")
```

---

## 2. Authentication Adapter Contract

When a developer subscribes on RapidAPI and calls an endpoint, RapidAPI proxies the call to RenderNest with special HTTP headers:

| Header | Description | RenderNest Action |
|---|---|---|
| `X-RapidAPI-Proxy-Secret` | Cryptographic secret configured in RapidAPI Provider Dashboard | Verified against `process.env.RAPIDAPI_PROXY_SECRET`. If invalid or absent, request is rejected with HTTP `401`. |
| `X-RapidAPI-Key` | RapidAPI's developer application key | Stored as reference metadata for audit logs and rate-limiting. |
| `X-RapidAPI-User` | RapidAPI developer's username / ID | Used to provision/bind a tenant workspace (`rapidapi_user_<ID>`). |
| `X-RapidAPI-Host` | RapidAPI host header (e.g., `rendernest.p.rapidapi.com`) | Accepted as trusted host. |

> [!IMPORTANT]
> **No Bypass Guarantee**: RapidAPI calls do **NOT** bypass URL safety checks (SSRF guard), execution timeouts, maximum payload size limits (5MB), or queue boundaries. RapidAPI acts as an entry door, never a security loophole.

---

## 3. Supported RapidAPI Endpoints

All core RenderNest routes are available through RapidAPI:

| HTTP Method | Route | Description | Operation Type |
|---|---|---|---|
| `POST` | `/v1/inspect` | Extract metadata, OpenGraph, title, headings, links | Fast (HTTP/Cheerio) |
| `POST` | `/v1/render/screenshot` | High-fidelity screenshot (PNG/JPEG/WEBP) | Browser (Playwright) |
| `POST` | `/v1/render/pdf` | Print-fidelity PDF generation | Browser (Playwright) |
| `POST` | `/v1/extract/markdown` | Clean markdown stripped of boilerplate and ads | Browser / Readability |
| `POST` | `/v1/extract/text` | Plaintext content extraction | Browser / Readability |
| `POST` | `/v1/extract/json` | Schema-driven structured JSON extraction | Browser / LLM Heuristic |
| `POST` | `/v1/process` | Unified processing graph (single-pass shared browser compute) | Multi-operation graph |
| `POST` | `/v1/batch` | Asynchronous queue ingestion for high-volume URLs | Queue / BullMQ |
| `GET` | `/v1/jobs/:jobId` | Poll batch job status and retrieve generated outputs | Async status |
| `POST` | `/v1/jobs/:jobId/cancel` | Cancel an in-flight background job | Job control |

---

## 4. Step-by-Step RapidAPI Provider Setup

### Step 1: Log in to RapidAPI Provider Portal
1. Navigate to [https://rapidapi.com/provider](https://rapidapi.com/provider).
2. Click **Add New API**.
3. Set **API Name**: `RenderNest - Web Automation & Content Engine`.
4. Set **Category**: `Data`, `Developer Tools`, or `Scraping`.

### Step 2: Configure Base URL & Target
1. Go to **Target URL**:
   - URL: `https://api.rendernest.com` (or your configured production domain).
2. Verify **Timeout**: Set to `60` seconds (to accommodate browser-heavy rendering).

### Step 3: Configure Proxy Secret
1. In the RapidAPI Provider Dashboard, navigate to **Settings** → **Proxy Secret**.
2. Copy the generated secret (or generate one via `scripts/generate-production-secrets.sh`).
3. Set this exact value in your production `/opt/rendernest/.env.production`:
   ```bash
   RAPIDAPI_PROXY_SECRET=your_generated_rapidapi_proxy_secret
   ```
4. Restart the web service: `docker compose -f docker-compose.production.yml restart web`.

### Step 4: Import OpenAPI Specification
RenderNest generates an OpenAPI 3.1 specification at `/api/openapi.json` (or `packages/shared/src/openapi/spec.json`):
1. In RapidAPI Studio, click **Definitions** → **Import from URL** (or File).
2. Provide `https://api.rendernest.com/api/openapi.json`.
3. Verify all endpoints, request schemas, and responses are populated with documentation.

---

## 5. Pricing Tier Recommendations

| Plan Tier | Price | Monthly Quota | Rate Limit | Features Included |
|---|---|---|---|---|
| **BASIC (Free)** | $0 / mo | 100 requests / mo | 2 req / sec | `inspect`, `extract/markdown`, `extract/text` |
| **PRO** | $29 / mo | 10,000 requests / mo | 10 req / sec | All endpoints, screenshots, PDF rendering, `process` |
| **ULTRA** | $99 / mo | 50,000 requests / mo | 25 req / sec | All endpoints, batch queues, priority rendering, custom schemas |
| **MEGA (Enterprise)** | $299 / mo | 200,000 requests / mo | 50 req / sec | Dedicated concurrency, full batch volume, signed artifact URLs |

---

## 6. Verification & Health Monitoring

To verify your RapidAPI gateway configuration before publishing:

```bash
# Run the automated RapidAPI compatibility suite
RAPIDAPI_PROXY_SECRET=your_secret API_URL=https://api.rendernest.com node --import tsx scripts/verify-rapidapi.ts
```

When all 10 checks return `PASS`, your API is certified ready for public listing.

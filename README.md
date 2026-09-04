# RenderNest

> **One API for rendering, extracting, converting, and understanding the web.**

RenderNest is developer-first infrastructure for turning web pages, HTML, Markdown, and documents into data, high-resolution screenshots, PDFs, structured JSON, page intelligence, and visual regression analysis.

---

## Architecture Overview

```text
                                 RenderNest
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                 WEB APP                         API
                     │                             │
          Dashboard / Docs / Landing       Authentication & API Keys
          Playground & Settings            UrlSafetyService (SSRF Guard)
          Billing & Usage                  Rate Limiter & Credit System
                     │                             │
                     └──────────────┬──────────────┘
                                    │
                           Request Router / Engine
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
       RENDER                    EXTRACT                   ANALYZE
          │                         │                         │
    Playwright Chromium        Parser & Turndown         Page Inspector
    PDF & Screenshot          Structured JSON (LLM/Heur)  SEO & Diff Compare
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                              Convert Engine
                             (HTML/MD → PDF/DOCX)
                                    │
                            Job & Queue Layer
                       (Redis + BullMQ / Local Queue)
                                    │
                             Storage Engine
                    (Local Filesystem / S3 / Cloudflare R2)
                                    │
                             Database Layer
                          (PostgreSQL / Prisma)
```

---

## Core Capabilities (The 5 Pillars)

| Pillar | Endpoint | Description | Credit Cost |
| :--- | :--- | :--- | :--- |
| **Render** | `POST /v1/render/screenshot` | Capture full-page or viewport screenshots in PNG, JPEG, or WebP | 1 credit |
| **Render** | `POST /v1/render/pdf` | Render web pages or HTML into print-ready PDF documents | 3 credits |
| **Extract** | `POST /v1/extract/text` | Strip boilerplate, navigation, and ads to extract readable text | 2 credits |
| **Extract** | `POST /v1/extract/markdown` | Convert pages to semantic GitHub-Flavored Markdown (GFM) | 2 credits |
| **Extract** | `POST /v1/extract/json` | Extract schema-governed typed JSON from any page | 5 credits |
| **Inspect** | `POST /v1/inspect` | Technical inventory: OpenGraph, Twitter cards, JSON-LD, headings, links | 1 credit |
| **Analyze** | `POST /v1/analyze` | Automated SEO, accessibility, and structural quality audit score (0-100) | 3 credits |
| **Analyze** | `POST /v1/compare` | Pixel-level visual regression comparison with highlighted diff image | 5 credits |
| **Convert** | `POST /v1/convert/pdf` | Convert HTML or Markdown strings into formatted PDF documents | 3 credits |
| **Convert** | `POST /v1/convert/docx` | Convert HTML or Markdown strings into Microsoft Word (.docx) files | 5 credits |
| **Async** | `POST /v1/batch` | Queue asynchronous multi-URL batch tasks with HMAC-signed webhooks | Sum of sub-ops |
| **Async** | `GET /v1/jobs/:jobId` | Poll progress counters, status, and output data of batch jobs | Free |

---

## Repository Structure

```text
RenderNest/
├── apps/
│   ├── web/               # Next.js 14 Web application (Landing, Docs, Dashboard, API routes)
│   └── worker/            # Standalone BullMQ / local queue background worker daemon
├── packages/
│   ├── shared/            # Shared types, Zod schemas, constants, and error codes
│   ├── database/          # Prisma schema (PostgreSQL & SQLite), client, and seed script
│   ├── providers/         # Browser, storage, extraction, conversion, and queue providers
│   └── api-client/        # Official TypeScript / Node.js RenderNest client SDK
├── tests/                 # Comprehensive unit and integration test suite
├── docker-compose.yml     # Multi-container orchestration (Web, Worker, PostgreSQL, Redis)
├── Dockerfile             # Web application container build
├── Dockerfile.worker      # Background worker container build
├── .env.example           # Documented configuration template
└── pnpm-workspace.yaml    # Workspace configuration
```

---

## Getting Started Locally

### Prerequisites

- **Node.js**: `v20+` (tested with Node `v24`)
- **Package Manager**: `pnpm` (`npm install -g pnpm`)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Install Playwright Chromium

```bash
npx playwright install chromium
```

### 3. Initialize the Database & Seed Demo Data

```bash
pnpm db:push
pnpm db:seed
```

This populates:
- **Demo User**: `developer@rendernest.com` / `password123`
- **Development API Key**: `wf_live_dev_test_rendernest_key_12345`
- **Demo Workspace**: 48,500 credits on Growth tier

### 4. Start the Application

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Public Website & Docs: `http://localhost:3000`
- Interactive API Playground: `http://localhost:3000/dashboard/playground`
- OpenAPI 3.1 Specification: `http://localhost:3000/openapi.json`
- Health Check: `http://localhost:3000/health`

### 5. Start the Background Worker (Optional for Async Batch)

In a separate terminal:

```bash
pnpm worker
```

---

## Running with Docker Compose

To run the complete production stack (Web, Background Worker, PostgreSQL 16, and Redis 7):

```bash
docker compose up --build
```

---

## Running the Test Suite

Execute the test suite with Vitest:

```bash
pnpm test
```

---

## API Usage Examples

### 1. Capture a Full-Page Screenshot

```bash
curl -X POST http://localhost:3000/v1/render/screenshot \
  -H "Authorization: Bearer wf_live_dev_test_rendernest_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://news.ycombinator.com",
    "format": "png",
    "full_page": true,
    "width": 1440,
    "height": 900
  }'
```

### 2. Extract Clean Markdown for LLM Agents

```bash
curl -X POST http://localhost:3000/v1/extract/markdown \
  -H "Authorization: Bearer wf_live_dev_test_rendernest_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://news.ycombinator.com"
  }'
```

### 3. Extract Schema-Governed Structured JSON

```bash
curl -X POST http://localhost:3000/v1/extract/json \
  -H "Authorization: Bearer wf_live_dev_test_rendernest_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "schema": {
      "title": "string",
      "word_count": "number"
    }
  }'
```

### 4. Technical Page Inspection

```bash
curl -X POST http://localhost:3000/v1/inspect \
  -H "Authorization: Bearer wf_live_dev_test_rendernest_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

### 5. Visual Difference Comparison

```bash
curl -X POST http://localhost:3000/v1/compare \
  -H "Authorization: Bearer wf_live_dev_test_rendernest_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "url_a": "https://example.com",
    "url_b": "https://iana.org",
    "tolerance": 0.1
  }'
```

---

## Security & SSRF Protection

Every endpoint accepting a URL utilizes `UrlSafetyService` before dispatching requests or launching Chromium contexts:
- Validates protocol strictly (`http:` and `https:` only).
- Resolves DNS hostnames and verifies all resolved IP addresses.
- Blocks RFC 1918 private IPv4 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- Blocks loopbacks (`127.0.0.0/8`), broadcast (`0.0.0.0/8`), and link-local ranges (`169.254.0.0/16`).
- Blocks cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).
- Blocks private IPv6 (`::1`, `fe80::/10`, `fc00::/7`).

---

## License

Apache-2.0. Developed as serious developer infrastructure for the modern web.

# RenderNest RapidAPI Marketplace Listing Asset & Copy Guide

This document contains copy, curl examples, JSON responses, pricing structures, and assets for listing **RenderNest** on the RapidAPI Marketplace.

---

## 1. Listing Metadata

- **API Title**: RenderNest — Web Automation, Rendering & Content Engine
- **Tagline**: High-performance headless browser rendering, screenshot capture, PDF generation, and structured data extraction in a single API call.
- **Category**: `Developer Tools` (Primary), `Data Scraping` (Secondary)
- **Tags**: `screenshot`, `pdf-generation`, `web-scraping`, `headless-chrome`, `playwright`, `content-extraction`, `markdown-extractor`, `web-automation`
- **Terms of Service URL**: `https://rendernest.duckdns.org/terms`
- **Privacy Policy URL**: `https://rendernest.duckdns.org/privacy`

---

## 2. Description Copy

### Short Description (Max 250 characters)
> Turn any URL into clean Markdown, print-fidelity PDFs, responsive screenshots, or structured JSON. Built with isolated headless Chromium, shared compute graphs, and enterprise-grade SSRF protection.

### Long / Full Description
```markdown
### What is RenderNest?

RenderNest provides scalable, enterprise-grade web infrastructure for developers, AI agents, and data pipelines. Powered by modern headless Chromium and intelligent extraction engines, RenderNest allows you to capture, render, extract, and convert web pages with zero browser management overhead.

### Key Capabilities

1. **Unified Processing Pipeline (`/v1/process`)**: Run multiple operations (e.g. screenshot, PDF, markdown, metadata inspection) on a single URL with **shared compute** — the target page is loaded once in Chromium and all requested artifacts are produced concurrently, saving latency and credits.
2. **High-Fidelity Rendering (`/v1/render/*`)**: Capture full-page or viewport screenshots in WEBP/PNG/JPEG and generate publication-quality PDFs with custom headers, footers, margins, and print CSS emulation.
3. **AI & LLM-Ready Extraction (`/v1/extract/*`)**: Convert messy HTML into clean, readable Markdown stripped of ads, cookie banners, and navigation menus. Extract structured JSON adhering strictly to your provided schema.
4. **Asynchronous Batch Queues (`/v1/batch`)**: Ingest hundreds of URLs simultaneously with background BullMQ queue processing and webhooks.
5. **Zero-Trust Security**: Hardened against Server-Side Request Forgery (SSRF), DNS rebinding, internal network scanning, and malicious browser exploits.
```

---

## 3. Core Endpoints & Example Payloads

### 1. Page Inspection (`POST /v1/inspect`)
Extract title, meta tags, OpenGraph data, status codes, and structural elements.

**cURL Request:**
```bash
curl -X POST "https://rendernest.p.rapidapi.com/v1/inspect" \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: rendernest.p.rapidapi.com" \
  -d '{"url": "https://example.com"}'
```

**JSON Response (200 OK):**
```json
{
  "success": true,
  "request_id": "req_1725432000000_a1b2c3d4",
  "data": {
    "url": "https://example.com",
    "status_code": 200,
    "title": "Example Domain",
    "description": "",
    "metadata": {
      "viewport": "width=device-width, initial-scale=1"
    },
    "headings_count": 1,
    "links_count": 1
  }
}
```

---

### 2. Clean Markdown Extraction (`POST /v1/extract/markdown`)
Strip boilerplate, navbars, and advertisements; convert core content to LLM-ready markdown.

**cURL Request:**
```bash
curl -X POST "https://rendernest.p.rapidapi.com/v1/extract/markdown" \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: rendernest.p.rapidapi.com" \
  -d '{
    "url": "https://example.com",
    "timeout_ms": 20000
  }'
```

**JSON Response (200 OK):**
```json
{
  "success": true,
  "request_id": "req_1725432001000_b2c3d4e5",
  "data": {
    "url": "https://example.com/",
    "title": "Example Domain",
    "markdown": "# Example Domain\n\nThis domain is for use in documentation examples without needing permission.",
    "word_count": 20,
    "links_count": 1
  }
}
```

---

### 3. Screenshot Capture (`POST /v1/render/screenshot`)
Render responsive viewport or full-page screenshots.

**cURL Request:**
```bash
curl -X POST "https://rendernest.p.rapidapi.com/v1/render/screenshot" \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: rendernest.p.rapidapi.com" \
  -d '{
    "url": "https://example.com",
    "format": "webp",
    "width": 1280,
    "height": 720,
    "full_page": false
  }'
```

**JSON Response (200 OK):**
```json
{
  "success": true,
  "request_id": "req_1725432002000_c3d4e5f6",
  "data": {
    "screenshot_url": "https://api-rendernest.duckdns.org/api/storage/artifacts/screenshot_c3d4e5f6.webp?sig=hmac...",
    "format": "webp",
    "width": 1280,
    "height": 720,
    "expires_at": "2026-09-05T12:00:00.000Z"
  }
}
```

---

### 4. Unified Processing Pipeline (`POST /v1/process`)
Execute multiple operations concurrently over a single Chromium page load.

**cURL Request:**
```bash
curl -X POST "https://rendernest.p.rapidapi.com/v1/process" \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: rendernest.p.rapidapi.com" \
  -d '{
    "input": { "url": "https://example.com" },
    "operations": [
      { "type": "markdown" },
      { "type": "text" },
      { "type": "inspect" }
    ]
  }'
```

**JSON Response (200 OK):**
```json
{
  "success": true,
  "request_id": "req_1725432003000_d4e5f6a7",
  "data": {
    "success": true,
    "url": "https://example.com",
    "shared_compute": true,
    "operationsRequested": 3,
    "operationsCompleted": 3,
    "credits_consumed": 4,
    "results": {
      "markdown": { "status": "completed", "markdown": "# Example Domain..." },
      "text": { "status": "completed", "text": "This domain is for use..." },
      "inspect": { "status": "completed", "data": { "title": "Example Domain", "status_code": 200 } }
    }
  }
}
```

---

## 4. Required Listing Visual Assets

Prepare the following image dimensions for RapidAPI Marketplace:
- [ ] **API Logo**: 512x512 PNG, square, transparent background (Anvil/Browser icon).
- [ ] **Cover Image / Banner**: 1200x630 PNG, dark background showcasing RenderNest capabilities.
- [ ] **Screenshots / Diagrams**:
  - Screenshot 1: RenderNest playground / visual interactive tester.
  - Screenshot 2: Clean markdown vs raw messy DOM comparison.
  - Screenshot 3: Multi-operation unified pipeline performance comparison.

---

## 5. RapidAPI Publishing Checklist

- [ ] Base URL target set to verified production domain (`https://api-rendernest.duckdns.org`).
- [ ] Proxy secret configured in RapidAPI and matched in `/opt/rendernest/.env.production`.
- [ ] `scripts/verify-rapidapi.ts` passes 10/10 checks.
- [ ] OpenAPI spec imported with schemas and descriptions.
- [ ] Free tier rate limit set to 2 req/sec to prevent abuse.
- [ ] Error messages return standard JSON with `request_id`.

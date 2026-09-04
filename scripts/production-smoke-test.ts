/**
 * RenderNest Production Smoke Test
 * 
 * Verifies live production API endpoints against https://api-rendernest.duckdns.org
 * (or API_URL if overridden).
 * 
 * Usage:
 *   API_KEY=wf_live_xxx API_URL=https://api-rendernest.duckdns.org node --import tsx scripts/production-smoke-test.ts
 */

const BASE_URL = (process.env.API_URL || 'https://api-rendernest.duckdns.org').replace(/\/$/, '');
const API_KEY = process.env.API_KEY || process.env.RENDERNEST_API_KEY || '';

interface SmokeStep {
  name: string;
  run: () => Promise<void>;
}

async function main() {
  console.log('========================================================');
  console.log(' 🚀 RenderNest Production Smoke Test');
  console.log(` 🎯 Target Base URL: ${BASE_URL}`);
  console.log(` 🔑 Auth: ${API_KEY ? 'Bearer [CONFIGURED]' : '[NO KEY PROVIDED]'}`);
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  };

  const steps: SmokeStep[] = [
    {
      name: 'GET /health (Liveness Probe)',
      run: async () => {
        const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(10000) });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.status !== 'ok') throw new Error(`Unexpected payload: ${JSON.stringify(data)}`);
      },
    },
    {
      name: 'GET /ready (Readiness Probe)',
      run: async () => {
        const res = await fetch(`${BASE_URL}/ready`, { signal: AbortSignal.timeout(10000) });
        if (res.status !== 200 && res.status !== 503) {
          throw new Error(`Expected 200 or 503, got ${res.status}`);
        }
        const data = await res.json();
        if (typeof data.ready !== 'boolean') {
          throw new Error(`Missing boolean ready field: ${JSON.stringify(data)}`);
        }
        if (res.status === 503) {
          console.log(` (⚠️ Not fully ready: ${data.message})`);
        }
      },
    },
    {
      name: 'POST /v1/inspect (Page Inspection & Metadata)',
      run: async () => {
        if (!API_KEY) {
          skipped++;
          console.log('⏭️  SKIP (No API_KEY provided)');
          return;
        }
        const res = await fetch(`${BASE_URL}/v1/inspect`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ url: 'https://example.com' }),
          signal: AbortSignal.timeout(20000),
        });
        if (res.status !== 200) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }
        const json = await res.json();
        if (!json.success || !json.data?.title) {
          throw new Error(`Invalid inspect response: ${JSON.stringify(json)}`);
        }
      },
    },
    {
      name: 'POST /v1/extract/markdown (Markdown Extraction)',
      run: async () => {
        if (!API_KEY) {
          skipped++;
          console.log('⏭️  SKIP (No API_KEY provided)');
          return;
        }
        const res = await fetch(`${BASE_URL}/v1/extract/markdown`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ url: 'https://example.com', timeout_ms: 20000 }),
          signal: AbortSignal.timeout(30000),
        });
        if (res.status !== 200) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }
        const json = await res.json();
        if (!json.data?.markdown) {
          throw new Error(`Markdown field missing in response: ${JSON.stringify(json)}`);
        }
      },
    },
    {
      name: 'POST /v1/extract/json (Structured JSON Extraction)',
      run: async () => {
        if (!API_KEY) {
          skipped++;
          console.log('⏭️  SKIP (No API_KEY provided)');
          return;
        }
        const res = await fetch(`${BASE_URL}/v1/extract/json`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            url: 'https://example.com',
            schema: { title: 'string', description: 'string' },
            timeout_ms: 25000,
          }),
          signal: AbortSignal.timeout(35000),
        });
        if (res.status !== 200) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }
        const json = await res.json();
        if (!json.data?.extracted_data) {
          throw new Error(`Extracted data missing: ${JSON.stringify(json)}`);
        }
      },
    },
    {
      name: 'POST /v1/process (Unified Processing Graph)',
      run: async () => {
        if (!API_KEY) {
          skipped++;
          console.log('⏭️  SKIP (No API_KEY provided)');
          return;
        }
        const res = await fetch(`${BASE_URL}/v1/process`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            input: { url: 'https://example.com' },
            operations: [{ type: 'markdown' }, { type: 'text' }, { type: 'inspect' }],
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (res.status !== 200) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }
        const json = await res.json();
        if (!json.data?.shared_compute || !json.data?.results) {
          throw new Error(`Unified processing incomplete: ${JSON.stringify(json)}`);
        }
      },
    },
    {
      name: 'POST /v1/render/screenshot (Live Screenshot Rendering)',
      run: async () => {
        if (!API_KEY) {
          skipped++;
          console.log('⏭️  SKIP (No API_KEY provided)');
          return;
        }
        const res = await fetch(`${BASE_URL}/v1/render/screenshot`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            url: 'https://example.com',
            format: 'webp',
            width: 1280,
            height: 720,
            timeout_ms: 30000,
          }),
          signal: AbortSignal.timeout(40000),
        });
        if (res.status !== 200) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }
        const json = await res.json();
        if (!json.data?.screenshot_url && !json.data?.base64) {
          throw new Error(`Screenshot output missing: ${JSON.stringify(json)}`);
        }
      },
    },
    {
      name: 'POST /v1/render/pdf (Live PDF Rendering)',
      run: async () => {
        if (!API_KEY) {
          skipped++;
          console.log('⏭️  SKIP (No API_KEY provided)');
          return;
        }
        const res = await fetch(`${BASE_URL}/v1/render/pdf`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            url: 'https://example.com',
            format: 'a4',
            timeout_ms: 30000,
          }),
          signal: AbortSignal.timeout(40000),
        });
        if (res.status !== 200) {
          const err = await res.text();
          throw new Error(`HTTP ${res.status}: ${err}`);
        }
        const json = await res.json();
        if (!json.data?.pdf_url && !json.data?.base64) {
          throw new Error(`PDF output missing: ${JSON.stringify(json)}`);
        }
      },
    },
    {
      name: 'POST /v1/batch (Batch Queue Ingestion & Status Retrieval)',
      run: async () => {
        if (!API_KEY) {
          skipped++;
          console.log('⏭️  SKIP (No API_KEY provided)');
          return;
        }
        const createRes = await fetch(`${BASE_URL}/v1/batch`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            operation: 'extract/text',
            urls: ['https://example.com/item1', 'https://example.com/item2'],
          }),
          signal: AbortSignal.timeout(15000),
        });
        if (createRes.status !== 200 && createRes.status !== 202) {
          const err = await createRes.text();
          throw new Error(`Batch creation failed HTTP ${createRes.status}: ${err}`);
        }
        const createJson = await createRes.json();
        const jobId = createJson.data?.job_id;
        if (!jobId) throw new Error('Missing job_id from batch response');

        const pollRes = await fetch(`${BASE_URL}/v1/jobs/${jobId}`, {
          method: 'GET',
          headers: authHeaders,
          signal: AbortSignal.timeout(10000),
        });
        if (pollRes.status !== 200) {
          const err = await pollRes.text();
          throw new Error(`Job polling failed HTTP ${pollRes.status}: ${err}`);
        }
        const pollJson = await pollRes.json();
        if (pollJson.data?.job_id !== jobId) {
          throw new Error(`Mismatched jobId: expected ${jobId}, got ${pollJson.data?.job_id}`);
        }
      },
    },
  ];

  for (const step of steps) {
    process.stdout.write(`• Executing ${step.name.padEnd(58)} ... `);
    try {
      await step.run();
      console.log('✅ PASS');
      passed++;
    } catch (err: any) {
      console.log(`❌ FAIL: ${err.message}`);
      failed++;
    }
  }

  console.log('\n========================================================');
  console.log(`Production Smoke Test Results: ${passed} passed, ${failed} failed, ${skipped} skipped.`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal smoke test execution failure:', err);
  process.exit(1);
});

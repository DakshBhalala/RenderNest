import { spawn, ChildProcess } from 'child_process';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_PROXY_SECRET = process.env.RAPIDAPI_PROXY_SECRET || 'rapidapi_sec_prod_verification_test_987654321';

async function waitForServer(url: string, timeoutMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return true;
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function runRapidApiVerification() {
  console.log('========================================================');
  console.log(' 🌐 RapidAPI Integration & Gateway Compatibility Suite');
  console.log('========================================================\n');

  let serverProcess: ChildProcess | null = null;
  const isAlreadyRunning = await waitForServer(BASE_URL, 2000);

  if (!isAlreadyRunning) {
    console.log(`📡 Starting RenderNest production server on port 3000...`);
    process.env.RAPIDAPI_PROXY_SECRET = TEST_PROXY_SECRET;
    serverProcess = spawn('pnpm', ['start'], {
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        RAPIDAPI_PROXY_SECRET: TEST_PROXY_SECRET,
      },
    });

    const ready = await waitForServer(BASE_URL, 30000);
    if (!ready) {
      if (serverProcess) serverProcess.kill();
      throw new Error('RenderNest server failed to start on port 3000 within timeout.');
    }
    console.log('✅ Server started and healthy.');
  } else {
    console.log(`✅ Connected to existing server at ${BASE_URL}`);
  }

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
    total++;
    process.stdout.write(`• Testing ${name.padEnd(55)} ... `);
    try {
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err: any) {
      console.log(`❌ FAIL: ${err.message}`);
    }
  }

  try {
    // 1. Health Probe
    await test('GET /health (Liveness probe)', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const json = await res.json();
      if (json.status !== 'ok' || json.process !== 'alive') {
        throw new Error(`Unexpected health payload: ${JSON.stringify(json)}`);
      }
    });

    // 2. Readiness Probe
    await test('GET /ready (Dependency readiness probe)', async () => {
      const res = await fetch(`${BASE_URL}/ready`);
      if (res.status !== 200 && res.status !== 503) {
        throw new Error(`Expected 200 or 503, got ${res.status}`);
      }
      const json = await res.json();
      if (typeof json.ready !== 'boolean') {
        throw new Error('Readiness payload missing boolean ready property');
      }
    });

    // 3. RapidAPI Auth Rejection with Invalid Proxy Secret
    await test('Rejection of request with mismatched RapidAPI secret', async () => {
      const res = await fetch(`${BASE_URL}/v1/inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'rapidapi_test_key',
          'X-RapidAPI-Proxy-Secret': 'wrong_secret_attacker',
          'X-RapidAPI-User': 'hacker',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      if (res.status !== 401) {
        throw new Error(`Expected 401 Unauthorized, got status ${res.status}`);
      }
    });

    // 4. Successful POST /v1/inspect via RapidAPI Gateway
    await test('POST /v1/inspect via RapidAPI Gateway headers', async () => {
      const res = await fetch(`${BASE_URL}/v1/inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'rapidapi_test_key_123',
          'X-RapidAPI-Proxy-Secret': TEST_PROXY_SECRET,
          'X-RapidAPI-User': 'rapidapi_verified_user_01',
        },
        body: JSON.stringify({
          url: 'https://example.com',
        }),
      });

      if (res.status !== 200) {
        const errJson = await res.text();
        throw new Error(`Expected 200, got ${res.status}: ${errJson}`);
      }

      const json = await res.json();
      if (!json.success || !json.data?.title) {
        throw new Error(`Unexpected inspection output: ${JSON.stringify(json)}`);
      }
      if (res.headers.get('X-RapidAPI-Proxied') !== 'true') {
        throw new Error('Missing X-RapidAPI-Proxied response header');
      }
    });

    // 5. Successful POST /v1/extract/markdown via RapidAPI
    await test('POST /v1/extract/markdown via RapidAPI Gateway', async () => {
      const res = await fetch(`${BASE_URL}/v1/extract/markdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'rapidapi_test_key_123',
          'X-RapidAPI-Proxy-Secret': TEST_PROXY_SECRET,
          'X-RapidAPI-User': 'rapidapi_verified_user_01',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          timeout_ms: 20000,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.status !== 200) {
        const errText = await res.text();
        throw new Error(`Expected 200, got ${res.status}: ${errText}`);
      }
      const json = await res.json();
      if (!json.data?.markdown) {
        throw new Error(`Extracted markdown missing in response`);
      }
    });

    // 6. Successful POST /v1/extract/json via RapidAPI
    await test('POST /v1/extract/json via RapidAPI Gateway', async () => {
      const res = await fetch(`${BASE_URL}/v1/extract/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'rapidapi_test_key_123',
          'X-RapidAPI-Proxy-Secret': TEST_PROXY_SECRET,
          'X-RapidAPI-User': 'rapidapi_verified_user_01',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          schema: {
            title: 'string',
          },
          timeout_ms: 20000,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.status !== 200) {
        const errText = await res.text();
        throw new Error(`Expected 200, got ${res.status}: ${errText}`);
      }
      const json = await res.json();
      if (!json.data?.extracted_data) {
        throw new Error(`Extraction response missing extracted_data: ${JSON.stringify(json)}`);
      }
    });

    // 7. Successful POST /v1/process (Unified Pipeline) via RapidAPI
    await test('POST /v1/process via RapidAPI Gateway (Shared Compute)', async () => {
      const res = await fetch(`${BASE_URL}/v1/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'rapidapi_test_key_123',
          'X-RapidAPI-Proxy-Secret': TEST_PROXY_SECRET,
          'X-RapidAPI-User': 'rapidapi_verified_user_01',
        },
        body: JSON.stringify({
          input: {
            url: 'https://example.com',
          },
          operations: [
            { type: 'markdown' },
            { type: 'text' },
            { type: 'inspect' },
          ],
        }),
      });

      if (res.status !== 200) {
        const errText = await res.text();
        throw new Error(`Expected 200, got ${res.status}: ${errText}`);
      }

      const json = await res.json();
      const results = json.data?.results;
      if (!json.data?.shared_compute || !results?.markdown || !results?.text || !results?.inspect) {
        throw new Error(`Unified processing graph output incomplete: ${JSON.stringify(json)}`);
      }
    });

    // 8. Batch Job Creation & Retrieval via RapidAPI
    let createdJobId = '';
    await test('POST /v1/batch via RapidAPI Gateway', async () => {
      const res = await fetch(`${BASE_URL}/v1/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'rapidapi_test_key_123',
          'X-RapidAPI-Proxy-Secret': TEST_PROXY_SECRET,
          'X-RapidAPI-User': 'rapidapi_verified_user_01',
        },
        body: JSON.stringify({
          operation: 'extract/text',
          urls: ['https://example.com/1', 'https://example.com/2'],
        }),
      });

      if (res.status !== 200 && res.status !== 202) {
        const err = await res.text();
        throw new Error(`Expected 200/202, got ${res.status}: ${err}`);
      }

      const json = await res.json();
      if (!json.data?.job_id) throw new Error('Response missing job_id');
      createdJobId = json.data.job_id;
    });

    await test(`GET /v1/jobs/:jobId via RapidAPI Gateway`, async () => {
      if (!createdJobId) throw new Error('No job ID available from previous step');

      const res = await fetch(`${BASE_URL}/v1/jobs/${createdJobId}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': 'rapidapi_test_key_123',
          'X-RapidAPI-Proxy-Secret': TEST_PROXY_SECRET,
          'X-RapidAPI-User': 'rapidapi_verified_user_01',
        },
      });

      if (res.status !== 200) {
        const err = await res.text();
        throw new Error(`Expected 200, got ${res.status}: ${err}`);
      }

      const json = await res.json();
      if (json.data?.job_id !== createdJobId) {
        throw new Error(`Returned unexpected job ID: ${json.data?.job_id}`);
      }
    });

    // 9. Standard RFC 7807 Error Shape on 422 Invalid Payload
    await test('RFC 7807 Error Consistency on Invalid Request', async () => {
      const res = await fetch(`${BASE_URL}/v1/inspect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'rapidapi_test_key_123',
          'X-RapidAPI-Proxy-Secret': TEST_PROXY_SECRET,
        },
        body: JSON.stringify({ invalid_param: true }), // Missing required url
      });

      if (res.status !== 422) {
        throw new Error(`Expected 422 Unprocessable Entity, got ${res.status}`);
      }

      const json = await res.json();
      if (json.success !== false || !json.error?.code || !json.request_id) {
        throw new Error(`Error response does not follow standard RFC 7807 schema: ${JSON.stringify(json)}`);
      }
    });
  } finally {
    if (serverProcess?.pid) {
      console.log('🛑 Stopping background test server...');
      if (process.platform === 'win32') {
        try {
          const { execSync } = await import('child_process');
          execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' });
        } catch {}
      } else {
        serverProcess.kill('SIGTERM');
      }
    }
  }

  console.log('\n--------------------------------------------------------');
  console.log(`RapidAPI Gateway Compatibility: ${passed}/${total} checks passed.`);
  console.log('--------------------------------------------------------');

  if (passed !== total) {
    console.error(`❌ RapidAPI verification failed with ${total - passed} errors.`);
    process.exit(1);
  } else {
    console.log('✨ RapidAPI distribution gateway fully verified and production-ready!');
    process.exit(0);
  }
}

runRapidApiVerification().catch((err) => {
  console.error('Fatal error during RapidAPI verification:', err);
  process.exit(1);
});

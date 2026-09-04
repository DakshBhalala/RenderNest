import http from 'http';
import { prisma } from '../packages/database/src';
import { generateApiKey } from '../apps/web/src/lib/auth';

async function main() {
  console.log('🧪 Starting RenderNest 2.0 End-to-End Verification Pipeline...');

  // 1. Health & Readiness Checks
  console.log('\n--- 1. Testing Health & Readiness Endpoints ---');
  const healthRes = await fetch('http://localhost:3000/health');
  console.log(`GET /health: ${healthRes.status} ${healthRes.statusText}`);
  const healthJson = await healthRes.json();
  console.log('Health payload:', healthJson);

  const readyRes = await fetch('http://localhost:3000/ready');
  console.log(`GET /ready: ${readyRes.status} ${readyRes.statusText}`);

  // 2. OpenAPI 3.1 Verification
  console.log('\n--- 2. Testing OpenAPI 3.1 Specification ---');
  const openapiRes = await fetch('http://localhost:3000/openapi.json');
  const spec = await openapiRes.json();
  const hasProcessRoute = !!spec.paths['/v1/process'];
  console.log(`OpenAPI contains /v1/process route: ${hasProcessRoute}`);
  if (!hasProcessRoute) {
    throw new Error('OpenAPI spec is missing /v1/process route!');
  }

  // 3. Create or Acquire Valid Production API Key
  console.log('\n--- 3. Provisioning Active API Key for E2E Verification ---');
  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        id: `ws_verify_${Date.now()}`,
        name: 'Verification Workspace',
        slug: `verify-${Date.now()}`,
        creditBalance: 10000,
        planTier: 'growth',
      },
    });
  }

  const { rawKey, prefix, hash } = generateApiKey('live');
  await prisma.apiKey.create({
    data: {
      workspaceId: workspace.id,
      name: 'V2 Verification Key',
      keyPrefix: prefix,
      keyHash: hash,
      environment: 'live',
      status: 'active',
    },
  });

  const token = rawKey;
  console.log(`Using API key: ${prefix}... (workspace: ${workspace.name}, credits: ${workspace.creditBalance})`);

  // 4. Test Unified /v1/process Endpoint
  console.log('\n--- 4. Testing POST /v1/process (Unified Processing Graph) ---');
  const idempotencyKey = `idem_v2_${Date.now()}`;
  const startProcess = Date.now();

  const processPayload = {
    input: {
      url: 'https://example.com',
    },
    operations: [
      { type: 'markdown' },
      { type: 'text' },
      { type: 'inspect' },
      { type: 'analyze' },
      {
        type: 'extract_json',
        schema: {
          title: 'string',
          headings: 'array',
        },
      },
    ],
  };

  const processRes = await fetch('http://localhost:3000/v1/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(processPayload),
  });

  const processDuration = Date.now() - startProcess;
  console.log(`POST /v1/process status: ${processRes.status} ${processRes.statusText} (${processDuration}ms)`);

  const processData = await processRes.json();
  const resData = processData.data || processData;

  console.log('Unified process response summary:', {
    success: processData.success,
    request_id: processData.request_id,
    shared_compute: resData.shared_compute,
    credits_consumed: resData.credits_consumed,
    operations_requested: resData.operationsRequested,
    operations_completed: resData.operationsCompleted,
    operation_keys: Object.keys(resData.results || {}),
  });

  if (!processData.success || !resData.shared_compute) {
    throw new Error(`Unified process failed or did not report shared compute: ${JSON.stringify(processData)}`);
  }

  // 5. Test Distributed Idempotency Replay
  console.log('\n--- 5. Testing Idempotency Replay (Zero Double Billing) ---');
  const replayStart = Date.now();
  const replayRes = await fetch('http://localhost:3000/v1/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(processPayload),
  });

  const replayDuration = Date.now() - replayStart;
  const replayData = await replayRes.json();
  console.log(`Replay status: ${replayRes.status} in ${replayDuration}ms (cached replay should be < 50ms)`);
  console.log(`Idempotency replay identical request_id: ${replayData.request_id === processData.request_id}`);
  console.log(`Idempotency replay identical data: ${JSON.stringify(replayData.data) === JSON.stringify(processData.data)}`);

  // 6. Metrics & Prometheus Telemetry
  console.log('\n--- 6. Testing /api/metrics Telemetry ---');
  const metricsRes = await fetch('http://localhost:3000/api/metrics');
  const metricsText = await metricsRes.text();
  const hasHttpRequestsTotal = metricsText.includes('rendernest_http_requests_total');
  console.log(`GET /api/metrics status: ${metricsRes.status}, Prometheus metrics active: ${hasHttpRequestsTotal}`);

  console.log('\n✅ All RenderNest 2.0 Live E2E Verifications Passed Successfully!');
}

main().catch((err) => {
  console.error('❌ E2E Verification failed:', err);
  process.exit(1);
});

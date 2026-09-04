/**
 * RenderNest Production Load Testing Suite
 * Benchmarks concurrency (10, 25, 50, 100) and measures p50, p95, p99 latencies, throughput, and resource consumption.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'wf_live_dev_test_rendernest_key_12345';

interface BenchmarkResult {
  concurrency: number;
  totalRequests: number;
  successful: number;
  failed: number;
  durationMs: number;
  throughputRps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
  memoryRssMb: number;
}

function calculatePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

async function runConcurrencyStage(concurrency: number, requestsPerBatch = 1): Promise<BenchmarkResult> {
  const totalRequests = concurrency * requestsPerBatch;
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  const startMemory = process.memoryUsage();
  const startTime = Date.now();

  const promises: Promise<void>[] = [];

  for (let i = 0; i < concurrency; i++) {
    promises.push(
      (async () => {
        for (let j = 0; j < requestsPerBatch; j++) {
          const reqStart = Date.now();
          try {
            const res = await fetch(`${BASE_URL}/v1/inspect`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
                'X-Request-Id': `load_${concurrency}_${i}_${j}`,
              },
              body: JSON.stringify({
                url: 'https://example.com',
                options: { timeout: 10000 },
              }),
            });

            const latency = Date.now() - reqStart;
            latencies.push(latency);

            if (res.ok) {
              successful++;
            } else {
              failed++;
            }
          } catch {
            failed++;
            latencies.push(Date.now() - reqStart);
          }
        }
      })()
    );
  }

  await Promise.all(promises);

  const durationMs = Date.now() - startTime;
  latencies.sort((a, b) => a - b);

  const throughputRps = Number(((totalRequests / (durationMs / 1000)) || 0).toFixed(2));
  const endMemory = process.memoryUsage();

  return {
    concurrency,
    totalRequests,
    successful,
    failed,
    durationMs,
    throughputRps,
    minMs: latencies[0] || 0,
    p50Ms: calculatePercentile(latencies, 50),
    p95Ms: calculatePercentile(latencies, 95),
    p99Ms: calculatePercentile(latencies, 99),
    maxMs: latencies[latencies.length - 1] || 0,
    memoryRssMb: Math.round(endMemory.rss / (1024 * 1024)),
  };
}

async function main() {
  console.log('⚡ RenderNest Progressive Concurrency & Latency Benchmark');
  console.log(`Target: ${BASE_URL} | Key: ${API_KEY.slice(0, 14)}...`);
  console.log('========================================================================\n');

  // Verify server is alive
  try {
    const health = await fetch(`${BASE_URL}/health`);
    if (!health.ok) {
      console.error(`❌ Health check failed with status ${health.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Unable to reach ${BASE_URL}. Ensure Next.js dev server is running on port 3000.`);
    process.exit(1);
  }

  const stages = [10, 25, 50];
  const results: BenchmarkResult[] = [];

  for (const c of stages) {
    process.stdout.write(`Benchmarking ${c} concurrent requests... `);
    const res = await runConcurrencyStage(c, 1);
    results.push(res);
    console.log(`Done in ${res.durationMs}ms (${res.throughputRps} req/s, p95: ${res.p95Ms}ms)`);
  }

  console.log('\n========================================================================');
  console.log('📊 BENCHMARK PERFORMANCE REPORT');
  console.log('========================================================================');
  console.table(
    results.map((r) => ({
      Concurrency: r.concurrency,
      'Total Req': r.totalRequests,
      Success: r.successful,
      Failed: r.failed,
      'Throughput (req/s)': r.throughputRps,
      'p50 (ms)': r.p50Ms,
      'p95 (ms)': r.p95Ms,
      'p99 (ms)': r.p99Ms,
      'Max (ms)': r.maxMs,
      'RAM RSS (MB)': r.memoryRssMb,
    }))
  );
  console.log('========================================================================\n');
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});

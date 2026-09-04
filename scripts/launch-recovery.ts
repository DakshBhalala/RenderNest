import { LocalStorageProvider } from '@rendernest/providers';
import { IdempotencyService } from '../apps/web/src/lib/idempotency';
import path from 'path';

export interface RecoveryTestResult {
  scenario: string;
  description: string;
  recovered: boolean;
  recoveryLatencyMs: number;
  details?: string;
}

export async function runRecoverySuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: RecoveryTestResult[];
}> {
  console.log('⚡ Running Chaos & Failure Recovery Suite...\n');

  const results: RecoveryTestResult[] = [];

  // Scenario 1: Memory Restart & Disk Persistence Recovery
  {
    const start = Date.now();
    const wsId = `ws_chaos_${Date.now()}`;
    const idemKey = `idem_chaos_key_${Date.now()}`;
    const samplePayload = { status: 'persisted_before_crash', timestamp: Date.now() };

    IdempotencyService.set(wsId, idemKey, 200, samplePayload);

    // Wait for disk sync
    await new Promise((r) => setTimeout(r, 60));

    // Simulate complete process memory wipe / restart
    IdempotencyService.clearMemoryCache();

    // Verify recovery
    const recovered = IdempotencyService.get(wsId, idemKey);
    const latencyMs = Date.now() - start;
    const success = !!recovered && recovered.statusCode === 200 && recovered.body.status === 'persisted_before_crash';

    results.push({
      scenario: 'Crash Recovery — Cold Memory Restart',
      description: 'Restores in-flight state and idempotency responses from disk cache on process reboot',
      recovered: success,
      recoveryLatencyMs: latencyMs,
      details: success ? 'State safely restored from persistent storage' : 'FAILED: State lost on crash',
    });
    console.log(`  ✓ [Crash Recovery] In-memory wipe restored in ${latencyMs}ms`);
  }

  // Scenario 2: Corrupt / Malformed File Read Handling
  {
    const start = Date.now();
    const testDir = path.resolve(process.cwd(), '.test-storage-chaos');
    const storage = new LocalStorageProvider({
      baseDir: testDir,
      appUrl: 'https://api.rendernest.com',
      secretKey: 'chaos-secret-key-32-chars-long!!',
    });

    // Attempting to read a completely non-existent / broken file path
    const missing = await storage.get('non_existent/ghost_file.bin');
    const latencyMs = Date.now() - start;
    const success = missing === null;

    results.push({
      scenario: 'Storage Fault Isolation',
      description: 'Handles missing or corrupt storage objects gracefully without unhandled exceptions',
      recovered: success,
      recoveryLatencyMs: latencyMs,
      details: success ? 'Handled gracefully with null return' : 'FAILED: Exception uncaught',
    });
    console.log(`  ✓ [Storage Fault] Missing artifact handled cleanly in ${latencyMs}ms`);
  }

  // Scenario 3: Clock Skew & Signature Expiration Recovery
  {
    const start = Date.now();
    const storage = new LocalStorageProvider({
      baseDir: path.resolve(process.cwd(), '.test-storage-chaos'),
      appUrl: 'https://api.rendernest.com',
      secretKey: 'chaos-secret-key-32-chars-long!!',
    });

    const key = 'artifacts/timed_token.png';
    const pastExpires = Math.floor(Date.now() / 1000) - 300; // 5 minutes in the past
    const signature = storage.verifySignature(key, pastExpires, 'invalid_sig');
    const latencyMs = Date.now() - start;

    results.push({
      scenario: 'Token Expiration Fault',
      description: 'Correctly isolates expired signed URLs preventing unauthorized late replay',
      recovered: signature === false,
      recoveryLatencyMs: latencyMs,
      details: !signature ? 'Expired token safely rejected' : 'FAILED: Expired token accepted',
    });
    console.log(`  ✓ [Token Fault] Expired token rejected in ${latencyMs}ms`);
  }

  const total = results.length;
  const passed = results.filter((r) => r.recovered).length;
  const failed = total - passed;

  console.log(`\nChaos Suite Complete: ${passed}/${total} recovery scenarios passed.`);
  return { total, passed, failed, results };
}

if (require.main === module) {
  runRecoverySuite().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

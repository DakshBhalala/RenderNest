import { describe, it, expect } from 'vitest';
import { IdempotencyService } from '../apps/web/src/lib/idempotency';

describe('Idempotency Engine - Multi-Tenant Replay & Isolation', () => {
  it('stores and retrieves cached API responses for matching workspace and key', () => {
    const ws = 'ws_tenant_alpha';
    const key = 'idem_key_unique_12345';
    const body = { success: true, request_id: 'req_first_run', data: { status: 'completed' } };

    IdempotencyService.set(ws, key, 200, body);

    const cached = IdempotencyService.get(ws, key);
    expect(cached).toBeDefined();
    expect(cached?.statusCode).toBe(200);
    expect(cached?.body).toEqual(body);
  });

  it('strictly isolates idempotency keys between different workspaces', () => {
    const wsAlpha = 'ws_tenant_alpha';
    const wsBeta = 'ws_tenant_beta';
    const key = 'shared_key_name_999';

    IdempotencyService.set(wsAlpha, key, 200, { owner: 'alpha' });

    // Workspace Beta should receive null, not Alpha's cached data
    const cachedBeta = IdempotencyService.get(wsBeta, key);
    expect(cachedBeta).toBeNull();
  });

  it('clears or returns null for non-existent keys', () => {
    const cached = IdempotencyService.get('ws_random', 'key_does_not_exist');
    expect(cached).toBeNull();
  });

  it('recovers cached response from persistent disk storage across memory restart', async () => {
    const ws = 'ws_tenant_restart_sim';
    const key = 'idem_key_survives_restart_777';
    const body = { status: 'restarted', token: 'persisted_value_999' };

    IdempotencyService.set(ws, key, 201, body);

    // Wait 20ms for async file write
    await new Promise((r) => setTimeout(r, 50));

    // Clear in-memory Map to simulate process crash/restart
    IdempotencyService.clearMemoryCache();

    // Retrieve from cold start
    const restored = IdempotencyService.get(ws, key);
    expect(restored).toBeDefined();
    expect(restored?.statusCode).toBe(201);
    expect(restored?.body).toEqual(body);
  });

  it('detects and flags payload mismatch when same key is reused with different payload', () => {
    const ws = 'ws_tenant_gamma';
    const key = 'idem_key_payload_check_101';
    const payloadAHash = 'hash_payload_a_aaa';
    const payloadBHash = 'hash_payload_b_bbb';

    IdempotencyService.set(ws, key, 200, { result: 'A' }, payloadAHash);

    // Same key + same payload -> clean hit
    const sameHit = IdempotencyService.get(ws, key, payloadAHash);
    expect(sameHit).toBeDefined();
    expect(sameHit?.mismatch).toBeUndefined();
    expect(sameHit?.body).toEqual({ result: 'A' });

    // Same key + different payload -> mismatch flagged
    const conflictHit = IdempotencyService.get(ws, key, payloadBHash);
    expect(conflictHit).toBeDefined();
    expect(conflictHit?.mismatch).toBe(true);
  });
});

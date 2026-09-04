import { describe, it, expect } from 'vitest';
import { metrics } from '../apps/web/src/lib/metrics';

describe('Production Observability & Metrics Engine', () => {
  it('records request latencies and calculates percentiles correctly', () => {
    metrics.reset();

    // Record 100 requests with latencies 1ms to 100ms
    for (let i = 1; i <= 100; i++) {
      metrics.recordRequestStart();
      metrics.recordRequestEnd('render.screenshot', 200, i, 5);
    }

    const snapshot = metrics.getSnapshot();
    expect(snapshot.creditsConsumedTotal).toBe(500);
    expect(snapshot.operations['render.screenshot']).toBeDefined();

    const op = snapshot.operations['render.screenshot'];
    expect(op.totalRequests).toBe(100);
    expect(op.totalErrors).toBe(0);
    expect(op.p50LatencyMs).toBe(50);
    expect(op.p95LatencyMs).toBe(95);
    expect(op.p99LatencyMs).toBe(99);
  });

  it('tracks error rates when status >= 400', () => {
    metrics.reset();

    metrics.recordRequestEnd('extract.json', 200, 45, 2);
    metrics.recordRequestEnd('extract.json', 400, 12, 0);
    metrics.recordRequestEnd('extract.json', 429, 2, 0);

    const snapshot = metrics.getSnapshot();
    const op = snapshot.operations['extract.json'];
    expect(op.totalRequests).toBe(3);
    expect(op.totalErrors).toBe(2);
  });
});

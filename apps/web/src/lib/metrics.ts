/**
 * RenderNest Production In-Memory Metrics Collector
 * Tracks throughput, error counts, credit consumption, and latency distributions (p50, p95, p99)
 */

interface LatencyHistogram {
  values: number[];
  maxSamples: number;
}

class MetricsRegistry {
  private requestsTotal: Map<string, number> = new Map();
  private requestErrorsTotal: Map<string, number> = new Map();
  private creditsConsumedTotal = 0;
  private latencies: Map<string, LatencyHistogram> = new Map();
  private activeRequests = 0;

  public recordRequestStart(): void {
    this.activeRequests++;
  }

  public recordRequestEnd(
    operation: string,
    statusCode: number,
    latencyMs: number,
    credits = 0
  ): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);

    // Increment request count by operation and status code
    const key = `${operation}:${statusCode}`;
    this.requestsTotal.set(key, (this.requestsTotal.get(key) || 0) + 1);

    if (statusCode >= 400) {
      this.requestErrorsTotal.set(
        operation,
        (this.requestErrorsTotal.get(operation) || 0) + 1
      );
    }

    this.creditsConsumedTotal += credits;

    // Record latency
    let hist = this.latencies.get(operation);
    if (!hist) {
      hist = { values: [], maxSamples: 1000 };
      this.latencies.set(operation, hist);
    }
    hist.values.push(latencyMs);
    if (hist.values.length > hist.maxSamples) {
      hist.values.shift(); // sliding window of 1000 samples
    }
  }

  private calculatePercentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  public getSnapshot() {
    const operations: Record<
      string,
      {
        totalRequests: number;
        totalErrors: number;
        p50LatencyMs: number;
        p95LatencyMs: number;
        p99LatencyMs: number;
      }
    > = {};

    const uniqueOperations = new Set([
      ...Array.from(this.requestsTotal.keys()).map((k) => k.split(':')[0]),
      ...Array.from(this.requestErrorsTotal.keys()),
    ]);

    for (const op of uniqueOperations) {
      let totalRequests = 0;
      for (const [k, count] of this.requestsTotal.entries()) {
        if (k.startsWith(`${op}:`)) {
          totalRequests += count;
        }
      }

      const totalErrors = this.requestErrorsTotal.get(op) || 0;
      const hist = this.latencies.get(op)?.values || [];

      operations[op] = {
        totalRequests,
        totalErrors,
        p50LatencyMs: this.calculatePercentile(hist, 50),
        p95LatencyMs: this.calculatePercentile(hist, 95),
        p99LatencyMs: this.calculatePercentile(hist, 99),
      };
    }

    return {
      activeRequests: this.activeRequests,
      creditsConsumedTotal: this.creditsConsumedTotal,
      operations,
      timestamp: new Date().toISOString(),
    };
  }

  public reset(): void {
    this.requestsTotal.clear();
    this.requestErrorsTotal.clear();
    this.creditsConsumedTotal = 0;
    this.latencies.clear();
    this.activeRequests = 0;
  }
}

export const metrics = new MetricsRegistry();

import { NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { checkRedisHealth } from '@rendernest/providers';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, string> = {};
  let isReady = true;

  // 1. Check Database Dependency
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ready';
  } catch (err: any) {
    checks.database = `unreachable: ${err.message}`;
    isReady = false;
  }

  // 2. Check Redis Dependency
  try {
    const redisRes = await checkRedisHealth();
    checks.redis = redisRes.status;
    if (!redisRes.ready) {
      isReady = false;
    }
  } catch (err: any) {
    checks.redis = `unreachable: ${err.message}`;
    isReady = false;
  }

  // 3. Storage Provider Check
  checks.storage = process.env.STORAGE_PROVIDER || 'local';

  return NextResponse.json(
    {
      ready: isReady,
      status: isReady ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      dependencies: checks,
    },
    { status: isReady ? 200 : 503 }
  );
}

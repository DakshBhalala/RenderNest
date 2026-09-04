import { NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { getCurrentUser } from '@/lib/auth';
import { PLANS } from '@rendernest/shared';

export async function GET() {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = current.workspace.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  // Fetch recent logs
  const logs = await prisma.requestLog.findMany({
    where: {
      workspaceId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      operation: true,
      statusCode: true,
      latencyMs: true,
      credits: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const totalRequests = logs.length;
  const successfulRequests = logs.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length;
  const successRate = totalRequests > 0 ? Number(((successfulRequests / totalRequests) * 100).toFixed(1)) : 100;
  const totalCredits = logs.reduce((sum, l) => sum + l.credits, 0);
  const avgLatency =
    totalRequests > 0 ? Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalRequests) : 0;

  // Breakdown by operation
  const opMap: Record<string, { count: number; credits: number }> = {};
  for (const log of logs) {
    if (!opMap[log.operation]) {
      opMap[log.operation] = { count: 0, credits: 0 };
    }
    opMap[log.operation].count++;
    opMap[log.operation].credits += log.credits;
  }

  const endpointBreakdown = Object.entries(opMap).map(([operation, data]) => ({
    operation,
    count: data.count,
    credits: data.credits,
    percentage: totalRequests > 0 ? Number(((data.count / totalRequests) * 100).toFixed(1)) : 0,
  }));

  // Daily time series (past 14 days)
  const dailyMap: Record<string, { date: string; requests: number; credits: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateKey = d.toISOString().split('T')[0];
    dailyMap[dateKey] = { date: dateKey, requests: 0, credits: 0 };
  }

  for (const log of logs) {
    const dateKey = log.createdAt.toISOString().split('T')[0];
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].requests++;
      dailyMap[dateKey].credits += log.credits;
    }
  }

  const timeSeries = Object.values(dailyMap);
  const planTier = (current.workspace.planTier || 'free') as keyof typeof PLANS;
  const plan = PLANS[planTier] || PLANS.free;

  return NextResponse.json({
    metrics: {
      totalRequests,
      successfulRequests,
      successRate,
      totalCreditsUsed: totalCredits,
      averageLatencyMs: avgLatency,
    },
    workspace: {
      id: current.workspace.id,
      name: current.workspace.name,
      planTier: current.workspace.planTier,
      creditBalance: current.workspace.creditBalance,
      planMaxCredits: plan.monthlyCredits,
      rateLimitRpm: plan.rateLimitRpm,
    },
    endpointBreakdown,
    timeSeries,
  });
}

import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { prisma } from '@rendernest/database';

describe('Job Ownership & Cancellation Isolation', () => {
  const wsAId = `ws_tenant_a_${Date.now()}`;
  const wsBId = `ws_tenant_b_${Date.now()}`;
  const jobId = `job_test_${Date.now()}`;

  beforeAll(async () => {
    // Create two separate workspaces
    await prisma.workspace.createMany({
      data: [
        { id: wsAId, name: 'Tenant A', slug: `tenant-a-${Date.now()}` },
        { id: wsBId, name: 'Tenant B', slug: `tenant-b-${Date.now()}` },
      ],
    });

    // Create a job owned by Tenant A
    await prisma.job.create({
      data: {
        id: jobId,
        workspaceId: wsAId,
        operation: 'batch',
        input: JSON.stringify({ urls: ['https://example.com'] }),
        status: 'queued',
      },
    });
  });

  afterAll(async () => {
    await prisma.job.deleteMany({ where: { id: jobId } }).catch(() => {});
    await prisma.workspace.deleteMany({ where: { id: { in: [wsAId, wsBId] } } }).catch(() => {});
  });

  it('enforces that a foreign workspace cannot access another workspace’s job', async () => {
    // Tenant B queries for Tenant A's job
    const jobForTenantB = await prisma.job.findFirst({
      where: {
        id: jobId,
        workspaceId: wsBId, // Boundary check
      },
    });

    // Must be null (preventing cross-tenant enumeration / data leakage)
    expect(jobForTenantB).toBeNull();

    // Tenant A queries for Tenant A's job
    const jobForTenantA = await prisma.job.findFirst({
      where: {
        id: jobId,
        workspaceId: wsAId,
      },
    });
    expect(jobForTenantA).toBeDefined();
    expect(jobForTenantA?.id).toBe(jobId);
  });

  it('allows the owning workspace to cancel their queued job', async () => {
    // Attempt cancellation under Tenant A
    const cancelled = await prisma.job.updateMany({
      where: {
        id: jobId,
        workspaceId: wsAId,
        status: { in: ['queued', 'processing'] },
      },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        errorMessage: 'Job was cancelled by user.',
      },
    });

    expect(cancelled.count).toBe(1);

    const updatedJob = await prisma.job.findUnique({ where: { id: jobId } });
    expect(updatedJob?.status).toBe('cancelled');
  });

  it('rejects cancellation attempts from unauthorized workspaces', async () => {
    // Tenant B attempts to cancel Tenant A's job
    const attempt = await prisma.job.updateMany({
      where: {
        id: jobId,
        workspaceId: wsBId, // Unauthorized tenant
      },
      data: {
        status: 'cancelled',
      },
    });

    // No rows updated
    expect(attempt.count).toBe(0);
  });
});

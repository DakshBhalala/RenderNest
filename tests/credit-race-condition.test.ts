import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '@rendernest/database';

describe('Atomic Credit Accounting - Zero Race Condition Verification', () => {
  const testWorkspaceId = `ws_race_test_${Date.now()}`;

  afterAll(async () => {
    await prisma.workspace.deleteMany({
      where: { id: testWorkspaceId },
    }).catch(() => {});
  });

  it('prevents negative balances under high concurrency using conditional updates', async () => {
    // 1. Create a workspace with exactly 3 credits
    await prisma.workspace.create({
      data: {
        id: testWorkspaceId,
        name: 'Race Condition Test WS',
        slug: `race-test-${Date.now()}`,
        creditBalance: 3,
      },
    });

    // 2. Fire 25 concurrent requests simultaneously attempting to reserve 1 credit each
    const CONCURRENT_REQUESTS = 25;
    const results = await Promise.all(
      Array.from({ length: CONCURRENT_REQUESTS }).map(async () => {
        const update = await prisma.workspace.updateMany({
          where: {
            id: testWorkspaceId,
            creditBalance: { gte: 1 },
          },
          data: {
            creditBalance: { decrement: 1 },
          },
        });
        return update.count > 0; // true if reserved, false if quota exceeded
      })
    );

    const successfulReservations = results.filter((success) => success).length;
    const rejectedRequests = results.filter((success) => !success).length;

    // 3. Verify exactly 3 succeeded and 22 were rejected
    expect(successfulReservations).toBe(3);
    expect(rejectedRequests).toBe(CONCURRENT_REQUESTS - 3);

    // 4. Verify the database balance is strictly 0 and never went negative
    const finalWorkspace = await prisma.workspace.findUnique({
      where: { id: testWorkspaceId },
    });
    expect(finalWorkspace?.creditBalance).toBe(0);
  });

  it('atomically refunds reserved credits when an operation fails', async () => {
    // Top up by 1 credit
    await prisma.workspace.update({
      where: { id: testWorkspaceId },
      data: { creditBalance: { increment: 1 } },
    });

    // Simulate reservation
    const reserve = await prisma.workspace.updateMany({
      where: { id: testWorkspaceId, creditBalance: { gte: 1 } },
      data: { creditBalance: { decrement: 1 } },
    });
    expect(reserve.count).toBe(1);

    // Workspace is at 0
    let ws = await prisma.workspace.findUnique({ where: { id: testWorkspaceId } });
    expect(ws?.creditBalance).toBe(0);

    // Simulate handler error -> refund
    await prisma.workspace.update({
      where: { id: testWorkspaceId },
      data: { creditBalance: { increment: 1 } },
    });

    ws = await prisma.workspace.findUnique({ where: { id: testWorkspaceId } });
    expect(ws?.creditBalance).toBe(1);
  });
});

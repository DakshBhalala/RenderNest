import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { prisma } from '@rendernest/database';
import { generateApiKey, hashApiKey } from '../apps/web/src/lib/auth';

describe('API Key Lifecycle - Generation, Rotation & Emergency Revocation', () => {
  const wsId = `ws_key_test_${Date.now()}`;
  let originalKeyId: string;
  let originalKeyHash: string;

  beforeAll(async () => {
    await prisma.workspace.create({
      data: { id: wsId, name: 'Key Test Workspace', slug: `key-test-${Date.now()}` },
    });

    const initialKey = generateApiKey('live');
    originalKeyHash = initialKey.hash;

    const record = await prisma.apiKey.create({
      data: {
        workspaceId: wsId,
        name: 'Production Key v1',
        keyPrefix: initialKey.prefix,
        keyHash: initialKey.hash,
        environment: 'live',
        status: 'active',
      },
    });
    originalKeyId = record.id;
  });

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { workspaceId: wsId } }).catch(() => {});
    await prisma.workspace.deleteMany({ where: { id: wsId } }).catch(() => {});
  });

  it('rotates an API key atomically by issuing replacement and revoking old key', async () => {
    const replacement = generateApiKey('live');

    // Perform atomic rotation in transaction
    const [newKeyRecord] = await prisma.$transaction([
      prisma.apiKey.create({
        data: {
          workspaceId: wsId,
          name: 'Production Key v2 (Rotated)',
          keyPrefix: replacement.prefix,
          keyHash: replacement.hash,
          environment: 'live',
          status: 'active',
        },
      }),
      prisma.apiKey.update({
        where: { id: originalKeyId },
        data: { status: 'revoked' },
      }),
    ]);

    expect(newKeyRecord).toBeDefined();
    expect(newKeyRecord.status).toBe('active');

    // Check old key is revoked
    const oldKey = await prisma.apiKey.findUnique({ where: { id: originalKeyId } });
    expect(oldKey?.status).toBe('revoked');
  });

  it('immediately blocks access when an API key is revoked', async () => {
    // Attempting to look up original key for authentication
    const key = await prisma.apiKey.findUnique({
      where: { keyHash: originalKeyHash },
    });

    expect(key).toBeDefined();
    expect(key?.status).toBe('revoked');
    // Auth check should fail because status !== 'active'
    expect(key?.status === 'active').toBe(false);
  });
});

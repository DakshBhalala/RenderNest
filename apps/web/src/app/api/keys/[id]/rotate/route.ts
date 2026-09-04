import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { getCurrentUser, generateApiKey } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const oldKey = await prisma.apiKey.findFirst({
    where: { id: params.id, workspaceId: current.workspace.id },
  });

  if (!oldKey) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  // Generate new replacement key in same environment
  const { rawKey, prefix, hash } = generateApiKey(oldKey.environment as any);

  // Execute in transaction: revoke old key and create replacement key atomically
  const [newKey] = await prisma.$transaction([
    prisma.apiKey.create({
      data: {
        workspaceId: current.workspace.id,
        name: `${oldKey.name} (Rotated)`,
        keyPrefix: prefix,
        keyHash: hash,
        environment: oldKey.environment,
        status: 'active',
      },
    }),
    prisma.apiKey.update({
      where: { id: oldKey.id },
      data: { status: 'revoked' },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: `API Key '${oldKey.name}' was rotated. The previous key is now revoked.`,
    rotated_from_id: oldKey.id,
    new_key: {
      id: newKey.id,
      name: newKey.name,
      keyPrefix: newKey.keyPrefix,
      environment: newKey.environment,
      createdAt: newKey.createdAt,
    },
    raw_key: rawKey,
  });
}

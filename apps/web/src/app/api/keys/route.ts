import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { getCurrentUser, generateApiKey } from '@/lib/auth';
import { createApiKeySchema } from '@rendernest/shared';

export async function GET() {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { workspaceId: current.workspace.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      environment: true,
      status: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createApiKeySchema.parse(body);

    const { rawKey, prefix, hash } = generateApiKey(parsed.environment);

    const created = await prisma.apiKey.create({
      data: {
        workspaceId: current.workspace.id,
        name: parsed.name,
        keyPrefix: prefix,
        keyHash: hash,
        environment: parsed.environment,
        status: 'active',
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: created.id,
        name: created.name,
        keyPrefix: created.keyPrefix,
        environment: created.environment,
        createdAt: created.createdAt,
      },
      raw_key: rawKey, // Shown only once upon creation
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create key' }, { status: 400 });
  }
}

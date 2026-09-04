import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = await prisma.apiKey.findFirst({
    where: { id: params.id, workspaceId: current.workspace.id },
  });

  if (!key) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  await prisma.apiKey.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const status = body.status === 'revoked' ? 'revoked' : 'active';

  const updated = await prisma.apiKey.updateMany({
    where: { id: params.id, workspaceId: current.workspace.id },
    data: { status },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, status });
}

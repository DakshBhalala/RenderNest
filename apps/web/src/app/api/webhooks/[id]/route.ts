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

  const wh = await prisma.webhook.findFirst({
    where: { id: params.id, workspaceId: current.workspace.id },
  });

  if (!wh) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  await prisma.webhook.delete({
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

  const updated = await prisma.webhook.updateMany({
    where: { id: params.id, workspaceId: current.workspace.id },
    data: { active: !!body.active },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, active: !!body.active });
}

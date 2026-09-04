import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@rendernest/database';
import { getCurrentUser } from '@/lib/auth';
import { webhookCreateSchema } from '@rendernest/shared';
import { UrlSafetyService } from '@/lib/security/url-safety';

export async function GET() {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const webhooks = await prisma.webhook.findMany({
    where: { workspaceId: current.workspace.id },
    orderBy: { createdAt: 'desc' },
    include: {
      deliveries: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return NextResponse.json({ webhooks });
}

export async function POST(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = webhookCreateSchema.parse(body);

    const safeUrl = await UrlSafetyService.validateWebhookUrl(parsed.url);

    const secretRaw = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const secretHash = crypto.createHash('sha256').update(secretRaw).digest('hex');
    const secretPrefix = secretRaw.slice(0, 10);

    const created = await prisma.webhook.create({
      data: {
        workspaceId: current.workspace.id,
        url: safeUrl,
        secretHash,
        secretPrefix,
        events: parsed.events.join(','),
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      webhook: created,
      signing_secret: secretRaw, // Shown only once upon creation
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create webhook' }, { status: 400 });
  }
}

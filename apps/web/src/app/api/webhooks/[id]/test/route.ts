import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@rendernest/database';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
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

  const payload = {
    event: 'job.completed',
    job_id: `job_test_${Date.now()}`,
    request_id: `req_test_${Date.now()}`,
    timestamp: new Date().toISOString(),
    data: {
      operation: 'extract/markdown',
      status: 'completed',
      sample: true,
      message: 'This is a test webhook verification event dispatched from the RenderNest dashboard.',
    },
  };

  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signaturePayload = `${timestamp}.${rawBody}`;
  const signature = crypto.createHmac('sha256', wh.secretHash).update(signaturePayload).digest('hex');

  const startTime = Date.now();
  let statusCode = 0;
  let responseBody = '';
  let success = false;

  try {
    const res = await fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RenderNest-Webhook-Test/1.0',
        'X-RenderNest-Signature': `t=${timestamp},v1=${signature}`,
      },
      body: rawBody,
      signal: AbortSignal.timeout(10000),
    });

    statusCode = res.status;
    responseBody = (await res.text()).slice(0, 500);
    success = res.ok;
  } catch (err: any) {
    responseBody = err.message || 'Connection failed';
    statusCode = 0;
  }

  const durationMs = Date.now() - startTime;

  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId: wh.id,
      event: 'job.completed',
      payload: rawBody,
      statusCode,
      responseBody,
      durationMs,
      success,
      attempts: 1,
    },
  });

  return NextResponse.json({
    success,
    status_code: statusCode,
    duration_ms: durationMs,
    delivery_id: delivery.id,
    response_body: responseBody,
  });
}

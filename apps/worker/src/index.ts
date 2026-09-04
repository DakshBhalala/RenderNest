import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '@rendernest/database';
import {
  getQueueProvider,
  getBrowserProvider,
  getStorageProvider,
  getExtractionProvider,
  extractCleanText,
  extractCleanMarkdown,
  UrlSafetyService,
} from '@rendernest/providers';
import { BatchJobData, BatchJobOutputItem } from '@rendernest/shared';
import crypto from 'crypto';

console.log('⚡ RenderNest Background Worker initialized.');

async function deliverWebhook(
  url: string,
  secretKey: string,
  payload: Record<string, any>,
  webhookId?: string
) {
  // Validate webhook destination with SSRF guard
  try {
    await UrlSafetyService.validateWebhookUrl(url);
  } catch (err: any) {
    console.error(`[Worker] Refusing to deliver webhook to unsafe destination '${url}': ${err.message}`);
    if (webhookId) {
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event: payload.event,
          payload: JSON.stringify(payload),
          statusCode: 403,
          responseBody: `Blocked by SSRF security policy: ${err.message}`,
          durationMs: 0,
          success: false,
          attempts: 1,
        },
      }).catch(() => {});
    }
    return { success: false, statusCode: 403 };
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = JSON.stringify(payload);
  const signaturePayload = `${timestamp}.${rawBody}`;
  const signature = crypto.createHmac('sha256', secretKey).update(signaturePayload).digest('hex');
  const headerVal = `t=${timestamp},v1=${signature}`;
  const eventId = payload.event_id || `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

  const startTime = Date.now();
  let statusCode = 0;
  let responseBody = '';
  let success = false;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'rendernest-webhook/1.0',
        'X-RenderNest-Signature': headerVal,
        'X-RenderNest-Timestamp': timestamp,
        'X-RenderNest-Event-Id': eventId,
        'X-RenderNest-Delivery-Attempt': '1',
      },
      body: rawBody,
      signal: AbortSignal.timeout(15000),
    });

    statusCode = res.status;
    responseBody = (await res.text()).slice(0, 1000);
    success = res.ok;
  } catch (err: any) {
    responseBody = err.message || 'Connection failed';
    statusCode = 0;
  }

  const durationMs = Date.now() - startTime;

  if (webhookId) {
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event: payload.event,
        payload: rawBody,
        statusCode,
        responseBody,
        durationMs,
        success,
        attempts: 1,
      },
    }).catch((e) => console.error('Failed to log webhook delivery:', e));
  }

  return { success, statusCode };
}

async function processBatchJob(job: { id: string; data: BatchJobData }) {
  const { job_id, workspace_id, operation, urls, options, webhook_url } = job.data;
  console.log(`[Worker] Starting batch job ${job_id} (${operation}) for ${urls.length} URLs`);

  // Check if job was cancelled before starting
  const initialJob = await prisma.job.findUnique({
    where: { id: job_id },
    select: { status: true },
  });

  if (initialJob?.status === 'cancelled') {
    console.log(`[Worker] Job ${job_id} was cancelled before worker pickup. Skipping.`);
    return;
  }

  await prisma.job.update({
    where: { id: job_id },
    data: {
      status: 'processing',
      startedAt: new Date(),
    },
  }).catch((e) => console.error(`Error updating job ${job_id}:`, e));

  const browserProvider = getBrowserProvider();
  const storageProvider = getStorageProvider();
  const extractionProvider = getExtractionProvider();

  const results: BatchJobOutputItem[] = [];
  let completedCount = 0;
  let failedCount = 0;

  for (const targetUrl of urls) {
    // Check if cancellation occurred mid-batch
    const checkState = await prisma.job.findUnique({
      where: { id: job_id },
      select: { status: true },
    }).catch(() => null);

    if (checkState?.status === 'cancelled') {
      console.log(`[Worker] Batch job ${job_id} was cancelled mid-execution. Halting.`);
      break;
    }

    try {
      // Validate targetUrl with SSRF guard before executing
      const safeUrl = await UrlSafetyService.validateUrl(targetUrl);
      let outputData: any = null;

      if (operation === 'render/screenshot') {
        const shot = await browserProvider.screenshot({
          url: safeUrl,
          format: options?.format || 'png',
          full_page: options?.full_page ?? true,
        });
        const fileKey = `screenshots/batch_${job_id}_${Date.now()}.${shot.format}`;
        const stored = await storageProvider.put(fileKey, shot.buffer, {
          contentType: `image/${shot.format}`,
        });
        outputData = { file_url: stored.url, width: shot.width, height: shot.height };
      } else if (operation === 'render/pdf') {
        const pdf = await browserProvider.pdf({
          url: safeUrl,
          format: options?.format || 'A4',
        });
        const fileKey = `pdfs/batch_${job_id}_${Date.now()}.pdf`;
        const stored = await storageProvider.put(fileKey, pdf.buffer, {
          contentType: 'application/pdf',
        });
        outputData = { file_url: stored.url };
      } else if (operation === 'extract/text') {
        const page = await browserProvider.getPageContent(safeUrl, 20000);
        outputData = extractCleanText(page.html, safeUrl);
      } else if (operation === 'extract/markdown') {
        const page = await browserProvider.getPageContent(safeUrl, 20000);
        outputData = extractCleanMarkdown(page.html, safeUrl);
      } else if (operation === 'extract/json') {
        const page = await browserProvider.getPageContent(safeUrl, 25000);
        const extracted = await extractionProvider.extract({
          url: safeUrl,
          html: page.html,
          schema: options?.schema || {},
          prompt: options?.prompt,
        });
        outputData = extracted.data;
      } else {
        throw new Error(`Unsupported batch operation: ${operation}`);
      }

      results.push({
        url: targetUrl,
        success: true,
        data: outputData,
      });
      completedCount++;
    } catch (err: any) {
      console.error(`[Worker] Failed item ${targetUrl} in job ${job_id}:`, err.message);
      results.push({
        url: targetUrl,
        success: false,
        error: err.message,
      });
      failedCount++;
    }
  }

  // If job was cancelled mid-flight, do not overwrite status with completed/failed
  const finalCheck = await prisma.job.findUnique({
    where: { id: job_id },
    select: { status: true },
  }).catch(() => null);

  if (finalCheck?.status === 'cancelled') {
    return;
  }

  const finalStatus = failedCount === urls.length ? 'failed' : 'completed';

  await prisma.job.update({
    where: { id: job_id },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      output: JSON.stringify({
        total: urls.length,
        completed: completedCount,
        failed: failedCount,
        results,
      }),
    },
  }).catch((e) => {
    console.error(`Error completing job ${job_id}:`, e);
    return null;
  });

  console.log(`[Worker] Finished batch job ${job_id}: ${completedCount} completed, ${failedCount} failed.`);

  // Trigger webhooks
  const webhookEvent = finalStatus === 'completed' ? 'job.completed' : 'job.failed';
  const webhookPayload = {
    event: webhookEvent,
    event_id: `evt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    job_id,
    request_id: `req_${job_id}`,
    timestamp: new Date().toISOString(),
    data: {
      operation,
      total: urls.length,
      completed: completedCount,
      failed: failedCount,
      results,
    },
  };

  // 1. Send to custom webhook_url from batch request if provided
  if (webhook_url) {
    await deliverWebhook(webhook_url, 'whsec_batch_default_secret', webhookPayload);
  }

  // 2. Send to all registered workspace webhooks
  const registeredWebhooks = await prisma.webhook.findMany({
    where: { workspaceId: workspace_id, active: true },
  });

  for (const wh of registeredWebhooks) {
    if (wh.events.includes(webhookEvent)) {
      await deliverWebhook(wh.url, wh.secretHash, webhookPayload, wh.id);
    }
  }
}

async function startWorker() {
  const queueProvider = getQueueProvider();

  await queueProvider.processJobs('batch', async (job) => {
    await processBatchJob(job);
  });

  console.log('🚀 Queue listener active. Waiting for jobs...');

  // Periodic cleanup every hour
  const cleanupInterval = setInterval(async () => {
    try {
      console.log('[Worker] Running scheduled file and job cleanup...');
      const storage = getStorageProvider();
      const cleaned = await storage.cleanupExpired();
      console.log(`[Worker] Cleaned ${cleaned} expired files.`);
    } catch (err) {
      console.error('[Worker] Cleanup error:', err);
    }
  }, 60 * 60 * 1000);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}. Draining queue and shutting down gracefully...`);
    clearInterval(cleanupInterval);
    try {
      const browser = getBrowserProvider();
      await browser.close();
      await prisma.$disconnect();
    } catch (e) {
      console.error('[Worker] Error during shutdown:', e);
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startWorker().catch((err) => {
  console.error('Fatal worker error:', err);
});

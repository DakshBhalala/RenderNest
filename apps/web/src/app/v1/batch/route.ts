import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { getQueueProvider } from '@rendernest/providers';
import { prisma } from '@rendernest/database';
import { batchSchema } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'batch',
  schema: batchSchema,
  handler: async (input, ctx) => {
    // Validate all URLs in batch
    const validatedUrls: string[] = [];
    for (const u of input.urls) {
      const safe = await UrlSafetyService.validateUrl(u);
      validatedUrls.push(safe);
    }

    // Create Job in database
    const job = await prisma.job.create({
      data: {
        workspaceId: ctx.workspaceId,
        operation: input.operation,
        input: JSON.stringify({
          operation: input.operation,
          urls: validatedUrls,
          options: input.options,
          webhook_url: input.webhook_url,
        }),
        status: 'queued',
      },
    });

    // Enqueue job for background processing
    const queue = getQueueProvider();
    await queue.addJob(
      'batch',
      `batch_${job.id}`,
      {
        job_id: job.id,
        workspace_id: ctx.workspaceId,
        operation: input.operation,
        urls: validatedUrls,
        options: input.options,
        webhook_url: input.webhook_url,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    );

    return {
      job_id: job.id,
      status: 'queued',
      items_count: validatedUrls.length,
      poll_url: `/v1/jobs/${job.id}`,
    };
  },
});

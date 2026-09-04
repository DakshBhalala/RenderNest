import { createApiHandler } from '@/lib/api-middleware';
import { getStorageProvider, ExecutionPlanner } from '@rendernest/providers';
import { processUnifiedSchema, ProcessUnifiedInput } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'process',
  schema: processUnifiedSchema,
  handler: async (input: ProcessUnifiedInput, ctx) => {
    const storage = getStorageProvider();

    const planResult = await ExecutionPlanner.execute({
      url: input.input.url,
      operations: input.operations as any,
      timeoutMs: input.timeout_ms,
      storageProvider: storage,
      workspaceId: ctx.workspaceId,
      requestId: ctx.requestId,
    });

    return planResult;
  },
});

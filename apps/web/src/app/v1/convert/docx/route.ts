import { createApiHandler } from '@/lib/api-middleware';
import { getDocxConverter, getStorageProvider } from '@rendernest/providers';
import { convertDocxSchema, ConvertResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'convert/docx',
  schema: convertDocxSchema,
  handler: async (input, ctx): Promise<ConvertResult> => {
    const converter = getDocxConverter();
    const storage = getStorageProvider();

    const buffer = await converter.convert(input);

    const fileKey = `converted/${ctx.workspaceId}/${ctx.requestId}.docx`;
    const stored = await storage.put(fileKey, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      expiresInSeconds: 86400 * 7,
    });

    return {
      file_url: stored.url,
      format: 'docx',
      file_size_bytes: stored.size,
    };
  },
});

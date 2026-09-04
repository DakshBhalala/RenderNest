import { createApiHandler } from '@/lib/api-middleware';
import { getPdfConverter, getStorageProvider } from '@rendernest/providers';
import { convertPdfSchema, ConvertResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'convert/pdf',
  schema: convertPdfSchema,
  handler: async (input, ctx): Promise<ConvertResult> => {
    const converter = getPdfConverter();
    const storage = getStorageProvider();

    const buffer = await converter.convert(input);

    const fileKey = `converted/${ctx.workspaceId}/${ctx.requestId}.pdf`;
    const stored = await storage.put(fileKey, buffer, {
      contentType: 'application/pdf',
      expiresInSeconds: 86400 * 7,
    });

    return {
      file_url: stored.url,
      format: 'pdf',
      file_size_bytes: stored.size,
    };
  },
});

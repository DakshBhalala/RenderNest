import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { getBrowserProvider, getStorageProvider } from '@rendernest/providers';
import { renderPdfSchema, RenderPdfResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'render/pdf',
  schema: renderPdfSchema,
  handler: async (input, ctx): Promise<RenderPdfResult> => {
    let safeUrl = input.url;
    if (safeUrl) {
      safeUrl = await UrlSafetyService.validateUrl(safeUrl);
    }

    const browser = getBrowserProvider();
    const storage = getStorageProvider();

    const pdf = await browser.pdf({
      ...input,
      url: safeUrl,
    });

    const fileKey = `pdfs/${ctx.workspaceId}/${ctx.requestId}.pdf`;
    const stored = await storage.put(fileKey, pdf.buffer, {
      contentType: 'application/pdf',
      expiresInSeconds: 86400 * 7,
    });

    return {
      url: safeUrl,
      file_url: stored.url,
      format: input.format || 'A4',
      file_size_bytes: stored.size,
    };
  },
});

import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { getBrowserProvider, extractCleanText } from '@rendernest/providers';
import { extractTextSchema, ExtractTextResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'extract/text',
  schema: extractTextSchema,
  handler: async (input): Promise<ExtractTextResult> => {
    const safeUrl = await UrlSafetyService.validateUrl(input.url);

    const browser = getBrowserProvider();
    const page = await browser.getPageContent(safeUrl, input.timeout_ms || 20000);

    return extractCleanText(page.html, safeUrl);
  },
});

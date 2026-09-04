import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { getBrowserProvider, extractCleanMarkdown } from '@rendernest/providers';
import { extractMarkdownSchema, ExtractMarkdownResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'extract/markdown',
  schema: extractMarkdownSchema,
  handler: async (input): Promise<ExtractMarkdownResult> => {
    const safeUrl = await UrlSafetyService.validateUrl(input.url);

    const browser = getBrowserProvider();
    const page = await browser.getPageContent(safeUrl, input.timeout_ms || 20000);

    return extractCleanMarkdown(page.html, safeUrl);
  },
});

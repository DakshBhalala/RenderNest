import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { inspectPage } from '@/lib/services/inspect.service';
import { analyzePage } from '@/lib/services/analyze.service';
import { getBrowserProvider } from '@rendernest/providers';
import { analyzeSchema, AnalyzeResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'analyze',
  schema: analyzeSchema,
  handler: async (input): Promise<AnalyzeResult> => {
    const safeUrl = await UrlSafetyService.validateUrl(input.url);

    const browser = getBrowserProvider();
    const page = await browser.getPageContent(safeUrl, input.timeout_ms || 25000);

    const inspected = inspectPage({
      html: page.html,
      url: input.url,
      finalUrl: page.finalUrl,
      statusCode: page.statusCode,
      loadTimeMs: page.loadTimeMs,
    });

    return analyzePage(inspected);
  },
});

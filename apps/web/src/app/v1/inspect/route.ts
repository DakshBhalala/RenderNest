import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { inspectPage } from '@/lib/services/inspect.service';
import { getBrowserProvider } from '@rendernest/providers';
import { inspectSchema, InspectResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'inspect',
  schema: inspectSchema,
  handler: async (input): Promise<InspectResult> => {
    const safeUrl = await UrlSafetyService.validateUrl(input.url);

    const browser = getBrowserProvider();
    const page = await browser.getPageContent(safeUrl, input.timeout_ms || 20000);

    return inspectPage({
      html: page.html,
      url: input.url,
      finalUrl: page.finalUrl,
      statusCode: page.statusCode,
      loadTimeMs: page.loadTimeMs,
    });
  },
});

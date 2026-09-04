import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { getBrowserProvider, getExtractionProvider } from '@rendernest/providers';
import { extractJsonSchema, ExtractJsonResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'extract/json',
  schema: extractJsonSchema,
  handler: async (input): Promise<ExtractJsonResult> => {
    const safeUrl = await UrlSafetyService.validateUrl(input.url);

    const browser = getBrowserProvider();
    const page = await browser.getPageContent(safeUrl, input.timeout_ms || 25000);

    const extractor = getExtractionProvider();
    const result = await extractor.extract({
      url: safeUrl,
      html: page.html,
      schema: input.schema,
      prompt: input.prompt,
    });

    return {
      url: safeUrl,
      extracted_data: result.data,
      schema_valid: result.schemaValid,
      model_used: result.modelUsed,
    };
  },
});

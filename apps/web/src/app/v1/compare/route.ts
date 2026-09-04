import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { getBrowserProvider, getStorageProvider, comparePngBuffers } from '@rendernest/providers';
import { compareSchema, CompareResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'compare',
  schema: compareSchema,
  handler: async (input, ctx): Promise<CompareResult> => {
    const safeUrlA = await UrlSafetyService.validateUrl(input.url_a);
    const safeUrlB = await UrlSafetyService.validateUrl(input.url_b);

    const browser = getBrowserProvider();
    const storage = getStorageProvider();
    const width = input.width || 1280;
    const height = input.height || 800;

    // Render both pages
    const [shotA, shotB] = await Promise.all([
      browser.screenshot({
        url: safeUrlA,
        format: 'png',
        width,
        height,
        full_page: false,
      }),
      browser.screenshot({
        url: safeUrlB,
        format: 'png',
        width,
        height,
        full_page: false,
      }),
    ]);

    const comp = await comparePngBuffers(shotA.buffer, shotB.buffer, input.tolerance || 0.1);

    // Save screenshots and diff
    const [storedA, storedB, storedDiff] = await Promise.all([
      storage.put(`compare/${ctx.workspaceId}/${ctx.requestId}_a.png`, shotA.buffer, {
        contentType: 'image/png',
        expiresInSeconds: 86400 * 7,
      }),
      storage.put(`compare/${ctx.workspaceId}/${ctx.requestId}_b.png`, shotB.buffer, {
        contentType: 'image/png',
        expiresInSeconds: 86400 * 7,
      }),
      storage.put(`compare/${ctx.workspaceId}/${ctx.requestId}_diff.png`, comp.diffBuffer, {
        contentType: 'image/png',
        expiresInSeconds: 86400 * 7,
      }),
    ]);

    return {
      url_a: safeUrlA,
      url_b: safeUrlB,
      similarity: comp.similarity,
      changed: comp.changed,
      difference_percentage: comp.diffPercentage,
      difference_image_url: storedDiff.url,
      screenshot_a_url: storedA.url,
      screenshot_b_url: storedB.url,
    };
  },
});

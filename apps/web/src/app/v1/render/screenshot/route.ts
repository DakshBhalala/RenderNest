import { createApiHandler } from '@/lib/api-middleware';
import { UrlSafetyService } from '@/lib/security/url-safety';
import { getBrowserProvider, getStorageProvider } from '@rendernest/providers';
import { renderScreenshotSchema, RenderScreenshotResult } from '@rendernest/shared';

export const POST = createApiHandler({
  operation: 'render/screenshot',
  schema: renderScreenshotSchema,
  handler: async (input, ctx): Promise<RenderScreenshotResult> => {
    // SSRF validation
    const safeUrl = await UrlSafetyService.validateUrl(input.url);

    const browser = getBrowserProvider();
    const storage = getStorageProvider();

    const shot = await browser.screenshot({
      ...input,
      url: safeUrl,
    });

    const fileKey = `screenshots/${ctx.workspaceId}/${ctx.requestId}.${shot.format}`;
    const stored = await storage.put(fileKey, shot.buffer, {
      contentType: `image/${shot.format}`,
      expiresInSeconds: 86400 * 7, // 7 days retention
    });

    return {
      url: safeUrl,
      format: shot.format,
      file_url: stored.url,
      width: shot.width,
      height: shot.height,
      file_size_bytes: stored.size,
    };
  },
});

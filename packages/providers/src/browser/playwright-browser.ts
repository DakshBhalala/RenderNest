import type { Browser, Page } from 'playwright';
import {
  RenderScreenshotOptions,
  RenderPdfOptions,
  ApiError,
} from '@rendernest/shared';
import {
  IBrowserProvider,
  ScreenshotResult,
  PdfResult,
  PageContentResult,
} from './browser-provider';

import { UrlSafetyService } from '../security/url-safety';

export class PlaywrightBrowserProvider implements IBrowserProvider {
  private browser: Browser | null = null;
  private isLaunching = false;

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isLaunching) {
      // Wait for launch to finish
      let attempts = 0;
      while (this.isLaunching && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }
      if (this.browser && this.browser.isConnected()) {
        return this.browser;
      }
    }

    this.isLaunching = true;
    try {
      const { chromium } = await import('playwright');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
        ],
      });
      return this.browser;
    } catch (err: any) {
      console.error('Failed to launch Playwright Chromium browser:', err);
      throw ApiError.renderFailed(
        `Failed to initialize browser engine: ${err.message || 'Chromium launch error'}. Ensure Chromium is installed via 'npx playwright install chromium'.`
      );
    } finally {
      this.isLaunching = false;
    }
  }

  public async applySecurityInterception(context: any): Promise<void> {
    await context.route('**/*', async (route: any) => {
      const request = route.request();
      const reqUrl = request.url();
      try {
        const parsed = new URL(reqUrl);
        if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') {
          return route.continue();
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return route.abort('blockedbyclient');
        }

        // Validate port
        if (parsed.port) {
          const portNum = parseInt(parsed.port, 10);
          const dangerousPorts = new Set([
            21, 22, 23, 25, 53, 69, 110, 119, 123, 135, 137, 138, 139, 143, 161, 389, 445,
            465, 514, 587, 636, 993, 995, 1080, 1433, 1521, 2049, 2181, 2375, 2376, 2379,
            3306, 3389, 5000, 5432, 5900, 6379, 7001, 8080, 8443, 8888, 9000, 9200, 9300,
            11211, 27017, 27018, 28017,
          ]);
          if (dangerousPorts.has(portNum)) {
            return route.abort('blockedbyclient');
          }
        }

        const hostname = parsed.hostname.toLowerCase();
        const isSafe = await UrlSafetyService.isHostSafe(hostname);
        if (!isSafe) {
          return route.abort('blockedbyclient');
        }

        return route.continue();
      } catch {
        return route.abort('blockedbyclient');
      }
    });
  }

  async screenshot(options: RenderScreenshotOptions): Promise<ScreenshotResult> {
    const browser = await this.getBrowser();
    const width = Math.min(3840, Math.max(320, options.width || 1440));
    const height = Math.min(2160, Math.max(240, options.height || 900));
    const format = options.format || 'png';
    const timeout = Math.min(60000, Math.max(1000, options.timeout_ms || 30000));
    const deviceScaleFactor = Math.min(3, Math.max(1, options.device_scale_factor || 1));

    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 RenderNest/1.0',
    });

    await this.applySecurityInterception(context);

    const page = await context.newPage();
    try {
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(timeout);

      await page.goto(options.url, {
        waitUntil: 'networkidle',
        timeout,
      }).catch(async () => {
        // Fallback to load if networkidle times out
        await page.goto(options.url, { waitUntil: 'load', timeout }).catch((err) => {
          throw ApiError.renderFailed(`Failed to navigate to target URL: ${err.message}`);
        });
      });

      if (options.delay_ms && options.delay_ms > 0) {
        await page.waitForTimeout(options.delay_ms);
      }

      if (options.wait_for_selector) {
        await page.waitForSelector(options.wait_for_selector, { timeout: 10000 }).catch(() => {
          // Continue if selector is not found
        });
      }

      const screenshotOptions: any = {
        type: format,
        fullPage: options.full_page ?? true,
      };

      if (format === 'jpeg') {
        screenshotOptions.quality = 90;
      }

      const buffer = await page.screenshot(screenshotOptions);

      return {
        buffer,
        format,
        width,
        height,
      };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'TimeoutError') {
        throw ApiError.timeout(`Screenshot render timed out after ${timeout}ms.`);
      }
      throw ApiError.renderFailed(`Screenshot generation failed: ${error.message}`);
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  async pdf(options: RenderPdfOptions): Promise<PdfResult> {
    const browser = await this.getBrowser();
    const timeout = options.timeout_ms || 45000;

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 RenderNest/1.0',
    });

    await this.applySecurityInterception(context);

    const page = await context.newPage();
    try {
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(timeout);

      if (options.html) {
        await page.setContent(options.html, { waitUntil: 'networkidle', timeout }).catch(async () => {
          await page.setContent(options.html!, { waitUntil: 'load', timeout });
        });
      } else if (options.url) {
        await page.goto(options.url, { waitUntil: 'networkidle', timeout }).catch(async () => {
          await page.goto(options.url!, { waitUntil: 'load', timeout });
        });
      }

      const buffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.landscape || false,
        printBackground: options.print_background ?? true,
        margin: options.margin || {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
        displayHeaderFooter: options.display_header_footer || false,
        headerTemplate: options.header_template || '<span></span>',
        footerTemplate:
          options.footer_template ||
          '<div style="font-size: 10px; width: 100%; text-align: center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });

      return { buffer };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'TimeoutError') {
        throw ApiError.timeout(`PDF render timed out after ${timeout}ms.`);
      }
      throw ApiError.renderFailed(`PDF generation failed: ${error.message}`);
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  async getPageContent(url: string, timeoutMs: number = 20000): Promise<PageContentResult> {
    const browser = await this.getBrowser();
    const startTime = Date.now();

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 RenderNest/1.0',
    });

    await this.applySecurityInterception(context);

    const page = await context.newPage();
    try {
      page.setDefaultTimeout(timeoutMs);
      page.setDefaultNavigationTimeout(timeoutMs);

      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      const statusCode = response ? response.status() : 200;
      const finalUrl = page.url();
      const title = await page.title();
      const html = await page.content();
      const loadTimeMs = Date.now() - startTime;

      return {
        html,
        statusCode,
        finalUrl,
        loadTimeMs,
        title,
      };
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        throw ApiError.timeout(`Page retrieval timed out after ${timeoutMs}ms.`);
      }
      throw ApiError.extractionFailed(`Failed to retrieve page content: ${error.message}`);
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}

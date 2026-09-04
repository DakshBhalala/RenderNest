import { getBrowserProvider } from '../index';
import { UrlSafetyService } from '../security/url-safety';
import { extractCleanMarkdown, extractCleanText } from '../extract/content-extractor';
import { ExtractionEngine } from '../extract/extraction-engine';
import { IStorageProvider } from '../storage/storage-provider';
import * as cheerio from 'cheerio';

export interface PlanOperation {
  type: 'screenshot' | 'pdf' | 'markdown' | 'text' | 'inspect' | 'analyze' | 'extract_json';
  options?: Record<string, any>;
  schema?: Record<string, any>;
}

export interface ExecutionPlanRequest {
  url?: string;
  input?: {
    url?: string;
    html?: string;
  };
  operations: PlanOperation[];
  timeoutMs?: number;
  storageProvider?: IStorageProvider;
  workspaceId?: string;
  requestId?: string;
}

export interface ExecutionPlanResult {
  success: boolean;
  url: string;
  final_url: string;
  duration_ms: number;
  shared_compute: boolean;
  executionMode: 'browser_chromium' | 'lightweight_html';
  operationsRequested: number;
  operationsCompleted: number;
  credits_consumed: number;
  results: Record<
    string,
    {
      status: 'completed' | 'failed';
      data?: any;
      error?: string;
      [key: string]: any;
    }
  >;
}

export class ExecutionPlanner {
  calculateCreditCost(operations: Array<{ type: string }>): number {
    return ExecutionPlanner.calculateCreditCost(operations);
  }

  static calculateCreditCost(operations: Array<{ type: string }>): number {
    return Math.max(1, 1 + operations.length);
  }

  requiresChromium(operations: Array<{ type: string }>): boolean {
    return ExecutionPlanner.requiresChromium(operations);
  }

  static requiresChromium(operations: Array<{ type: string }>): boolean {
    return operations.some((op) => op.type === 'screenshot' || op.type === 'pdf');
  }

  async execute(request: ExecutionPlanRequest): Promise<ExecutionPlanResult> {
    return ExecutionPlanner.execute(request);
  }

  /**
   * Orchestrates the Unified Processing Graph.
   * Uses single-pass lightweight HTML evaluation where possible, or ONE isolated browser context
   * for visual operations, fanning out all requested operations concurrently without duplicate work.
   */
  static async execute(request: ExecutionPlanRequest): Promise<ExecutionPlanResult> {
    const startTime = Date.now();
    const targetUrl = request.url || request.input?.url || 'https://internal.local';
    const inputHtml = request.input?.html;
    const { operations, storageProvider, workspaceId = 'ws_default', requestId = `req_${Date.now()}` } = request;
    const timeout = Math.min(120000, Math.max(1000, request.timeoutMs || 60000));

    const needsChromium = this.requiresChromium(operations);
    const results: Record<string, { status: 'completed' | 'failed'; data?: any; error?: string; [key: string]: any }> = {};

    let finalUrl = targetUrl;
    let html = inputHtml || '';
    let executionMode: 'browser_chromium' | 'lightweight_html' = 'lightweight_html';

    if (needsChromium || (!inputHtml && targetUrl.startsWith('http'))) {
      executionMode = 'browser_chromium';
      // Validate URL safety
      const safeUrl = await UrlSafetyService.validateUrl(targetUrl);
      finalUrl = safeUrl;

      const browser = getBrowserProvider();
      const rawBrowser = await (browser as any).getBrowser();

      const context = await rawBrowser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 RenderNest/2.0',
      });

      if (typeof (browser as any).applySecurityInterception === 'function') {
        await (browser as any).applySecurityInterception(context);
      }

      const page = await context.newPage();

      try {
        page.setDefaultTimeout(timeout);
        page.setDefaultNavigationTimeout(timeout);

        if (inputHtml && !targetUrl.startsWith('http')) {
          await page.setContent(inputHtml, { waitUntil: 'domcontentloaded' });
        } else {
          // Single network navigation
          await page.goto(safeUrl, { waitUntil: 'domcontentloaded', timeout });
          finalUrl = page.url();
        }

        html = await page.content();

        // Check if screenshot is requested
        const screenshotOp = operations.find((op) => op.type === 'screenshot');
        if (screenshotOp) {
          try {
            const fullPage = screenshotOp.options?.full_page !== false;
            const format = screenshotOp.options?.format || 'png';
            const buffer = await page.screenshot({ fullPage, type: format });

            let fileUrl = '';
            if (storageProvider) {
              const key = `screenshots/${workspaceId}/${requestId}.png`;
              const putRes = await storageProvider.put(key, buffer, {
                contentType: `image/${format}`,
                expiresInSeconds: 86400 * 7,
              });
              fileUrl = putRes.url;
            }

            results['screenshot'] = {
              status: 'completed',
              data: {
                file_url: fileUrl,
                size_bytes: buffer.length,
                format,
              },
            };
          } catch (err: any) {
            results['screenshot'] = { status: 'failed', error: err.message };
          }
        }

        // Check if PDF is requested
        const pdfOp = operations.find((op) => op.type === 'pdf');
        if (pdfOp) {
          try {
            const buffer = await page.pdf({
              format: 'A4',
              printBackground: true,
              margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
            });

            let fileUrl = '';
            if (storageProvider) {
              const key = `pdf/${workspaceId}/${requestId}.pdf`;
              const putRes = await storageProvider.put(key, buffer, {
                contentType: 'application/pdf',
                expiresInSeconds: 86400 * 7,
              });
              fileUrl = putRes.url;
            }

            results['pdf'] = {
              status: 'completed',
              data: {
                file_url: fileUrl,
                size_bytes: buffer.length,
              },
            };
          } catch (err: any) {
            results['pdf'] = { status: 'failed', error: err.message };
          }
        }
      } finally {
        await page.close().catch(() => {});
        await context.close().catch(() => {});
      }
    }

    // Process all non-visual operations (markdown, text, inspect, analyze, extract_json) from the shared HTML
    for (const op of operations) {
      if (op.type === 'screenshot' || op.type === 'pdf') continue;

      try {
        if (op.type === 'markdown') {
          const mdRes = extractCleanMarkdown(html, finalUrl);
          results['markdown'] = {
            status: 'completed',
            markdown: mdRes.markdown,
            data: mdRes,
          };
        } else if (op.type === 'text') {
          const textRes = extractCleanText(html);
          results['text'] = {
            status: 'completed',
            text: textRes.text,
            data: textRes,
          };
        } else if (op.type === 'inspect') {
          const $ = cheerio.load(html);
          const title = $('title').first().text().trim() || $('h1').first().text().trim();
          const description = $('meta[name="description"]').attr('content') || '';
          const ogTitle = $('meta[property="og:title"]').attr('content') || '';

          results['inspect'] = {
            status: 'completed',
            data: {
              metadata: {
                title: title || ogTitle,
                description,
              },
              title: title || ogTitle,
              description,
              status_code: 200,
              headings_count: $('h1, h2, h3').length,
              links_count: $('a[href]').length,
            },
          };
        } else if (op.type === 'analyze') {
          const $ = cheerio.load(html);
          const hasH1 = $('h1').length > 0;
          const hasMetaDesc = !!$('meta[name="description"]').attr('content');
          const hasTitle = $('title').length > 0;
          let score = 50;
          if (hasH1) score += 20;
          if (hasMetaDesc) score += 15;
          if (hasTitle) score += 15;

          results['analyze'] = {
            status: 'completed',
            data: {
              score,
              has_h1: hasH1,
              has_meta_description: hasMetaDesc,
              has_title: hasTitle,
            },
          };
        } else if (op.type === 'extract_json') {
          const schema = op.schema || {};
          const extracted = ExtractionEngine.extract(html, schema);
          results['extract_json'] = {
            status: 'completed',
            data: extracted.data,
            extracted_data: extracted.data,
            confidence: extracted.confidence,
            source: extracted.source,
          };
        }
      } catch (opErr: any) {
        results[op.type] = { status: 'failed', error: opErr.message };
      }
    }

    const completedCount = Object.values(results).filter((r) => r.status === 'completed').length;
    const creditsConsumed = this.calculateCreditCost(operations);

    return {
      success: true,
      url: targetUrl,
      final_url: finalUrl,
      duration_ms: Date.now() - startTime,
      shared_compute: true,
      executionMode,
      operationsRequested: operations.length,
      operationsCompleted: completedCount,
      credits_consumed: creditsConsumed,
      results,
    };
  }
}

import { RenderScreenshotOptions, RenderPdfOptions } from '@rendernest/shared';

export interface ScreenshotResult {
  buffer: Buffer;
  format: 'png' | 'jpeg' | 'webp';
  width: number;
  height: number;
}

export interface PdfResult {
  buffer: Buffer;
}

export interface PageContentResult {
  html: string;
  statusCode: number;
  finalUrl: string;
  loadTimeMs: number;
  title: string;
}

export interface IBrowserProvider {
  screenshot(options: RenderScreenshotOptions): Promise<ScreenshotResult>;
  pdf(options: RenderPdfOptions): Promise<PdfResult>;
  getPageContent(url: string, timeoutMs?: number): Promise<PageContentResult>;
  close(): Promise<void>;
}

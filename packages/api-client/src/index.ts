import {
  RenderScreenshotOptions,
  RenderScreenshotResult,
  RenderPdfOptions,
  RenderPdfResult,
  ExtractTextOptions,
  ExtractTextResult,
  ExtractMarkdownOptions,
  ExtractMarkdownResult,
  ExtractJsonOptions,
  ExtractJsonResult,
  InspectOptions,
  InspectResult,
  AnalyzeOptions,
  AnalyzeResult,
  CompareOptions,
  CompareResult,
  ConvertPdfOptions,
  ConvertDocxOptions,
  ConvertResult,
  BatchOptions,
  ApiSuccessResponse,
} from '@rendernest/shared';

export interface RenderNestClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class RenderNest {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(options: RenderNestClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api-rendernest.duckdns.org').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs || 45000;
  }

  private async request<T>(endpoint: string, body?: any, method = 'POST'): Promise<ApiSuccessResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'RenderNest-NodeSDK/1.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || `RenderNest API error: HTTP ${res.status}`);
      }

      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  public render = {
    screenshot: (options: RenderScreenshotOptions) =>
      this.request<RenderScreenshotResult>('/v1/render/screenshot', options),
    pdf: (options: RenderPdfOptions) =>
      this.request<RenderPdfResult>('/v1/render/pdf', options),
  };

  public extract = {
    text: (options: ExtractTextOptions) =>
      this.request<ExtractTextResult>('/v1/extract/text', options),
    markdown: (options: ExtractMarkdownOptions) =>
      this.request<ExtractMarkdownResult>('/v1/extract/markdown', options),
    json: (options: ExtractJsonOptions) =>
      this.request<ExtractJsonResult>('/v1/extract/json', options),
  };

  public inspect = (options: InspectOptions) =>
    this.request<InspectResult>('/v1/inspect', options);

  public analyze = (options: AnalyzeOptions) =>
    this.request<AnalyzeResult>('/v1/analyze', options);

  public compare = (options: CompareOptions) =>
    this.request<CompareResult>('/v1/compare', options);

  public convert = {
    pdf: (options: ConvertPdfOptions) =>
      this.request<ConvertResult>('/v1/convert/pdf', options),
    docx: (options: ConvertDocxOptions) =>
      this.request<ConvertResult>('/v1/convert/docx', options),
  };

  public batch = (options: BatchOptions) =>
    this.request<{ job_id: string; status: string; items_count: number; poll_url: string }>(
      '/v1/batch',
      options
    );

  public getJob = (jobId: string) =>
    this.request<any>(`/v1/jobs/${jobId}`, undefined, 'GET');
}

export default RenderNest;

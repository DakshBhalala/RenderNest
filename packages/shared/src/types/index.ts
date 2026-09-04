import { ErrorCode } from '../constants';

export interface ApiSuccessResponse<T = any> {
  success: true;
  request_id: string;
  data: T;
}

export interface ApiErrorDetail {
  code: ErrorCode | string;
  message: string;
  details?: any;
}

export interface ApiErrorResponse {
  success: false;
  request_id: string;
  error: ApiErrorDetail;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Render Screenshot
export interface RenderScreenshotOptions {
  url: string;
  format?: 'png' | 'jpeg' | 'webp';
  full_page?: boolean;
  width?: number;
  height?: number;
  device_scale_factor?: number;
  delay_ms?: number;
  wait_for_selector?: string;
  timeout_ms?: number;
}

export interface RenderScreenshotResult {
  url: string;
  format: 'png' | 'jpeg' | 'webp';
  file_url: string;
  width: number;
  height: number;
  file_size_bytes: number;
}

// Render PDF
export interface RenderPdfOptions {
  url?: string;
  html?: string;
  format?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'A3' | 'A5';
  landscape?: boolean;
  print_background?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  display_header_footer?: boolean;
  header_template?: string;
  footer_template?: string;
  timeout_ms?: number;
}

export interface RenderPdfResult {
  url?: string;
  file_url: string;
  format: string;
  pages_count?: number;
  file_size_bytes: number;
}

// Extract Text
export interface ExtractTextOptions {
  url: string;
  timeout_ms?: number;
}

export interface ExtractTextResult {
  url: string;
  title: string;
  text: string;
  word_count: number;
  reading_time_minutes: number;
}

// Extract Markdown
export interface ExtractMarkdownOptions {
  url: string;
  timeout_ms?: number;
}

export interface ExtractMarkdownResult {
  url: string;
  title: string;
  description?: string;
  markdown: string;
  word_count: number;
  links_count: number;
  images_count: number;
}

// Extract Structured JSON
export interface ExtractJsonOptions {
  url: string;
  schema: Record<string, 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | any>;
  prompt?: string;
  timeout_ms?: number;
}

export interface ExtractJsonResult {
  url: string;
  extracted_data: Record<string, any>;
  schema_valid: boolean;
  model_used?: string;
}

// Inspect
export interface InspectOptions {
  url: string;
  timeout_ms?: number;
}

export interface InspectHeading {
  level: number;
  text: string;
}

export interface InspectLink {
  href: string;
  text: string;
  is_external: boolean;
}

export interface InspectImage {
  src: string;
  alt: string;
  has_alt: boolean;
}

export interface InspectResult {
  url: string;
  final_url: string;
  status_code: number;
  title: string;
  description: string;
  language: string;
  canonical: string;
  favicon: string;
  open_graph: Record<string, string>;
  twitter_card: Record<string, string>;
  json_ld: any[];
  headings: InspectHeading[];
  links: InspectLink[];
  images: InspectImage[];
  content: {
    word_count: number;
    paragraphs_count: number;
  };
  technical: {
    load_time_ms: number;
    content_type?: string;
    server?: string;
  };
}

// Analyze
export interface AnalyzeOptions {
  url: string;
  timeout_ms?: number;
}

export interface AuditIssue {
  severity: 'error' | 'warning' | 'notice';
  category: 'seo' | 'accessibility' | 'social' | 'performance' | 'security';
  message: string;
  recommendation: string;
}

export interface AnalyzeResult {
  url: string;
  score: number; // 0 to 100
  metrics: {
    seo_score: number;
    social_score: number;
    accessibility_score: number;
    content_score: number;
  };
  checks: {
    title: { valid: boolean; length: number; message: string };
    description: { valid: boolean; length: number; message: string };
    h1: { valid: boolean; count: number; message: string };
    canonical: { valid: boolean; url: string; message: string };
    open_graph: { valid: boolean; keys_found: string[]; message: string };
    twitter_card: { valid: boolean; card_type: string; message: string };
    json_ld: { valid: boolean; types: string[]; message: string };
    images_alt: { total: number; missing: number; ratio: number; message: string };
    links: { internal: number; external: number; broken_estimate?: number };
  };
  issues: AuditIssue[];
}

// Compare
export interface CompareOptions {
  url_a: string;
  url_b: string;
  width?: number;
  height?: number;
  tolerance?: number; // 0 to 1
  timeout_ms?: number;
}

export interface CompareResult {
  url_a: string;
  url_b: string;
  similarity: number; // 0.0 to 1.0 (e.g. 0.985)
  changed: boolean;
  difference_percentage: number;
  difference_image_url: string;
  screenshot_a_url: string;
  screenshot_b_url: string;
}

// Convert
export interface ConvertPdfOptions {
  html?: string;
  markdown?: string;
  title?: string;
  format?: 'A4' | 'Letter';
  landscape?: boolean;
}

export interface ConvertDocxOptions {
  html?: string;
  markdown?: string;
  title?: string;
}

export interface ConvertResult {
  file_url: string;
  format: 'pdf' | 'docx';
  file_size_bytes: number;
}

// Batch
export interface BatchOptions {
  operation: string;
  urls: string[];
  options?: Record<string, any>;
  webhook_url?: string;
}

export interface BatchJobOutputItem {
  url: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface BatchJobData {
  job_id: string;
  workspace_id: string;
  operation: string;
  urls: string[];
  options?: Record<string, any>;
  webhook_url?: string;
  results?: BatchJobOutputItem[];
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

export interface JobRecord {
  id: string;
  workspaceId: string;
  operation: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  input: any;
  output?: any;
  errorMessage?: string;
  retryCount: number;
  startedAt?: Date | string;
  completedAt?: Date | string;
  createdAt: Date | string;
}

export interface WebhookPayload {
  event: 'job.completed' | 'job.failed';
  job_id: string;
  request_id: string;
  timestamp: string;
  data: any;
}

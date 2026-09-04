export const ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  INVALID_URL: 'INVALID_URL',
  URL_BLOCKED: 'URL_BLOCKED',
  TIMEOUT: 'TIMEOUT',
  RENDER_FAILED: 'RENDER_FAILED',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const WORKLOAD_CLASSES = {
  LIGHT: 'LIGHT',
  MEDIUM: 'MEDIUM',
  HEAVY: 'HEAVY',
} as const;

export type WorkloadClass = (typeof WORKLOAD_CLASSES)[keyof typeof WORKLOAD_CLASSES];

export const OPERATION_WORKLOAD_CLASSES: Record<string, WorkloadClass> = {
  inspect: 'LIGHT',
  markdown: 'LIGHT',
  text: 'LIGHT',
  analyze: 'LIGHT',
  screenshot: 'MEDIUM',
  pdf: 'MEDIUM',
  docx: 'MEDIUM',
  compare: 'MEDIUM',
  extract_json: 'HEAVY',
  process: 'HEAVY',
};

export interface OperationDefinition {
  name: string;
  operation: string;
  credits: number;
  timeoutMs: number;
  queue: string;
  enabled: boolean;
  description: string;
  workloadClass?: WorkloadClass;
}

export const OPERATIONS: Record<string, OperationDefinition> = {
  'process': {
    name: 'Unified Composite Processing',
    operation: 'process',
    credits: 0,
    timeoutMs: 60000,
    queue: 'render',
    enabled: true,
    description: 'Execute multiple operations on a single page load with shared compute.',
    workloadClass: 'MEDIUM',
  },
  'render/screenshot': {
    name: 'Screenshot Rendering',
    operation: 'render/screenshot',
    credits: 1,
    timeoutMs: 30000,
    queue: 'render',
    enabled: true,
    description: 'Capture full-page or viewport screenshots in PNG, JPEG, or WEBP.',
  },
  'render/pdf': {
    name: 'PDF Rendering',
    operation: 'render/pdf',
    credits: 3,
    timeoutMs: 45000,
    queue: 'render',
    enabled: true,
    description: 'Render web pages or raw HTML into high-fidelity PDF documents.',
  },
  'extract/text': {
    name: 'Clean Text Extraction',
    operation: 'extract/text',
    credits: 2,
    timeoutMs: 20000,
    queue: 'extract',
    enabled: true,
    description: 'Strip boilerplate and ads to extract clean article or page text.',
  },
  'extract/markdown': {
    name: 'Markdown Extraction',
    operation: 'extract/markdown',
    credits: 2,
    timeoutMs: 20000,
    queue: 'extract',
    enabled: true,
    description: 'Convert web content to clean, semantic GitHub-flavored Markdown.',
  },
  'extract/json': {
    name: 'Structured JSON Extraction',
    operation: 'extract/json',
    credits: 5,
    timeoutMs: 35000,
    queue: 'extract',
    enabled: true,
    description: 'Extract typed JSON matching arbitrary user-provided schemas.',
  },
  'inspect': {
    name: 'Page Inspection',
    operation: 'inspect',
    credits: 1,
    timeoutMs: 20000,
    queue: 'inspect',
    enabled: true,
    description: 'Inspect metadata, OpenGraph, JSON-LD, headings, links, and structure.',
  },
  'analyze': {
    name: 'Page Analysis & SEO',
    operation: 'analyze',
    credits: 3,
    timeoutMs: 25000,
    queue: 'analyze',
    enabled: true,
    description: 'In-depth SEO, accessibility, social cards, and structural quality analysis.',
  },
  'compare': {
    name: 'Visual Comparison',
    operation: 'compare',
    credits: 5,
    timeoutMs: 45000,
    queue: 'compare',
    enabled: true,
    description: 'Pixel-level visual comparison between two web pages with diff overlay.',
  },
  'convert/pdf': {
    name: 'HTML/Markdown to PDF',
    operation: 'convert/pdf',
    credits: 3,
    timeoutMs: 30000,
    queue: 'convert',
    enabled: true,
    description: 'Convert raw HTML or Markdown strings into formatted PDF documents.',
  },
  'convert/docx': {
    name: 'HTML/Markdown to DOCX',
    operation: 'convert/docx',
    credits: 5,
    timeoutMs: 30000,
    queue: 'convert',
    enabled: true,
    description: 'Convert raw HTML or Markdown strings into Microsoft Word (.docx) files.',
  },
  'batch': {
    name: 'Batch Job Processing',
    operation: 'batch',
    credits: 0, // Sum of sub-operations
    timeoutMs: 120000,
    queue: 'batch',
    enabled: true,
    description: 'Asynchronous multi-URL processing with webhook notification upon completion.',
  },
};

export interface PlanDefinition {
  id: string;
  code: 'free' | 'starter' | 'growth' | 'enterprise';
  name: string;
  monthlyCredits: number;
  rateLimitRpm: number;
  maxConcurrency: number;
  priceMonthly: number;
  description: string;
  features: string[];
}

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    id: 'plan_free',
    code: 'free',
    name: 'Free',
    monthlyCredits: 500,
    rateLimitRpm: 30,
    maxConcurrency: 2,
    priceMonthly: 0,
    description: 'Ideal for prototyping, personal projects, and sandbox experimentation.',
    features: [
      '500 credits / month',
      '30 requests / minute',
      'All 10 API endpoints',
      'Playwright Chromium rendering',
      'Community support',
    ],
  },
  starter: {
    id: 'plan_starter',
    code: 'starter',
    name: 'Starter',
    monthlyCredits: 10000,
    rateLimitRpm: 120,
    maxConcurrency: 5,
    priceMonthly: 29,
    description: 'For small production apps, background scrapers, and agents.',
    features: [
      '10,000 credits / month',
      '120 requests / minute',
      'Batch processing & webhooks',
      'Expiring signed storage URLs',
      'Email support (24h response)',
    ],
  },
  growth: {
    id: 'plan_growth',
    code: 'growth',
    name: 'Growth',
    monthlyCredits: 50000,
    rateLimitRpm: 300,
    maxConcurrency: 15,
    priceMonthly: 99,
    description: 'For fast-growing SaaS products, research pipelines, and data teams.',
    features: [
      '50,000 credits / month',
      '300 requests / minute',
      'Priority job queues',
      'Visual diff comparison engine',
      'Team members & workspaces',
      'Priority support',
    ],
  },
  enterprise: {
    id: 'plan_enterprise',
    code: 'enterprise',
    name: 'Enterprise',
    monthlyCredits: 250000,
    rateLimitRpm: 1200,
    maxConcurrency: 50,
    priceMonthly: 399,
    description: 'High-volume infrastructure with custom SLA, dedicated IP pools, and billing.',
    features: [
      '250,000+ credits / month',
      '1,200+ requests / minute',
      'Custom extraction schemas',
      'Custom proxy / IP pools',
      '99.95% uptime SLA',
      'Dedicated Slack channel',
    ],
  },
};

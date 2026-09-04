import { z } from 'zod';

export const renderScreenshotSchema = z.object({
  url: z.string().url('A valid URL with protocol http or https is required'),
  format: z.enum(['png', 'jpeg', 'webp']).default('png').optional(),
  full_page: z.boolean().default(true).optional(),
  width: z.number().int().min(320).max(3840).default(1440).optional(),
  height: z.number().int().min(240).max(2160).default(900).optional(),
  device_scale_factor: z.number().min(1).max(3).default(1).optional(),
  delay_ms: z.number().int().min(0).max(15000).default(0).optional(),
  wait_for_selector: z.string().max(200).optional(),
  timeout_ms: z.number().int().min(1000).max(60000).default(30000).optional(),
});

export const renderPdfSchema = z.object({
  url: z.string().url('Valid URL required').optional(),
  html: z.string().max(5000000, 'HTML payload must not exceed 5MB').optional(),
  format: z.enum(['A4', 'Letter', 'Legal', 'Tabloid', 'A3', 'A5']).default('A4').optional(),
  landscape: z.boolean().default(false).optional(),
  print_background: z.boolean().default(true).optional(),
  margin: z
    .object({
      top: z.string().optional(),
      right: z.string().optional(),
      bottom: z.string().optional(),
      left: z.string().optional(),
    })
    .optional(),
  display_header_footer: z.boolean().default(false).optional(),
  header_template: z.string().max(5000).optional(),
  footer_template: z.string().max(5000).optional(),
  timeout_ms: z.number().int().min(1000).max(60000).default(45000).optional(),
}).refine((data) => !!data.url || !!data.html, {
  message: 'Either url or html must be provided',
  path: ['url'],
});

export const extractTextSchema = z.object({
  url: z.string().url('A valid URL with protocol http or https is required'),
  timeout_ms: z.number().int().min(1000).max(60000).default(20000).optional(),
});

export const extractMarkdownSchema = z.object({
  url: z.string().url('A valid URL with protocol http or https is required'),
  timeout_ms: z.number().int().min(1000).max(60000).default(20000).optional(),
});

export const extractJsonSchema = z.object({
  url: z.string().url('A valid URL with protocol http or https is required'),
  schema: z.record(z.any(), {
    required_error: 'A JSON schema object defining keys and types is required',
  }),
  prompt: z.string().max(1000).optional(),
  timeout_ms: z.number().int().min(1000).max(60000).default(35000).optional(),
});

export const inspectSchema = z.object({
  url: z.string().url('A valid URL with protocol http or https is required'),
  timeout_ms: z.number().int().min(1000).max(60000).default(20000).optional(),
});

export const analyzeSchema = z.object({
  url: z.string().url('A valid URL with protocol http or https is required'),
  timeout_ms: z.number().int().min(1000).max(60000).default(25000).optional(),
});

export const compareSchema = z.object({
  url_a: z.string().url('url_a must be a valid URL'),
  url_b: z.string().url('url_b must be a valid URL'),
  width: z.number().int().min(320).max(1920).default(1280).optional(),
  height: z.number().int().min(240).max(1440).default(800).optional(),
  tolerance: z.number().min(0).max(1).default(0.1).optional(),
  timeout_ms: z.number().int().min(1000).max(60000).default(45000).optional(),
});

export const convertPdfSchema = z.object({
  html: z.string().max(5000000).optional(),
  markdown: z.string().max(2000000).optional(),
  title: z.string().max(200).default('Document').optional(),
  format: z.enum(['A4', 'Letter']).default('A4').optional(),
  landscape: z.boolean().default(false).optional(),
}).refine((data) => !!data.html || !!data.markdown, {
  message: 'Either html or markdown must be provided',
  path: ['html'],
});

export const convertDocxSchema = z.object({
  html: z.string().max(5000000).optional(),
  markdown: z.string().max(2000000).optional(),
  title: z.string().max(200).default('Document').optional(),
}).refine((data) => !!data.html || !!data.markdown, {
  message: 'Either html or markdown must be provided',
  path: ['html'],
});

export const batchSchema = z.object({
  operation: z.enum([
    'render/screenshot',
    'render/pdf',
    'extract/text',
    'extract/markdown',
    'extract/json',
    'inspect',
    'analyze',
  ]),
  urls: z.array(z.string().url()).min(1, 'At least 1 URL is required').max(100, 'Batch maximum is 100 URLs'),
  options: z.record(z.any()).optional(),
  webhook_url: z.string().url('Webhook must be a valid HTTP or HTTPS URL').optional(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
  environment: z.enum(['live', 'test']).default('live'),
});

export const webhookCreateSchema = z.object({
  url: z.string().url('Valid webhook URL required'),
  events: z.array(z.enum(['job.completed', 'job.failed'])).min(1),
});

export const processOperationSchema = z.object({
  type: z.enum([
    'screenshot',
    'pdf',
    'markdown',
    'text',
    'inspect',
    'analyze',
    'extract_json',
  ]),
  options: z.record(z.any()).optional(),
  schema: z.record(z.any()).optional(),
});

export const processUnifiedSchema = z.object({
  input: z.object({
    url: z.string().url('A valid URL with protocol http or https is required'),
  }),
  operations: z
    .array(processOperationSchema)
    .min(1, 'At least one operation is required')
    .max(10, 'Maximum 10 operations per process request'),
  timeout_ms: z.number().int().min(1000).max(120000).default(60000).optional(),
});

export type ProcessOperation = z.infer<typeof processOperationSchema>;
export type ProcessUnifiedInput = z.infer<typeof processUnifiedSchema>;


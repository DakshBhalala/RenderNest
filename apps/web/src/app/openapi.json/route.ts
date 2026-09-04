import { NextResponse } from 'next/server';

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'RenderNest API',
      version: '1.0.0',
      description:
        'One API for rendering, extracting, converting, and understanding the web. Developer-first infrastructure for screenshots, PDFs, structured extraction, Markdown, page inspection, and analysis.',
      contact: {
        name: 'RenderNest Support',
        url: 'https://rendernest.duckdns.org/docs',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
      {
        url: 'https://api-rendernest.duckdns.org',
        description: 'Production Global Edge',
      },
    ],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'wf_live_* or wf_test_*',
          description: 'Provide your workspace API key prefixed with Bearer',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            request_id: { type: 'string', example: 'req_1725432000_a1b2c3' },
            data: { type: 'object' },
          },
          required: ['success', 'request_id', 'data'],
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            request_id: { type: 'string', example: 'req_1725432000_a1b2c3' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'INVALID_URL' },
                message: { type: 'string', example: 'The provided URL is invalid.' },
                details: { type: 'object' },
              },
              required: ['code', 'message'],
            },
          },
          required: ['success', 'request_id', 'error'],
        },
      },
    },
    paths: {
      '/v1/process': {
        post: {
          summary: 'Unified Composite Processing',
          description: 'Executes multiple operations (screenshot, pdf, markdown, text, inspect, analyze, extract_json) concurrently on a single shared browser context.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    input: {
                      type: 'object',
                      properties: {
                        url: { type: 'string', format: 'uri', example: 'https://example.com' },
                      },
                      required: ['url'],
                    },
                    operations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            enum: ['screenshot', 'pdf', 'markdown', 'text', 'inspect', 'analyze', 'extract_json'],
                          },
                          options: { type: 'object' },
                          schema: { type: 'object' },
                        },
                        required: ['type'],
                      },
                    },
                    timeout_ms: { type: 'integer', default: 60000 },
                  },
                  required: ['input', 'operations'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Unified execution results returned with shared compute discount' },
            '400': { description: 'Invalid parameters or schema' },
            '401': { description: 'Invalid API key' },
            '403': { description: 'Destination blocked by SSRF policy' },
          },
        },
      },
      '/v1/render/screenshot': {
        post: {
          summary: 'Capture a page screenshot',
          description: 'Renders the target webpage using Chromium and captures a viewport or full-page screenshot.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri', example: 'https://example.com' },
                    format: { type: 'string', enum: ['png', 'jpeg', 'webp'], default: 'png' },
                    full_page: { type: 'boolean', default: true },
                    width: { type: 'integer', default: 1440 },
                    height: { type: 'integer', default: 900 },
                    device_scale_factor: { type: 'number', default: 1 },
                    delay_ms: { type: 'integer', default: 0 },
                    timeout_ms: { type: 'integer', default: 30000 },
                  },
                  required: ['url'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Screenshot generated successfully' },
            '400': { description: 'Invalid URL or parameters' },
            '401': { description: 'Invalid or missing API key' },
            '403': { description: 'Target destination blocked by SSRF policy' },
          },
        },
      },
      '/v1/render/pdf': {
        post: {
          summary: 'Render page or HTML to PDF',
          description: 'Generates a PDF document from a URL or raw HTML string with configurable margins and paper format.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri', example: 'https://example.com' },
                    html: { type: 'string', example: '<h1>Invoice #1024</h1><p>Amount: $450.00</p>' },
                    format: { type: 'string', enum: ['A4', 'Letter', 'Legal', 'Tabloid', 'A3', 'A5'], default: 'A4' },
                    landscape: { type: 'boolean', default: false },
                    print_background: { type: 'boolean', default: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'PDF generated successfully' },
          },
        },
      },
      '/v1/extract/text': {
        post: {
          summary: 'Extract clean readable text',
          description: 'Strips cookie banners, navigation, sidebars, and ads to return clean content text with word count.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri', example: 'https://example.com/article' },
                  },
                  required: ['url'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Text extracted successfully' },
          },
        },
      },
      '/v1/extract/markdown': {
        post: {
          summary: 'Extract clean GitHub-flavored Markdown',
          description: 'Converts target webpage into semantic Markdown preserving headings, lists, tables, and code blocks.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri', example: 'https://example.com' },
                  },
                  required: ['url'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Markdown extracted successfully' },
          },
        },
      },
      '/v1/extract/json': {
        post: {
          summary: 'Extract schema-governed structured JSON',
          description: 'Extracts typed JSON data conforming to user-provided schema definitions.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri', example: 'https://example.com/product/101' },
                    schema: {
                      type: 'object',
                      example: {
                        name: 'string',
                        price: 'number',
                        in_stock: 'boolean',
                        features: 'array',
                      },
                    },
                  },
                  required: ['url', 'schema'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'JSON extracted successfully' },
          },
        },
      },
      '/v1/inspect': {
        post: {
          summary: 'Inspect webpage technical metadata and structure',
          description: 'Returns titles, descriptions, OpenGraph, Twitter cards, JSON-LD, headings, links, and timing stats.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri', example: 'https://example.com' },
                  },
                  required: ['url'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Inspection completed' },
          },
        },
      },
      '/v1/analyze': {
        post: {
          summary: 'Analyze SEO, accessibility, and structural quality',
          description: 'Performs automated audits of meta tags, headings, canonicals, social cards, and accessibility hints.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', format: 'uri', example: 'https://example.com' },
                  },
                  required: ['url'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Analysis report generated' },
          },
        },
      },
      '/v1/compare': {
        post: {
          summary: 'Pixel-level visual comparison between two URLs',
          description: 'Captures both URLs and generates a visual diff overlay image along with a similarity score (0.0-1.0).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url_a: { type: 'string', format: 'uri', example: 'https://example.com/v1' },
                    url_b: { type: 'string', format: 'uri', example: 'https://example.com/v2' },
                    tolerance: { type: 'number', default: 0.1 },
                  },
                  required: ['url_a', 'url_b'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Comparison completed' },
          },
        },
      },
      '/v1/convert/pdf': {
        post: {
          summary: 'Convert HTML or Markdown to PDF',
          description: 'Direct string to PDF conversion with built-in typography engine.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    html: { type: 'string' },
                    markdown: { type: 'string' },
                    title: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Document converted to PDF' },
          },
        },
      },
      '/v1/convert/docx': {
        post: {
          summary: 'Convert HTML or Markdown to Word (.docx)',
          description: 'Direct string to Microsoft Word document conversion.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    html: { type: 'string' },
                    markdown: { type: 'string' },
                    title: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Document converted to DOCX' },
          },
        },
      },
      '/v1/batch': {
        post: {
          summary: 'Queue an asynchronous batch operation',
          description: 'Dispatches multi-URL processing in the background with optional webhook delivery upon completion.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    operation: {
                      type: 'string',
                      enum: [
                        'render/screenshot',
                        'render/pdf',
                        'extract/text',
                        'extract/markdown',
                        'extract/json',
                        'inspect',
                        'analyze',
                      ],
                    },
                    urls: { type: 'array', items: { type: 'string', format: 'uri' } },
                    webhook_url: { type: 'string', format: 'uri' },
                  },
                  required: ['operation', 'urls'],
                },
              },
            },
          },
          responses: {
            '200': { description: 'Job enqueued' },
          },
        },
      },
      '/v1/jobs/{jobId}': {
        get: {
          summary: 'Poll status and output of background job',
          parameters: [
            {
              name: 'jobId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Job details retrieved' },
            '404': { description: 'Job not found' },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

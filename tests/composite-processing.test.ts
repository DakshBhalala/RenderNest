import { describe, it, expect } from 'vitest';
import { ExecutionPlanner } from '../packages/providers/src/graph/execution-planner';
import { OPERATION_WORKLOAD_CLASSES } from '../packages/shared/src/constants';

describe('ExecutionPlanner & Unified Processing Graph', () => {
  it('should classify operations into appropriate workload classes', () => {
    expect(OPERATION_WORKLOAD_CLASSES.inspect).toBe('LIGHT');
    expect(OPERATION_WORKLOAD_CLASSES.markdown).toBe('LIGHT');
    expect(OPERATION_WORKLOAD_CLASSES.text).toBe('LIGHT');
    expect(OPERATION_WORKLOAD_CLASSES.screenshot).toBe('MEDIUM');
    expect(OPERATION_WORKLOAD_CLASSES.pdf).toBe('MEDIUM');
    expect(OPERATION_WORKLOAD_CLASSES.extract_json).toBe('HEAVY');
    expect(OPERATION_WORKLOAD_CLASSES.process).toBe('HEAVY');
  });

  it('should calculate discounted credit pricing for unified multi-operation pipelines', () => {
    const planner = new ExecutionPlanner();

    // 5 operations: screenshot(3) + pdf(2) + markdown(1) + inspect(1) + extract_json(5) = 12 credits individually
    const operations = [
      { type: 'screenshot' as const },
      { type: 'pdf' as const },
      { type: 'markdown' as const },
      { type: 'inspect' as const },
      { type: 'extract_json' as const, schema: { title: 'string' } },
    ];

    const credits = planner.calculateCreditCost(operations);
    // Base 1 + 5 ops = 6 credits (50% cheaper than 12 credits for running 5 separate loads)
    expect(credits).toBe(6);
    expect(credits).toBeLessThan(12);
  });

  it('should determine if Chromium is required for visual operations', () => {
    const planner = new ExecutionPlanner();

    const textOnlyOps = [
      { type: 'markdown' as const },
      { type: 'text' as const },
      { type: 'inspect' as const },
    ];
    expect(planner.requiresChromium(textOnlyOps)).toBe(false);

    const visualOps = [
      { type: 'markdown' as const },
      { type: 'screenshot' as const },
    ];
    expect(planner.requiresChromium(visualOps)).toBe(true);
  });

  it('should execute non-chromium multi-operation pipeline against HTML input in a single pass', async () => {
    const planner = new ExecutionPlanner();

    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>RenderNest Unified Pipeline</title>
          <meta name="description" content="One engine for all web transforms." />
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "RenderNest 2.0",
            "applicationCategory": "DeveloperApplication"
          }
          </script>
        </head>
        <body>
          <h1>RenderNest Architecture</h1>
          <p>Unified processing shares page context across all outputs.</p>
        </body>
      </html>
    `;

    const result = await planner.execute({
      input: {
        html: sampleHtml,
        url: 'https://infra.example.com',
      },
      operations: [
        { type: 'markdown' },
        { type: 'text' },
        { type: 'inspect' },
        { type: 'extract_json', schema: { name: 'string', applicationCategory: 'string' } },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.executionMode).toBe('lightweight_html');
    expect(result.operationsRequested).toBe(4);
    expect(result.operationsCompleted).toBe(4);

    // Markdown output check
    expect(result.results.markdown.status).toBe('completed');
    expect(result.results.markdown.markdown).toContain('# RenderNest Architecture');

    // Text output check
    expect(result.results.text.status).toBe('completed');
    expect(result.results.text.text).toContain('RenderNest Architecture');

    // Inspect output check
    expect(result.results.inspect.status).toBe('completed');
    expect(result.results.inspect.data.metadata.title).toBe('RenderNest Unified Pipeline');

    // JSON Extraction check
    expect(result.results.extract_json.status).toBe('completed');
    expect(result.results.extract_json.data.name).toBe('RenderNest 2.0');
  });
});

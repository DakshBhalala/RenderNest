import { describe, it, expect } from 'vitest';
import { DocxConverter } from '../packages/providers/src/convert/docx-converter';

describe('Document Conversion Engine', () => {
  it('should convert Markdown to a valid Microsoft Word DOCX buffer', async () => {
    const converter = new DocxConverter();
    const buffer = await converter.convert({
      title: 'Quarterly Infrastructure Review',
      markdown: `
# Executive Summary
The RenderNest deployment has completed with zero downtime.

## Key Accomplishments
- Implemented **Chromium** headless rendering pool
- Built *SSRF security guards*
- Set up \`BullMQ\` async batch jobs
      `,
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);
    // Standard zip signature for DOCX (PK\x03\x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
  });
});

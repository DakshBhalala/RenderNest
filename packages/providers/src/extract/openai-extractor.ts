import { IExtractionProvider, ExtractionRequest, ExtractionResult } from './extraction-provider';
import { ApiError } from '@rendernest/shared';
import * as cheerio from 'cheerio';

export class OpenAIExtractionProvider implements IExtractionProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(options?: { apiKey?: string; model?: string; baseUrl?: string }) {
    this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY || '';
    this.model = options?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.baseUrl = (options?.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  async extract(request: ExtractionRequest): Promise<ExtractionResult> {
    if (!this.apiKey) {
      throw ApiError.extractionFailed('OpenAI extraction provider is not configured with an API key.');
    }

    // Clean html slightly to save tokens
    const $ = cheerio.load(request.html);
    $('script, style, svg, noscript').remove();
    const cleanText = $('body').text().replace(/\s+/g, ' ').slice(0, 16000);

    const systemPrompt = `You are a high-precision structured data extraction engine.
Given the webpage text and URL, extract information according to the requested JSON schema.
Only return valid JSON matching the schema keys and types. Do not include markdown code fences.

Schema:
${JSON.stringify(request.schema, null, 2)}
`;

    const userPrompt = `Target URL: ${request.url}
${request.prompt ? `Custom Instruction: ${request.prompt}\n` : ''}
Content:
${cleanText}`;

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API returned status ${res.status}: ${errText}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned empty completion content.');
      }

      const extractedData = JSON.parse(content);

      return {
        data: extractedData,
        modelUsed: this.model,
        schemaValid: true,
      };
    } catch (err: any) {
      console.error('OpenAI extraction failed:', err);
      throw ApiError.extractionFailed(`AI Extraction failed: ${err.message}`);
    }
  }
}

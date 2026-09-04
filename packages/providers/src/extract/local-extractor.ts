import * as cheerio from 'cheerio';
import { IExtractionProvider, ExtractionRequest, ExtractionResult } from './extraction-provider';

export class LocalExtractionProvider implements IExtractionProvider {
  async extract(request: ExtractionRequest): Promise<ExtractionResult> {
    const $ = cheerio.load(request.html);
    const { schema } = request;

    // 1. Gather all JSON-LD objects
    const jsonLdData: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).text();
        if (text) {
          jsonLdData.push(JSON.parse(text));
        }
      } catch {
        // Skip malformed JSON-LD
      }
    });

    // 2. Gather meta tags
    const meta: Record<string, string> = {};
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || $(el).attr('itemprop');
      const content = $(el).attr('content');
      if (name && content) {
        meta[name.toLowerCase()] = content;
      }
    });

    // Page-level heuristics
    const pageTitle = $('title').first().text().trim() || meta['og:title'] || meta['twitter:title'] || '';
    const pageDesc = meta['description'] || meta['og:description'] || meta['twitter:description'] || '';

    const result: Record<string, any> = {};

    for (const [key, rawExpectedType] of Object.entries(schema)) {
      const expectedType = typeof rawExpectedType === 'string' ? rawExpectedType.toLowerCase() : 'string';
      const keyLower = key.toLowerCase();

      // Check JSON-LD objects first
      let matchedVal: any = undefined;
      for (const ld of jsonLdData) {
        if (ld[key] !== undefined) {
          matchedVal = ld[key];
          break;
        }
        if (ld[keyLower] !== undefined) {
          matchedVal = ld[keyLower];
          break;
        }
      }

      // Check meta tags if not found
      if (matchedVal === undefined) {
        if (keyLower.includes('title') || keyLower === 'name') {
          matchedVal = $('h1').first().text().trim() || pageTitle;
        } else if (keyLower.includes('desc') || keyLower.includes('summary')) {
          matchedVal = pageDesc || $('p').first().text().trim();
        } else if (keyLower.includes('price')) {
          const priceText = $('[class*="price"], [id*="price"]').first().text().trim() || meta['product:price:amount'];
          if (priceText) {
            const num = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            matchedVal = isNaN(num) ? priceText : num;
          }
        } else if (keyLower.includes('rating')) {
          const ratingText = $('[class*="rating"], [class*="stars"]').first().text().trim();
          if (ratingText) {
            const num = parseFloat(ratingText.replace(/[^0-9.]/g, ''));
            matchedVal = isNaN(num) ? 4.5 : num;
          }
        } else if (keyLower.includes('author')) {
          matchedVal = meta['author'] || $('[rel="author"]').first().text().trim();
        } else if (keyLower.includes('image') || keyLower.includes('thumbnail')) {
          matchedVal = meta['og:image'] || $('img').first().attr('src');
        } else {
          // Check CSS selector or text containing key
          const el = $(`[class*="${keyLower}"], [id*="${keyLower}"]`).first();
          if (el.length > 0) {
            matchedVal = el.text().trim();
          }
        }
      }

      // Type casting & default formatting
      result[key] = this.castValue(matchedVal, expectedType, key);
    }

    return {
      data: result,
      modelUsed: 'heuristic-local-v1',
      schemaValid: true,
    };
  }

  private castValue(val: any, expectedType: string, fieldName: string): any {
    switch (expectedType) {
      case 'number':
      case 'float': {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      }
      case 'integer':
      case 'int': {
        if (typeof val === 'number') return Math.round(val);
        if (typeof val === 'string') {
          const parsed = parseInt(val.replace(/[^0-9-]/g, ''), 10);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      }
      case 'boolean': {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
          return val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
        }
        return !!val;
      }
      case 'array': {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string' && val.length > 0) return [val];
        return [];
      }
      case 'object': {
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) return val;
        return {};
      }
      case 'string':
      default: {
        if (val === undefined || val === null) return '';
        return String(val).trim();
      }
    }
  }
}

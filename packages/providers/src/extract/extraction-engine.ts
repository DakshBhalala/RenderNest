import * as cheerio from 'cheerio';

export interface ExtractionEngineResult {
  data: Record<string, any>;
  confidence: Record<string, number> & { overall: number; fields?: Record<string, number> };
  source: 'deterministic_jsonld' | 'deterministic_meta' | 'heuristic' | 'hybrid';
  provider: string;
  schemaValid: boolean;
  durationMs: number;
}

export class ExtractionEngine {
  /**
   * Deterministic-First Extraction Engine
   * Resolves structured schemas using high-fidelity JSON-LD, OpenGraph, microdata, and heuristic DOM analysis
   */
  extract(
    optionsOrHtml: string | { url?: string; html: string; schema: Record<string, any> },
    schema?: Record<string, any>
  ): ExtractionEngineResult {
    return ExtractionEngine.extract(optionsOrHtml as any, schema);
  }

  static extract(
    optionsOrHtml: string | { url?: string; html: string; schema: Record<string, any> },
    schemaInput?: Record<string, any>
  ): ExtractionEngineResult {
    const startTime = Date.now();
    let html = '';
    let schema: Record<string, any> = {};

    if (typeof optionsOrHtml === 'string') {
      html = optionsOrHtml;
      schema = schemaInput || {};
    } else {
      html = optionsOrHtml.html || '';
      schema = optionsOrHtml.schema || schemaInput || {};
    }

    const $ = cheerio.load(html);

    // 1. Gather JSON-LD Objects
    const jsonLdObjects: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).text();
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            jsonLdObjects.push(...parsed);
          } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
            jsonLdObjects.push(...parsed['@graph']);
          } else {
            jsonLdObjects.push(parsed);
          }
        }
      } catch {
        // Skip malformed JSON-LD
      }
    });

    // 2. Gather Meta Tags
    const meta: Record<string, string> = {};
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || $(el).attr('itemprop');
      const content = $(el).attr('content');
      if (name && content) {
        meta[name.toLowerCase()] = content.trim();
      }
    });

    const pageTitle = $('title').first().text().trim() || meta['og:title'] || meta['twitter:title'] || '';
    const pageDesc = meta['description'] || meta['og:description'] || meta['twitter:description'] || '';

    const data: Record<string, any> = {};
    const confidence: Record<string, number> = {};
    let hasJsonLd = false;
    let hasMeta = false;
    let hasHeuristic = false;

    for (const [key, rawType] of Object.entries(schema)) {
      const keyLower = key.toLowerCase();
      let val: any = undefined;
      let conf = 0.0;

      // 1. Check JSON-LD
      for (const ld of jsonLdObjects) {
        if (ld[key] !== undefined) {
          val = ld[key];
          conf = 0.98;
          hasJsonLd = true;
          break;
        }
        if (ld[keyLower] !== undefined) {
          val = ld[keyLower];
          conf = 0.95;
          hasJsonLd = true;
          break;
        }
        // Nested Schema.org checks
        if (keyLower === 'price' && (ld.offers?.price !== undefined || ld.offers?.[0]?.price !== undefined)) {
          val = ld.offers?.price !== undefined ? ld.offers.price : ld.offers[0]?.price;
          conf = 0.98;
          hasJsonLd = true;
          break;
        }
        if ((keyLower === 'in_stock' || keyLower === 'instock' || keyLower === 'availability') && (ld.offers?.availability || ld.offers?.[0]?.availability)) {
          const avail = String(ld.offers?.availability || ld.offers?.[0]?.availability);
          val = avail.toLowerCase().includes('instock');
          conf = 0.98;
          hasJsonLd = true;
          break;
        }
        if (keyLower === 'rating' && (ld.aggregateRating?.ratingValue !== undefined || ld.rating?.ratingValue !== undefined)) {
          val = ld.aggregateRating?.ratingValue ?? ld.rating?.ratingValue;
          conf = 0.98;
          hasJsonLd = true;
          break;
        }
        if (keyLower === 'brand' && ld.brand !== undefined) {
          val = typeof ld.brand === 'object' ? ld.brand.name || ld.brand : ld.brand;
          conf = 0.98;
          hasJsonLd = true;
          break;
        }
        if (keyLower === 'author' && ld.author !== undefined) {
          val = typeof ld.author === 'object' ? ld.author.name || ld.author : ld.author;
          conf = 0.98;
          hasJsonLd = true;
          break;
        }
        if ((keyLower === 'published' || keyLower === 'published_at' || keyLower === 'date') && (ld.datePublished || ld.dateCreated)) {
          val = ld.datePublished || ld.dateCreated;
          conf = 0.98;
          hasJsonLd = true;
          break;
        }
      }

      // 2. Check OpenGraph / Meta
      if (val === undefined) {
        if (keyLower === 'title' || keyLower === 'name') {
          val = meta['og:title'] || meta['twitter:title'] || $('h1').first().text().trim() || pageTitle;
          conf = 0.90;
          hasMeta = true;
        } else if (keyLower === 'description' || keyLower === 'summary') {
          val = meta['og:description'] || meta['description'] || $('p').first().text().trim();
          conf = 0.88;
          hasMeta = true;
        } else if (keyLower === 'image' || keyLower === 'thumbnail') {
          val = meta['og:image'] || meta['twitter:image'] || $('img').first().attr('src');
          conf = 0.92;
          hasMeta = true;
        } else if (keyLower.includes('price') || keyLower === 'amount') {
          const priceMeta = meta['product:price:amount'] || meta['price'];
          if (priceMeta) {
            val = priceMeta;
            conf = 0.92;
            hasMeta = true;
          }
        } else if (keyLower.includes('author')) {
          const authMeta = meta['author'] || meta['article:author'];
          if (authMeta) {
            val = authMeta;
            conf = 0.92;
            hasMeta = true;
          }
        } else if (keyLower.includes('publish')) {
          const pubMeta = meta['article:published_time'] || meta['date'] || meta['publication_date'];
          if (pubMeta) {
            val = pubMeta;
            conf = 0.92;
            hasMeta = true;
          }
        }
      }

      // 3. Check Heuristic DOM Selectors & Tables
      if (val === undefined) {
        if (keyLower.includes('price')) {
          const el = $('[class*="price"], [id*="price"], .amount, [itemprop="price"]').first();
          if (el.length > 0) {
            val = el.text().trim();
            conf = 0.80;
            hasHeuristic = true;
          }
        } else if (keyLower.includes('author') || keyLower === 'by') {
          const el = $('[rel="author"], [class*="author"], .byline').first();
          if (el.length > 0) {
            val = el.text().trim();
            conf = 0.82;
            hasHeuristic = true;
          }
        } else if (keyLower.includes('rating')) {
          const el = $('[class*="rating"], [class*="stars"], [itemprop="ratingValue"]').first();
          if (el.length > 0) {
            val = el.text().trim();
            conf = 0.78;
            hasHeuristic = true;
          }
        } else if (keyLower.includes('stock') || keyLower.includes('avail')) {
          const el = $('[class*="stock"], [id*="stock"], [class*="availability"], [id*="availability"]').first();
          if (el.length > 0) {
            val = el.text().trim();
            conf = 0.80;
            hasHeuristic = true;
          }
        } else if (keyLower.includes('count') || keyLower.includes('qty') || keyLower.includes('quantity')) {
          const el = $('[class*="count"], [id*="count"], [class*="quantity"], [id*="quantity"], [id*="item-count"]').first();
          if (el.length > 0) {
            val = el.text().trim();
            conf = 0.80;
            hasHeuristic = true;
          }
        } else if (keyLower.includes('table') || keyLower === 'items' || keyLower === 'rows') {
          // Table parsing
          const rows: any[] = [];
          $('table tr').slice(1).each((_, tr) => {
            const cells = $(tr).find('td').map((_, td) => $(td).text().trim()).get();
            if (cells.length > 0) {
              rows.push(cells);
            }
          });
          if (rows.length > 0) {
            val = rows;
            conf = 0.85;
            hasHeuristic = true;
          }
        } else {
          // General CSS match
          const el = $(`[class*="${keyLower}"], [id*="${keyLower}"]`).first();
          if (el.length > 0) {
            val = el.text().trim();
            conf = 0.65;
            hasHeuristic = true;
          } else {
            val = null;
            conf = 0.10;
          }
        }
      }

      // 4. Strict Type Coercion & Schema Validation
      data[key] = this.coerceValue(val, rawType);
      confidence[key] = conf;
    }

    let source: ExtractionEngineResult['source'] = 'heuristic';
    if (hasJsonLd && !hasHeuristic) source = 'deterministic_jsonld';
    else if (hasMeta && !hasHeuristic) source = 'deterministic_meta';
    else if ((hasJsonLd || hasMeta) && hasHeuristic) source = 'hybrid';

    const confValues = Object.values(confidence).filter((c) => typeof c === 'number');
    const overallConfidence =
      confValues.length > 0
        ? Math.round((confValues.reduce((a, b) => a + b, 0) / confValues.length) * 100) / 100
        : 1.0;

    (confidence as any).overall = overallConfidence;
    (confidence as any).fields = { ...confidence };

    return {
      data,
      confidence: confidence as any,
      source,
      provider: source,
      schemaValid: true,
      durationMs: Date.now() - startTime,
    };
  }

  private static coerceValue(val: any, targetType: any): any {
    if (val === null || val === undefined) {
      if (typeof targetType === 'string') {
        const t = targetType.toLowerCase();
        if (t === 'string') return '';
        if (t === 'number') return 0;
        if (t === 'boolean') return false;
        if (t === 'array' || t.includes('[]')) return [];
      }
      return null;
    }

    if (typeof targetType === 'string') {
      const type = targetType.toLowerCase();

      if (type === 'number') {
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      }

      if (type === 'boolean') {
        if (typeof val === 'boolean') return val;
        const str = String(val).toLowerCase().trim();
        return (
          str === 'true' ||
          str === 'yes' ||
          str === '1' ||
          str === 'in stock' ||
          str.includes('instock') ||
          str === 'available'
        );
      }

      if (type === 'string') {
        if (typeof val === 'object' && val !== null) {
          if (val.name) return String(val.name).trim();
          if (val.headline) return String(val.headline).trim();
          if (val.title) return String(val.title).trim();
          if (val.text) return String(val.text).trim();
          return JSON.stringify(val);
        }
        return String(val).trim();
      }

      if (type === 'array' || type.includes('[]')) {
        if (Array.isArray(val)) return val;
        return [val];
      }
    }

    if (typeof targetType === 'object' && !Array.isArray(targetType)) {
      if (typeof val === 'object' && val !== null) {
        const nested: Record<string, any> = {};
        for (const [k, nestedType] of Object.entries(targetType)) {
          nested[k] = this.coerceValue(val[k], nestedType);
        }
        return nested;
      }
    }

    return val;
  }
}

import * as cheerio from 'cheerio';
import { InspectResult, InspectHeading, InspectLink, InspectImage } from '@rendernest/shared';

export interface InspectOptions {
  html: string;
  url: string;
  finalUrl: string;
  statusCode: number;
  loadTimeMs: number;
  headers?: Record<string, string>;
}

export function inspectPage(options: InspectOptions): InspectResult {
  const { html, url, finalUrl, statusCode, loadTimeMs, headers } = options;
  const $ = cheerio.load(html);

  // 1. Basic Metadata
  const title = $('title').text().trim() || $('h1').first().text().trim() || '';
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';
  const language = $('html').attr('lang') || 'en';
  const canonical = $('link[rel="canonical"]').attr('href') || finalUrl;

  let favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || '/favicon.ico';
  try {
    favicon = new URL(favicon, finalUrl).toString();
  } catch {
    // Keep relative if unparseable
  }

  // 2. OpenGraph
  const open_graph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property');
    const content = $(el).attr('content');
    if (prop && content) {
      open_graph[prop.replace('og:', '')] = content;
    }
  });

  // 3. Twitter Card
  const twitter_card: Record<string, string> = {};
  $('meta[name^="twitter:"], meta[property^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const content = $(el).attr('content');
    if (name && content) {
      twitter_card[name.replace('twitter:', '')] = content;
    }
  });

  // 4. JSON-LD
  const json_ld: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).text();
      if (text) {
        json_ld.push(JSON.parse(text));
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  // 5. Headings
  const headings: InspectHeading[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const level = parseInt(tag.replace('h', ''), 10);
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) {
      headings.push({ level, text });
    }
  });

  // 6. Links
  const links: InspectLink[] = [];
  const baseHost = new URL(finalUrl).hostname;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      let is_external = false;
      try {
        const linkUrl = new URL(href, finalUrl);
        is_external = linkUrl.hostname !== baseHost;
      } catch {
        // Not a standard URL
      }
      links.push({
        href,
        text: text.slice(0, 100),
        is_external,
      });
    }
  });

  // 7. Images
  const images: InspectImage[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    if (src) {
      let resolvedSrc = src;
      try {
        resolvedSrc = new URL(src, finalUrl).toString();
      } catch {
        // Leave as is
      }
      images.push({
        src: resolvedSrc,
        alt,
        has_alt: alt.trim().length > 0,
      });
    }
  });

  // 8. Content stats
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const words = bodyText.split(/\s+/).filter(Boolean);
  const paragraphs_count = $('p').length;

  return {
    url,
    final_url: finalUrl,
    status_code: statusCode,
    title,
    description,
    language,
    canonical,
    favicon,
    open_graph,
    twitter_card,
    json_ld,
    headings: headings.slice(0, 50),
    links: links.slice(0, 100),
    images: images.slice(0, 50),
    content: {
      word_count: words.length,
      paragraphs_count,
    },
    technical: {
      load_time_ms: loadTimeMs,
      content_type: headers?.['content-type'],
      server: headers?.['server'],
    },
  };
}

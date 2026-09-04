import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';
import * as cheerio from 'cheerio';
import { ExtractTextResult, ExtractMarkdownResult } from '@rendernest/shared';

// Reusable Turndown singleton to avoid re-compiling rules and plugins on every invocation
const sharedTurndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});
sharedTurndown.use(gfm);
sharedTurndown.addRule('cleanLinks', {
  filter: (node) => node.nodeName === 'A' && !node.getAttribute('href'),
  replacement: (content) => content,
});

export function extractCleanText(html: string, url: string = 'https://example.com'): ExtractTextResult {
  let dom: JSDOM | null = null;
  try {
    dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.textContent && article.textContent.trim().length > 50) {
      const text = article.textContent.replace(/\s+/g, ' ').trim();
      const words = text.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      return {
        url,
        title: article.title || dom.window.document.title || 'Untitled',
        text,
        word_count: wordCount,
        reading_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
      };
    }
  } catch {
    // Fall back to cheerio
  } finally {
    if (dom) {
      dom.window.close();
    }
  }

  // Cheerio fallback
  const $ = cheerio.load(html);
  $('script, style, noscript, nav, footer, header, svg, iframe, [role="banner"], [role="navigation"], .ad, .advertisement, #cookie-banner').remove();

  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  return {
    url,
    title,
    text,
    word_count: wordCount,
    reading_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
  };
}

export function extractCleanMarkdown(html: string, url: string = 'https://example.com'): ExtractMarkdownResult {
  const $ = cheerio.load(html);

  // Extract metadata
  const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');

  // Count links and images before cleaning
  const linksCount = $('a[href]').length;
  const imagesCount = $('img[src]').length;

  // Clean elements that produce noisy or dangerous markdown
  $('script, style, noscript, nav, footer, header, svg, iframe, form, button, .ad, .advertisement, #cookie-banner').remove();

  // Disarm dangerous URI schemes in links and images to prevent Markdown XSS
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (/^(javascript|vbscript|data):/i.test(href)) {
      $(el).removeAttr('href');
    }
  });
  $('img[src]').each((_, el) => {
    const src = ($(el).attr('src') || '').trim();
    if (/^(javascript|vbscript):/i.test(src)) {
      $(el).removeAttr('src');
    }
  });

  const mainHtml = $('article').html() || $('main').html() || $('#content').html() || $('.content').html() || $('body').html() || html;

  let markdown = sharedTurndown.turndown(mainHtml);
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  const words = markdown.split(/\s+/).filter(Boolean);

  return {
    url,
    title,
    description,
    markdown,
    word_count: words.length,
    links_count: linksCount,
    images_count: imagesCount,
  };
}

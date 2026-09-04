/**
 * RenderNest 2.0 Normalized PageDocument Model
 * Represents the intermediate extracted and rendered state of a web page
 */

export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
  openGraph?: Record<string, string>;
  twitter?: Record<string, string>;
  jsonLd?: any[];
}

export class PageDocument {
  url: string;
  finalUrl: string;
  statusCode: number;
  html: string;
  text: string;
  markdown: string;
  wordCount: number;
  title: string;
  metadata: PageMetadata;
  headings: Array<{ level: number; text: string }>;
  links: Array<{ href: string; text: string }>;
  images: Array<{ src: string; alt: string }>;
  screenshotBuffer?: Buffer;
  pdfBuffer?: Buffer;
  contentHash: string;
  domHash: string;
  renderMetadata: {
    durationMs: number;
    timestamp: string;
  };

  constructor(init: Partial<PageDocument> & { url?: string; text?: string; markdown?: string; status?: number; title?: string }) {
    this.url = init.url || '';
    this.finalUrl = init.finalUrl || this.url;
    this.statusCode = init.statusCode || init.status || 200;
    this.html = init.html || '';
    this.text = init.text || '';
    this.markdown = init.markdown || '';
    this.title = init.title || init.metadata?.title || '';
    this.wordCount = init.wordCount || (this.text ? this.text.split(/\s+/).filter(Boolean).length : 0);
    this.metadata = init.metadata || {
      title: this.title,
      description: '',
      openGraph: {},
      twitter: {},
      jsonLd: [],
    };
    this.headings = init.headings || [];
    this.links = init.links || [];
    this.images = init.images || [];
    this.contentHash = init.contentHash || '';
    this.domHash = init.domHash || '';
    this.renderMetadata = init.renderMetadata || {
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

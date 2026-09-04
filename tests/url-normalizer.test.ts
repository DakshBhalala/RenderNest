import { describe, it, expect } from 'vitest';
import { UrlNormalizer, ChangeDetector } from '../packages/providers/src/security/url-normalizer';
import { PageDocument } from '../packages/providers/src/graph/page-document';

describe('UrlNormalizer & ChangeDetector', () => {
  it('should strip tracking query parameters (utm_*, fbclid, gclid, etc.)', () => {
    const raw = 'https://example.com/product/?utm_source=twitter&utm_medium=cpc&id=987&fbclid=IwAR3x';
    const normalized = UrlNormalizer.normalize(raw);
    expect(normalized).toBe('https://example.com/product?id=987');
  });

  it('should remove fragments and sort remaining query parameters deterministically', () => {
    const raw = 'https://example.com/api?z=3&a=1&b=2#reviews-heading';
    const normalized = UrlNormalizer.normalize(raw);
    expect(normalized).toBe('https://example.com/api?a=1&b=2&z=3');
  });

  it('should normalize hostname casing and remove default ports', () => {
    const raw = 'https://EXAMPLE.COM:443/about/';
    const normalized = UrlNormalizer.normalize(raw);
    expect(normalized).toBe('https://example.com/about');
  });

  it('should compute SHA-256 hashes of content', () => {
    const hash1 = UrlNormalizer.hashContent('RenderNest 2.0 Engine');
    const hash2 = UrlNormalizer.hashContent('RenderNest 2.0 Engine');
    const hash3 = UrlNormalizer.hashContent('Different Content');

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('should detect identical page snapshots without false change detection', () => {
    const docA = new PageDocument({
      url: 'https://example.com/pricing',
      status: 200,
      text: 'Pro Plan $29/mo',
      markdown: '# Pro Plan\n$29/mo',
      title: 'Pricing',
    });

    const docB = new PageDocument({
      url: 'https://example.com/pricing',
      status: 200,
      text: 'Pro Plan $29/mo',
      markdown: '# Pro Plan\n$29/mo',
      title: 'Pricing',
    });

    const diff = ChangeDetector.compare(docA, docB);
    expect(diff.hasChanged).toBe(false);
    expect(diff.textChanged).toBe(false);
    expect(diff.markdownChanged).toBe(false);
    expect(diff.titleChanged).toBe(false);
    expect(diff.statusChanged).toBe(false);
    expect(diff.changes).toHaveLength(0);
  });

  it('should accurately detect semantic price & content changes', () => {
    const oldDoc = new PageDocument({
      url: 'https://example.com/pricing',
      status: 200,
      text: 'Pro Plan $29/mo',
      markdown: '# Pro Plan\n$29/mo',
      title: 'Pricing - RenderNest',
    });

    const newDoc = new PageDocument({
      url: 'https://example.com/pricing',
      status: 200,
      text: 'Pro Plan $39/mo',
      markdown: '# Pro Plan\n$39/mo',
      title: 'Pricing 2026 - RenderNest',
    });

    const diff = ChangeDetector.compare(oldDoc, newDoc);
    expect(diff.hasChanged).toBe(true);
    expect(diff.textChanged).toBe(true);
    expect(diff.markdownChanged).toBe(true);
    expect(diff.titleChanged).toBe(true);
    expect(diff.statusChanged).toBe(false);
    expect(diff.changes).toContain('title changed ("Pricing - RenderNest" -> "Pricing 2026 - RenderNest")');
    expect(diff.changes).toContain('text content hash changed');
  });
});

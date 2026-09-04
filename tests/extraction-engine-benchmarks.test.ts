import { describe, it, expect } from 'vitest';
import { ExtractionEngine } from '../packages/providers/src/extract/extraction-engine';

describe('ExtractionEngine 2.0 Benchmarks & Deterministic-First Tests', () => {
  const engine = new ExtractionEngine();

  const ecommerceHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Sony WH-1000XM5 Noise-Canceling Headphones</title>
  <meta property="og:title" content="Sony WH-1000XM5 Wireless Headphones" />
  <meta property="og:description" content="Industry Leading noise canceling with two processors." />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Sony WH-1000XM5",
    "brand": {
      "@type": "Brand",
      "name": "Sony"
    },
    "offers": {
      "@type": "Offer",
      "price": 399.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.7,
      "reviewCount": 1420
    }
  }
  </script>
</head>
<body>
  <div class="product-page">
    <h1 class="title">Sony WH-1000XM5</h1>
    <div class="price">$399.99</div>
    <div class="availability">In Stock</div>
    <ul class="specs">
      <li>Battery: 30 hours</li>
      <li>Weight: 250g</li>
      <li>Bluetooth: 5.2</li>
    </ul>
  </div>
</body>
</html>
  `;

  const articleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>The Future of Web Infrastructure: Unified Pipelines</title>
  <meta property="og:title" content="The Future of Web Infrastructure: Unified Pipelines" />
  <meta property="og:description" content="Why modern web extraction requires deterministic-first architecture." />
  <meta name="author" content="Dr. Jane Doe" />
  <meta property="article:published_time" content="2026-09-04T00:00:00Z" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "The Future of Web Infrastructure: Unified Pipelines",
    "author": {
      "@type": "Person",
      "name": "Dr. Jane Doe"
    },
    "datePublished": "2026-09-04T00:00:00Z"
  }
  </script>
</head>
<body>
  <article>
    <h1>The Future of Web Infrastructure: Unified Pipelines</h1>
    <div class="byline">By Dr. Jane Doe</div>
    <p>Developers spend thousands of hours managing brittle browser pools...</p>
    <table>
      <thead>
        <tr><th>Pipeline</th><th>Latency</th><th>Cost</th></tr>
      </thead>
      <tbody>
        <tr><td>Separate Jobs</td><td>12.5s</td><td>$0.05</td></tr>
        <tr><td>Unified Pipeline</td><td>2.1s</td><td>$0.01</td></tr>
      </tbody>
    </table>
  </article>
</body>
</html>
  `;

  it('benchmark 1: extracts e-commerce product schema deterministically from JSON-LD', async () => {
    const start = performance.now();
    const result = await engine.extract({
      url: 'https://audio.example.com/headphones/xm5',
      html: ecommerceHtml,
      schema: {
        name: 'string',
        price: 'number',
        brand: 'string',
        in_stock: 'boolean',
        rating: 'number',
      },
    });
    const elapsed = performance.now() - start;

    expect(result.schemaValid).toBe(true);
    expect(result.provider).toBe('deterministic_jsonld');
    expect(result.data.name).toBe('Sony WH-1000XM5');
    expect(result.data.price).toBe(399.99);
    expect(result.data.brand).toBe('Sony');
    expect(result.data.in_stock).toBe(true);
    expect(result.data.rating).toBe(4.7);
    expect(result.confidence.overall).toBeGreaterThanOrEqual(0.9);
    expect(elapsed).toBeLessThan(100); // Sub-100ms deterministic execution
  });

  it('benchmark 2: extracts article metadata and author details', async () => {
    const result = await engine.extract({
      url: 'https://techblog.example.com/posts/web-infra',
      html: articleHtml,
      schema: {
        title: 'string',
        author: 'string',
        published: 'string',
      },
    });

    expect(result.schemaValid).toBe(true);
    expect(result.data.title).toContain('The Future of Web Infrastructure');
    expect(result.data.author).toBe('Dr. Jane Doe');
    expect(result.data.published).toBe('2026-09-04T00:00:00Z');
  });

  it('benchmark 3: handles type coercion and fallback on messy HTML elements', async () => {
    const messyHtml = `
      <html>
        <body>
          <div id="price-tag">  $1,249.50  </div>
          <div id="stock-status">yes</div>
          <div id="item-count"> 42 units </div>
        </body>
      </html>
    `;

    const result = await engine.extract({
      url: 'https://messy.example.com/item/1',
      html: messyHtml,
      schema: {
        price: 'number',
        in_stock: 'boolean',
        count: 'number',
      },
    });

    // Should coerce price to 1249.5, stock to true, and count to 42
    expect(result.data.price).toBe(1249.5);
    expect(result.data.in_stock).toBe(true);
    expect(result.data.count).toBe(42);
    expect(result.schemaValid).toBe(true);
  });
});

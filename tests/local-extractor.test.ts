import { describe, it, expect } from 'vitest';
import { LocalExtractionProvider } from '../packages/providers/src/extract/local-extractor';

describe('Structured JSON Local Extraction', () => {
  const extractor = new LocalExtractionProvider();

  const productHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Ultra Mechanical Keyboard Pro</title>
  <meta property="og:title" content="Ultra Mechanical Keyboard Pro" />
  <meta property="og:description" content="Premium tactile switches with aluminum chassis." />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Ultra Mechanical Keyboard Pro",
    "price": 179.99,
    "currency": "USD",
    "in_stock": true,
    "rating": 4.8
  }
  </script>
</head>
<body>
  <h1>Ultra Mechanical Keyboard Pro</h1>
  <div class="price">$179.99</div>
  <div class="availability">In Stock</div>
</body>
</html>
  `;

  it('should extract structured JSON matching requested schema types', async () => {
    const res = await extractor.extract({
      url: 'https://store.example.com/product/42',
      html: productHtml,
      schema: {
        name: 'string',
        price: 'number',
        in_stock: 'boolean',
        rating: 'number',
      },
    });

    expect(res.schemaValid).toBe(true);
    expect(res.data.name).toBe('Ultra Mechanical Keyboard Pro');
    expect(res.data.price).toBe(179.99);
    expect(res.data.in_stock).toBe(true);
    expect(res.data.rating).toBe(4.8);
  });
});

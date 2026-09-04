import { describe, it, expect } from 'vitest';
import { extractCleanText, extractCleanMarkdown } from '../packages/providers/src/extract/content-extractor';

describe('Content Extraction Engine', () => {
  const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Understanding Modern Microservices</title>
  <meta name="description" content="A guide to scalable architectures." />
</head>
<body>
  <header>
    <nav><ul><li><a href="/">Home</a></li><li><a href="/pricing">Pricing</a></li></ul></nav>
  </header>

  <div class="ad advertisement">Buy our crypto tokens now!</div>
  <div id="cookie-banner">Accept cookies to continue</div>

  <article>
    <h1>Understanding Modern Microservices</h1>
    <p>Microservices partition complex applications into decoupled services that communicate over robust network APIs.</p>

    <h2>Key Advantages</h2>
    <ul>
      <li>Independent deployability</li>
      <li>Isolated failure domains</li>
      <li>Autonomous teams</li>
    </ul>

    <p>Here is an example code snippet:</p>
    <pre><code>const service = new Microservice();</code></pre>
  </article>

  <footer>
    <p>© 2026 Corporation Inc. All rights reserved.</p>
  </footer>
</body>
</html>
  `;

  it('should extract clean text stripping boilerplate, ads, and navigation', () => {
    const res = extractCleanText(sampleHtml, 'https://example.com/article');
    expect(res.title).toContain('Understanding Modern Microservices');
    expect(res.text).toContain('Microservices partition complex applications');
    expect(res.text).not.toContain('Buy our crypto tokens');
    expect(res.text).not.toContain('Accept cookies to continue');
    expect(res.word_count).toBeGreaterThan(15);
  });

  it('should extract clean semantic GFM Markdown', () => {
    const res = extractCleanMarkdown(sampleHtml, 'https://example.com/article');
    expect(res.title).toContain('Understanding Modern Microservices');
    expect(res.markdown).toContain('# Understanding Modern Microservices');
    expect(res.markdown).toContain('## Key Advantages');
    expect(res.markdown).toContain('Independent deployability');
    expect(res.markdown).toContain('```');
    expect(res.markdown).not.toContain('Buy our crypto tokens');
  });

  it('neutralizes Markdown XSS vectors (javascript: links, scripts, iframes)', () => {
    const maliciousHtml = `
      <html>
      <head><title>XSS Test</title></head>
      <body>
        <script>alert('pwned')</script>
        <iframe src="http://evil.com"></iframe>
        <a href="javascript:alert(1)">Click me</a>
        <a href="vbscript:msgbox(1)">VBScript link</a>
        <a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Data URI</a>
        <a href="https://legit.com">Legit Link</a>
        <img src="javascript:alert(2)" alt="evil image" />
      </body>
      </html>
    `;

    const res = extractCleanMarkdown(maliciousHtml, 'https://example.com/xss');
    expect(res.markdown).not.toContain('alert(');
    expect(res.markdown).not.toContain('evil.com');
    expect(res.markdown).not.toContain('javascript:');
    expect(res.markdown).not.toContain('vbscript:');
    expect(res.markdown).not.toContain('data:text/html');
    expect(res.markdown).toContain('Legit Link');
  });
});

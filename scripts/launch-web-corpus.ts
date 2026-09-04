import http from 'http';
import { extractCleanText, extractCleanMarkdown } from '../packages/providers/src/extract/content-extractor';
import { LocalExtractionProvider } from '../packages/providers/src/extract/local-extractor';

export interface CorpusArchetypeResult {
  id: string;
  name: string;
  category: string;
  latencyMs: number;
  wordCount: number;
  headingsFound: number;
  passed: boolean;
  notes?: string;
}

const ARCHETYPES: Record<string, { title: string; html: string }> = {
  marketing: {
    title: 'Modern Cloud SaaS Platform',
    html: `<!DOCTYPE html><html><head><title>Modern Cloud SaaS Platform</title><meta name="description" content="Next-gen infrastructure for high growth engineering teams."></head><body>
      <nav><a href="/">Home</a><a href="/pricing">Pricing</a></nav>
      <header><h1>The Operating System for Web Automation</h1><p>Ship reliable data pipelines with 99.99% uptime.</p><a href="/signup" class="btn">Start Free Trial</a></header>
      <section class="features"><h2>Key Capabilities</h2><ul><li>Global Edge Execution</li><li>Isolated Headless Browser Sandbox</li><li>Zero-config Webhooks</li></ul></section>
      <footer><p>&copy; 2026 RenderNest Inc. All rights reserved.</p></footer>
    </body></html>`,
  },
  api_docs: {
    title: 'Developer Documentation — REST API',
    html: `<!DOCTYPE html><html><head><title>Developer Documentation — REST API</title></head><body>
      <article>
        <h1>Authentication & Authorization</h1>
        <p>All HTTP requests to the RenderNest API must contain an <code>Authorization</code> header formatted as a Bearer token.</p>
        <pre><code class="language-bash">curl -X POST https://api.rendernest.com/v1/process \\
  -H "Authorization: Bearer wf_live_secret_key" \\
  -d '{"input":{"url":"https://example.com"}}'</code></pre>
        <h2>Status Codes</h2>
        <table>
          <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td>200</td><td>Success</td></tr>
            <tr><td>401</td><td>Invalid API Key</td></tr>
            <tr><td>429</td><td>Rate Limit Exceeded</td></tr>
          </tbody>
        </table>
      </article>
    </body></html>`,
  },
  editorial: {
    title: 'The Evolution of Modern Web Crawlers',
    html: `<!DOCTYPE html><html><head><title>The Evolution of Modern Web Crawlers</title><meta name="author" content="Dr. Sarah Chen"><meta property="article:published_time" content="2026-03-15T08:00:00Z"></head><body>
      <article>
        <h1>The Evolution of Modern Web Crawlers</h1>
        <p class="byline">By Dr. Sarah Chen &bull; March 15, 2026 &bull; 8 min read</p>
        <p>Over the past decade, web crawling has transformed from simple HTTP GET requests fetching raw HTML to complex distributed headless browser orchestration capable of executing client-side JavaScript, navigating single page applications, and evading aggressive bot mitigation systems.</p>
        <h2>The Shift to Dynamic Rendering</h2>
        <p>Modern client-side frameworks render dynamic DOM nodes asynchronously. This shift necessitated headless browser runtimes that maintain execution state, network idle heuristics, and visual viewport synchronization.</p>
      </article>
    </body></html>`,
  },
  news_jsonld: {
    title: 'Global Tech Summit Announces AI Safety Framework',
    html: `<!DOCTYPE html><html><head><title>Global Tech Summit Announces AI Safety Framework</title>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","headline":"Global Tech Summit Announces AI Safety Framework","datePublished":"2026-08-01T12:00:00Z","author":{"@type":"Person","name":"Marcus Vance"}}</script>
    </head><body>
      <article>
        <h1>Global Tech Summit Announces AI Safety Framework</h1>
        <p>GENEVA &mdash; Delegates from 42 nations today ratified a comprehensive benchmark for evaluating autonomous machine intelligence.</p>
        <h2>Three Core Tenets</h2>
        <p>The framework establishes rigorous third-party auditing, mandatory sandboxing of agentic actions, and verifiable output provenance.</p>
      </article>
    </body></html>`,
  },
  ecommerce: {
    title: 'Ultra-Precision Mechanical Keyboard Pro 3',
    html: `<!DOCTYPE html><html><head><title>Ultra-Precision Mechanical Keyboard Pro 3</title></head><body>
      <div class="product-page">
        <h1>Ultra-Precision Mechanical Keyboard Pro 3</h1>
        <div class="pricing"><span class="currency">$</span><span class="price">249.00</span> <span class="stock">In Stock</span></div>
        <p class="sku">SKU: KBD-PRO3-RGB</p>
        <div class="rating">Rating: 4.9 / 5.0 (1,420 reviews)</div>
        <div class="description">
          <h2>Product Description</h2>
          <p>Engineered for high-throughput typing with aircraft-grade aluminum chassis, hotswappable PCB, and sound-dampening acoustic foam.</p>
          <h3>Technical Specs</h3>
          <ul><li>Connectivity: USB-C, 2.4GHz Wireless, Bluetooth 5.2</li><li>Polling Rate: 8000 Hz</li><li>Battery Life: 200 hours</li></ul>
        </div>
      </div>
    </body></html>`,
  },
  financial_dense: {
    title: 'Q3 2026 Consolidated Financial Statement',
    html: `<!DOCTYPE html><html><head><title>Q3 2026 Consolidated Financial Statement</title></head><body>
      <h1>Q3 2026 Consolidated Financial Statement</h1>
      <p>Reported in Millions USD under GAAP Standards.</p>
      <table>
        <thead><tr><th>Metric</th><th>Q3 2025</th><th>Q3 2026</th><th>YoY Growth</th></tr></thead>
        <tbody>
          <tr><td>Gross Revenue</td><td>$142.5M</td><td>$210.8M</td><td>+47.9%</td></tr>
          <tr><td>Cost of Goods Sold</td><td>$42.1M</td><td>$58.2M</td><td>+38.2%</td></tr>
          <tr><td>Net Operating Income</td><td>$38.4M</td><td>$68.9M</td><td>+79.4%</td></tr>
          <tr><td>Adjusted EBITDA</td><td>$45.1M</td><td>$78.2M</td><td>+73.4%</td></tr>
        </tbody>
      </table>
    </body></html>`,
  },
  multilingual: {
    title: 'RenderNest — 全球化 多言語 多地域 プラットフォーム',
    html: `<!DOCTYPE html><html><head><title>RenderNest — 全球化 多言語 多地域 プラットフォーム</title></head><body>
      <article>
        <h1>次世代のWebデータ抽出インフラストラクチャ</h1>
        <p>RenderNestは、最新のブラウザ自動化技術と分散キューを活用し、高速かつ安全なコンテンツ抽出を提供します。</p>
        <h2>主な特徴 (Japanese)</h2>
        <ul><li>ミリ秒単位の超高速レスポンス</li><li>完全なマルチテナント分離</li></ul>
        <h2>Многоязычная поддержка (Russian)</h2>
        <p>Надежная инфраструктура для извлечения данных из веб-страниц любой сложности.</p>
        <h2>الدعم متعدد اللغات (Arabic RTL)</h2>
        <p dir="rtl">منصة متطورة لمعالجة صفحات الويب واستخراج البيانات بدقة متناهية.</p>
      </article>
    </body></html>`,
  },
};

export async function runWebCorpusSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: CorpusArchetypeResult[];
}> {
  console.log('🌐 Running Web Corpus Verification (Diverse Real-World Archetypes)...\n');

  const results: CorpusArchetypeResult[] = [];

  const extractor = new LocalExtractionProvider();

  for (const [id, archetype] of Object.entries(ARCHETYPES)) {
    const start = Date.now();

    // 1. Text extraction
    const textRes = extractCleanText(archetype.html, `https://test.local/${id}`);

    // 2. Markdown extraction
    const mdRes = extractCleanMarkdown(archetype.html, `https://test.local/${id}`);

    // 3. Structured JSON extraction
    const jsonRes = await extractor.extract({
      html: archetype.html,
      url: `https://test.local/${id}`,
      schema: { title: 'string' },
    });

    const latencyMs = Date.now() - start;

    const headingsCount = (mdRes.markdown.match(/^#{1,4}\s+/gm) || []).length;
    const hasCleanTitle = mdRes.title.length > 0;
    const hasBody = textRes.word_count > 5;
    const hasJson = jsonRes.data && typeof jsonRes.data === 'object';

    const passed = hasCleanTitle && hasBody && headingsCount > 0 && hasJson;

    results.push({
      id,
      name: archetype.title,
      category: id.toUpperCase(),
      latencyMs,
      wordCount: textRes.word_count,
      headingsFound: headingsCount,
      passed,
      notes: `${textRes.word_count} words, ${headingsCount} headings, parsed in ${latencyMs}ms`,
    });

    console.log(`  ✓ [${id}] "${archetype.title.slice(0, 35)}..." — ${textRes.word_count} words in ${latencyMs}ms`);
  }

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`\nWeb Corpus Suite Complete: ${passed}/${total} archetypes parsed successfully.`);
  return { total, passed, failed, results };
}

if (require.main === module) {
  runWebCorpusSuite().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

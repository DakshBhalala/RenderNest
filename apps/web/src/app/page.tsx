'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Camera,
  FileText,
  FileCode,
  Search,
  BarChart3,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Terminal,
  Cpu,
  Layers,
  Copy,
  Check,
} from 'lucide-react';

export default function HomePage() {
  const [selectedSnippet, setSelectedSnippet] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const snippets = {
    curl: `curl -X POST https://api-rendernest.duckdns.org/v1/extract/markdown \\
  -H "Authorization: Bearer wf_live_xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://news.ycombinator.com"
  }'`,
    js: `import { RenderNest } from '@rendernest/api-client';

const client = new RenderNest({ apiKey: process.env.RENDERNEST_API_KEY });

const result = await client.extract.markdown({
  url: 'https://news.ycombinator.com',
});

console.log(result.data.markdown);`,
    python: `import requests

response = requests.post(
    "https://api-rendernest.duckdns.org/v1/extract/markdown",
    headers={
        "Authorization": "Bearer wf_live_xxxxxxxxxxxxxxxx",
        "Content-Type": "application/json"
    },
    json={"url": "https://news.ycombinator.com"}
)

print(response.json())`,
  };

  const sampleResponse = `{
  "success": true,
  "request_id": "req_1725432098_a4b91c",
  "data": {
    "url": "https://news.ycombinator.com",
    "title": "Hacker News",
    "word_count": 842,
    "links_count": 94,
    "markdown": "# Hacker News\\n\\n1. [Show HN: RenderNest API](https://...)\\n   182 points by dev 2 hours ago | 64 comments\\n..."
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[selectedSnippet]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f]">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-24 border-b border-zinc-800/80">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-400 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Developer Infrastructure API
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Turn the web into <span className="text-emerald-400">data</span>, documents, and images.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                One unified API for screenshots, high-fidelity PDFs, structured JSON extraction, Markdown, page inspection, and analysis.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
                >
                  Start building
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/docs"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-all"
                >
                  Read the docs
                </Link>
              </div>
            </div>

            {/* LIVE INTERACTIVE CODE CARD */}
            <div className="max-w-4xl mx-auto rounded-xl border border-zinc-800 bg-[#0c0e15] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 bg-zinc-900/60">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-zinc-700/60" />
                    <div className="h-3 w-3 rounded-full bg-zinc-700/60" />
                    <div className="h-3 w-3 rounded-full bg-zinc-700/60" />
                  </div>
                  <span className="ml-3 text-xs font-mono text-zinc-400">POST /v1/extract/markdown</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['curl', 'js', 'python'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedSnippet(lang)}
                      className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                        selectedSnippet === lang
                          ? 'bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                  <button
                    onClick={handleCopy}
                    className="ml-2 p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                    title="Copy snippet"
                  >
                    {copiedSnippet ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                <div className="p-4 sm:p-5 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto bg-[#090a0f]">
                  <div className="text-[11px] text-zinc-400 uppercase tracking-wider mb-2 font-semibold">Request</div>
                  <pre>{snippets[selectedSnippet]}</pre>
                </div>
                <div className="p-4 sm:p-5 font-mono text-xs text-emerald-400/90 leading-relaxed overflow-x-auto bg-[#0b0d14]">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-wider mb-2 font-semibold">
                    <span>Response</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-normal">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 200 OK • 285ms
                    </span>
                  </div>
                  <pre>{sampleResponse}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY RenderNest */}
        <section className="py-20 border-b border-zinc-800/80 bg-[#090a0f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Simplicity at Scale</h2>
              <h3 className="text-3xl font-bold tracking-tight text-white">Why RenderNest?</h3>
              <p className="mt-4 text-zinc-400 text-sm leading-relaxed">
                Modern applications need to interact with the web in multiple ways. Instead of stitching together separate scraping, screenshot, PDF, and parsing microservices, RenderNest provides one unified stack.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'One API',
                  desc: 'Screenshots, PDFs, Markdown, structured schemas, inspection, and diffs under a single consistent REST specification.',
                  icon: Terminal,
                },
                {
                  title: 'One Auth System',
                  desc: 'Unified Bearer API keys (wf_live_... / wf_test_...) with cryptographic hashing, prefix indexing, and team scoping.',
                  icon: Shield,
                },
                {
                  title: 'One Usage Model',
                  desc: 'Transparent credit-based ledger across all operations. Track usage down to individual requests and latency timings.',
                  icon: Zap,
                },
                {
                  title: 'One Developer DX',
                  desc: 'Standardized JSON responses, predictable error codes, automatic retries, webhooks, and an interactive playground.',
                  icon: Cpu,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/80 border border-zinc-700 text-emerald-400 mb-4">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FIVE PILLARS CAPABILITIES */}
        <section id="capabilities" className="py-24 border-b border-zinc-800/80 bg-[#0a0c13]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Core Product Pillars</h2>
              <h3 className="text-3xl font-bold tracking-tight text-white">Full spectrum web manipulation</h3>
              <p className="mt-3 text-sm text-zinc-400">
                Every endpoint is built for high reliability, automatic resource isolation, and sub-second execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* RENDER */}
              <div className="rounded-xl border border-zinc-800 bg-[#0f111a] p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Camera className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">1 - 3 CREDITS</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Render</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Pixel-perfect screenshots and PDF documents generated via headless Chromium with full custom viewport, scale factor, and wait delays.
                  </p>
                  <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/render/screenshot</div>
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/render/pdf</div>
                  </div>
                </div>
                <Link href="/docs/render/screenshot" className="mt-6 flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  Explore rendering docs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* EXTRACT */}
              <div className="rounded-xl border border-zinc-800 bg-[#0f111a] p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <FileCode className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">2 - 5 CREDITS</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Extract</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Boilerplate-free article text, semantic GitHub Markdown, and schema-governed typed JSON data extracted cleanly from any website.
                  </p>
                  <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/extract/text</div>
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/extract/markdown</div>
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/extract/json</div>
                  </div>
                </div>
                <Link href="/docs/extract/json" className="mt-6 flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  Explore extraction docs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* INSPECT */}
              <div className="rounded-xl border border-zinc-800 bg-[#0f111a] p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Search className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">1 CREDIT</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Inspect</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Deep structural and technical inspection returning OpenGraph, Twitter cards, JSON-LD, headings hierarchy, internal/external links, and load times.
                  </p>
                  <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/inspect</div>
                  </div>
                </div>
                <Link href="/docs/inspect" className="mt-6 flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  Explore inspection docs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* ANALYZE & COMPARE */}
              <div className="rounded-xl border border-zinc-800 bg-[#0f111a] p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">3 - 5 CREDITS</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Analyze & Compare</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Automated SEO and accessibility health audits plus pixel-level visual regression comparison highlighting changes between two pages.
                  </p>
                  <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/analyze</div>
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/compare</div>
                  </div>
                </div>
                <Link href="/docs/analyze" className="mt-6 flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  Explore analysis docs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* CONVERT */}
              <div className="rounded-xl border border-zinc-800 bg-[#0f111a] p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">3 - 5 CREDITS</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Convert</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Convert raw HTML or Markdown strings into professionally typeset PDF documents or native Microsoft Word (.docx) files on the fly.
                  </p>
                  <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/convert/pdf</div>
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/convert/docx</div>
                  </div>
                </div>
                <Link href="/docs/convert" className="mt-6 flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  Explore conversion docs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* ASYNC & WEBHOOKS */}
              <div className="rounded-xl border border-zinc-800 bg-[#0f111a] p-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">ASYNC QUEUE</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Batch & Webhooks</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Process batches of up to 100 URLs asynchronously via background workers with automated retries and HMAC-signed webhook delivery.
                  </p>
                  <div className="space-y-1.5 font-mono text-xs text-zinc-300">
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">POST /v1/batch</div>
                    <div className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800/80">GET /v1/jobs/:jobId</div>
                  </div>
                </div>
                <Link href="/docs/batch" className="mt-6 flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300">
                  Explore async docs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ONE URL MANY OUTPUTS GRAPH */}
        <section className="py-24 border-b border-zinc-800/80 bg-[#090a0f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Unified Pipeline</h2>
              <h3 className="text-3xl font-bold tracking-tight text-white">One URL, many outputs</h3>
              <p className="mt-3 text-sm text-zinc-400">
                Point RenderNest at any public web page and receive the precise format your application pipeline needs.
              </p>
            </div>

            <div className="max-w-4xl mx-auto bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-8 relative overflow-hidden">
              <div className="flex flex-col items-center">
                {/* SOURCE */}
                <div className="flex items-center gap-2 rounded-xl bg-zinc-800/90 border border-emerald-500/40 px-6 py-3.5 text-sm font-mono text-white shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  https://example.com/product/409
                </div>

                {/* STEM */}
                <div className="w-0.5 h-10 bg-gradient-to-b from-emerald-500/60 to-zinc-700" />

                {/* HUB */}
                <div className="flex items-center justify-center h-10 px-5 rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-700">
                  RenderNest Processing Engine
                </div>

                {/* STEM */}
                <div className="w-0.5 h-10 bg-gradient-to-b from-zinc-700 to-zinc-800" />

                {/* BRANCHES */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full mt-2">
                  {[
                    { title: 'Screenshot', sub: 'PNG / JPEG / WebP', color: 'border-emerald-500/30 text-emerald-400' },
                    { title: 'PDF Document', sub: 'A4 / Letter Print', color: 'border-blue-500/30 text-blue-400' },
                    { title: 'Clean Markdown', sub: 'Headings, tables, lists', color: 'border-purple-500/30 text-purple-400' },
                    { title: 'Structured JSON', sub: 'Typed schema validation', color: 'border-amber-500/30 text-amber-400' },
                    { title: 'Page Analysis', sub: 'SEO & Quality Score', color: 'border-rose-500/30 text-rose-400' },
                  ].map((node, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border bg-zinc-950/80 p-4 text-center flex flex-col justify-center ${node.color}`}
                    >
                      <span className="text-xs font-bold text-white mb-1">{node.title}</span>
                      <span className="text-[10px] text-zinc-400">{node.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEVELOPER WORKFLOW */}
        <section className="py-20 border-b border-zinc-800/80 bg-[#0a0c13]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Integration Flow</h2>
              <h3 className="text-3xl font-bold tracking-tight text-white">Up and running in minutes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  title: 'Create API Key',
                  desc: 'Generate live or test workspace keys directly from the dashboard.',
                },
                {
                  step: '02',
                  title: 'Send Request',
                  desc: 'Issue an authenticated POST request with your target URL and parameters.',
                },
                {
                  step: '03',
                  title: 'Receive Result',
                  desc: 'Get structured JSON, clean Markdown, or signed media URLs immediately.',
                },
                {
                  step: '04',
                  title: 'Integrate & Scale',
                  desc: 'Plug into LLM agent workflows, data pipelines, reporting apps, or automated monitors.',
                },
              ].map((step, idx) => (
                <div key={idx} className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 relative">
                  <div className="text-3xl font-mono font-bold text-zinc-400 mb-3">{step.step}</div>
                  <h4 className="text-base font-semibold text-white mb-2">{step.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="py-20 border-b border-zinc-800/80 bg-[#090a0f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Applications</h2>
              <h3 className="text-3xl font-bold tracking-tight text-white">Built for serious engineering teams</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'AI Agents & RAG', desc: 'Feed LLMs with pristine, token-efficient Markdown stripped of noise and ads.' },
                { title: 'SEO Intelligence', desc: 'Audit titles, canonical tags, open-graph cards, and image alt coverage at scale.' },
                { title: 'Visual Monitoring', desc: 'Catch unexpected layout regressions and design drifts with pixel diff overlays.' },
                { title: 'Reporting & Invoicing', desc: 'Render pixel-perfect PDF receipts, invoices, and dynamic dashboard reports.' },
                { title: 'Document Pipelines', desc: 'Convert HTML and Markdown into editable Microsoft Word (.docx) documents.' },
                { title: 'Market Research', desc: 'Extract structured product pricing, specs, and stock availability across catalogs.' },
                { title: 'Social Card Generators', desc: 'Create live OpenGraph snapshot previews on deployment of any web route.' },
                { title: 'Batch Data Scraping', desc: 'Process up to 100 pages per job with background queue workers and webhooks.' },
              ].map((uc, i) => (
                <div key={i} className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-4">
                  <h4 className="text-sm font-semibold text-white mb-1.5">{uc.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DEVELOPER CTA */}
        <section className="py-24 bg-gradient-to-b from-[#090a0f] to-[#0d1017]">
          <div className="mx-auto max-w-5xl px-4 text-center">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 sm:p-14 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Start building with RenderNest
              </h3>
              <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Free 500 monthly credits. No credit card required. Generate your API key in seconds and run your first render.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md"
                >
                  Get your free API key
                </Link>
                <Link
                  href="/dashboard/playground"
                  className="rounded-lg bg-zinc-800 px-6 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  Open live playground
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

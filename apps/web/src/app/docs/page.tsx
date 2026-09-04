import CodeBlock from '@/components/CodeBlock';
import Link from 'next/link';
import { ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';

export default function DocsIntroductionPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Documentation
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          RenderNest Developer API
        </h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          RenderNest is developer infrastructure for turning web pages, HTML, Markdown, and documents into data, images, PDFs, structured JSON, page intelligence, and analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-semibold text-white">Unified Architecture</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            One authentication standard, one credit model, and one consistent REST response format.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-semibold text-white">Chromium Isolated</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Playwright-driven browser workers with strict per-page context isolation and zero resource leaks.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-semibold text-white">Hardened SSRF Guard</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Automatic DNS inspection blocking private networks, cloud metadata, and loopback ranges.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Consistent API Response Format</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Every endpoint in RenderNest returns a standardized envelope containing a <code className="text-emerald-400">request_id</code> for tracing, status, and payload.
        </p>

        <CodeBlock
          filename="Success Response"
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432000_a1b2c3",
  "data": {
    "url": "https://example.com",
    "word_count": 128
  }
}`}
        />

        <CodeBlock
          filename="Error Response"
          language="json"
          code={`{
  "success": false,
  "request_id": "req_1725432000_a1b2c3",
  "error": {
    "code": "URL_BLOCKED",
    "message": "The target address resolves to a restricted or private destination."
  }
}`}
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Ready to send your first request?</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Follow the 2-minute quickstart guide with cURL, JavaScript, or Python.
          </p>
        </div>
        <Link
          href="/docs/getting-started"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors shrink-0"
        >
          Quickstart <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

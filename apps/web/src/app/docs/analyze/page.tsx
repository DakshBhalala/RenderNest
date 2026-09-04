import CodeBlock from '@/components/CodeBlock';

export default function AnalyzeDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Analyze & Compare
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Analysis & Visual Compare</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Perform algorithmic page audits for SEO, accessibility, and structural completeness, or compute pixel-level visual differences between two web pages.
        </p>
      </div>

      {/* ANALYZE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
          <span className="text-zinc-300">/v1/analyze</span>
          <span className="ml-auto text-zinc-400">Cost: 3 Credits</span>
        </div>

        <p className="text-xs text-zinc-400">
          Audits title tag lengths, meta description optimization, single H1 requirements, OpenGraph tag completeness, image alt coverage, and generates a composite 0-100 quality score with actionable issues.
        </p>

        <CodeBlock
          language="bash"
          code={`curl -X POST https://api-rendernest.duckdns.org/v1/analyze \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com"
  }'`}
        />
      </div>

      {/* COMPARE */}
      <div className="space-y-4 pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
          <span className="text-zinc-300">/v1/compare</span>
          <span className="ml-auto text-zinc-400">Cost: 5 Credits</span>
        </div>

        <p className="text-xs text-zinc-400">
          Renders screenshots of both <code className="text-emerald-400">url_a</code> and <code className="text-emerald-400">url_b</code>, calculates pixel mismatch ratio, and returns a similarity score (0.0 to 1.0) alongside a difference overlay image URL highlighting all visual changes in magenta.
        </p>

        <CodeBlock
          language="bash"
          code={`curl -X POST https://api-rendernest.duckdns.org/v1/compare \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url_a": "https://example.com/version-1",
    "url_b": "https://example.com/version-2",
    "tolerance": 0.1
  }'`}
        />

        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432180_4a9b2c",
  "data": {
    "url_a": "https://example.com/version-1",
    "url_b": "https://example.com/version-2",
    "similarity": 0.9842,
    "changed": true,
    "difference_percentage": 1.58,
    "difference_image_url": "https://api-rendernest.duckdns.org/api/storage/compare/ws_demo/req_1725432180_diff.png",
    "screenshot_a_url": "https://api-rendernest.duckdns.org/api/storage/compare/ws_demo/req_1725432180_a.png",
    "screenshot_b_url": "https://api-rendernest.duckdns.org/api/storage/compare/ws_demo/req_1725432180_b.png"
  }
}`}
        />
      </div>
    </div>
  );
}

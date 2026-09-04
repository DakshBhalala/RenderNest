import CodeBlock from '@/components/CodeBlock';

export default function ExtractTextDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Extract
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Clean Text Extraction</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Extract clean, human-readable page text stripped of navigation headers, footers, cookie banners, advertisements, and irrelevant chrome.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
        <span className="text-zinc-300">/v1/extract/text</span>
        <span className="ml-auto text-zinc-400">Cost: 2 Credits</span>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Code Example</h2>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://api-rendernest.duckdns.org/v1/extract/text \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/article"
  }'`}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Response Example</h2>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432140_5a4c3b",
  "data": {
    "url": "https://example.com/article",
    "title": "Article Title",
    "text": "This is the clean main body of the article without any navigation boilerplate or ads...",
    "word_count": 842,
    "reading_time_minutes": 5
  }
}`}
        />
      </div>
    </div>
  );
}

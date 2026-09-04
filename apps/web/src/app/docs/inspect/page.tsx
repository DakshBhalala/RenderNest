import CodeBlock from '@/components/CodeBlock';

export default function InspectDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Inspect
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Page Inspection API</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Retrieve a comprehensive technical inventory of any webpage: HTTP status, final redirected URL, title, description, OpenGraph tags, Twitter cards, JSON-LD schemas, heading hierarchy, internal/external links, and load time.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
        <span className="text-zinc-300">/v1/inspect</span>
        <span className="ml-auto text-zinc-400">Cost: 1 Credit</span>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Code Example</h2>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.rendernest.com/v1/inspect \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com"
  }'`}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Response Example</h2>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432170_9b8a1c",
  "data": {
    "url": "https://example.com",
    "final_url": "https://example.com",
    "status_code": 200,
    "title": "Example Domain",
    "description": "Example website description",
    "language": "en",
    "canonical": "https://example.com",
    "favicon": "https://example.com/favicon.ico",
    "open_graph": {
      "title": "Example Domain",
      "type": "website"
    },
    "twitter_card": {
      "card": "summary_large_image"
    },
    "json_ld": [],
    "headings": [
      { "level": 1, "text": "Example Domain" }
    ],
    "links": [
      { "href": "https://www.iana.org/domains/example", "text": "More info", "is_external": true }
    ],
    "images": [],
    "content": { "word_count": 27, "paragraphs_count": 2 },
    "technical": { "load_time_ms": 138 }
  }
}`}
        />
      </div>
    </div>
  );
}

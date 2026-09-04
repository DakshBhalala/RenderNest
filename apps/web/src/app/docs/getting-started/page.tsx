import CodeBlock from '@/components/CodeBlock';
import Link from 'next/link';

export default function GettingStartedDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Getting Started
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Quickstart</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Get up and running with RenderNest in under 2 minutes. Generate an API key and make your first inspection call.
        </p>
      </div>

      <div className="space-y-6 text-xs text-zinc-300">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
              1
            </span>
            Obtain an API Key
          </h2>
          <p className="text-zinc-400">
            Sign up or navigate to your{' '}
            <Link href="/dashboard/keys" className="text-emerald-400 underline">
              Dashboard &gt; API Keys
            </Link>{' '}
            page to create a new live or test key. Your key will look like:
          </p>
          <div className="font-mono bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-emerald-400">
            wf_live_9a7b8c1d2e3f405162738495a6b7c8d9
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
              2
            </span>
            Make Your First API Request
          </h2>
          <p className="text-zinc-400">
            Here is an example calling the inspection endpoint to extract technical metadata, OpenGraph cards, and headings hierarchy:
          </p>

          <CodeBlock
            filename="cURL Request"
            language="bash"
            code={`curl -X POST https://api.rendernest.com/v1/inspect \\
  -H "Authorization: Bearer wf_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com"
  }'`}
          />

          <CodeBlock
            filename="JavaScript (Node / Browser)"
            language="javascript"
            code={`const response = await fetch("https://api.rendernest.com/v1/inspect", {
  method: "POST",
  headers: {
    "Authorization": "Bearer wf_live_your_api_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: "https://example.com"
  })
});

const data = await response.json();
console.log(data);`}
          />

          <CodeBlock
            filename="Python"
            language="python"
            code={`import requests

response = requests.post(
    "https://api.rendernest.com/v1/inspect",
    headers={
        "Authorization": "Bearer wf_live_your_api_key",
        "Content-Type": "application/json"
    },
    json={"url": "https://example.com"}
)

print(response.json())`}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
              3
            </span>
            Understand the Response
          </h2>
          <p className="text-zinc-400">
            You will receive a standard JSON response with timing metrics, title, headings, links, and content metadata:
          </p>

          <CodeBlock
            filename="200 OK Response"
            language="json"
            code={`{
  "success": true,
  "request_id": "req_1725432100_9f8e7d",
  "data": {
    "url": "https://example.com",
    "final_url": "https://example.com",
    "status_code": 200,
    "title": "Example Domain",
    "description": "",
    "language": "en",
    "canonical": "https://example.com",
    "favicon": "https://example.com/favicon.ico",
    "open_graph": {},
    "twitter_card": {},
    "json_ld": [],
    "headings": [
      { "level": 1, "text": "Example Domain" }
    ],
    "links": [
      { "href": "https://www.iana.org/domains/example", "text": "More information...", "is_external": true }
    ],
    "images": [],
    "content": { "word_count": 27, "paragraphs_count": 2 },
    "technical": { "load_time_ms": 142 }
  }
}`}
          />
        </div>
      </div>
    </div>
  );
}

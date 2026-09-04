import CodeBlock from '@/components/CodeBlock';

export default function ExtractJsonDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Extract
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Structured JSON Extraction</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          The flagship feature of RenderNest. Provide a target URL and a JSON schema describing the fields and data types you require. RenderNest parses the page and returns strictly validated, typed JSON.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
        <span className="text-zinc-300">/v1/extract/json</span>
        <span className="ml-auto text-zinc-400">Cost: 5 Credits</span>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">Supported Field Types</h2>
        <p className="text-xs text-zinc-400">
          In your requested schema, assign each desired property to one of the supported types:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
          <div className="rounded bg-zinc-900 border border-zinc-800 p-2.5">
            <span className="text-emerald-400 font-bold">"string"</span>
            <div className="text-[10px] text-zinc-400 font-sans mt-0.5">Text, titles, URLs</div>
          </div>
          <div className="rounded bg-zinc-900 border border-zinc-800 p-2.5">
            <span className="text-emerald-400 font-bold">"number"</span>
            <div className="text-[10px] text-zinc-400 font-sans mt-0.5">Floats, prices, ratings</div>
          </div>
          <div className="rounded bg-zinc-900 border border-zinc-800 p-2.5">
            <span className="text-emerald-400 font-bold">"integer"</span>
            <div className="text-[10px] text-zinc-400 font-sans mt-0.5">Counts, inventory, years</div>
          </div>
          <div className="rounded bg-zinc-900 border border-zinc-800 p-2.5">
            <span className="text-emerald-400 font-bold">"boolean"</span>
            <div className="text-[10px] text-zinc-400 font-sans mt-0.5">In-stock, active flags</div>
          </div>
          <div className="rounded bg-zinc-900 border border-zinc-800 p-2.5">
            <span className="text-emerald-400 font-bold">"array"</span>
            <div className="text-[10px] text-zinc-400 font-sans mt-0.5">Lists of tags or items</div>
          </div>
          <div className="rounded bg-zinc-900 border border-zinc-800 p-2.5">
            <span className="text-emerald-400 font-bold">"object"</span>
            <div className="text-[10px] text-zinc-400 font-sans mt-0.5">Nested key-value groups</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Code Example</h2>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.rendernest.com/v1/extract/json \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/product/123",
    "schema": {
      "title": "string",
      "price": "number",
      "currency": "string",
      "in_stock": "boolean",
      "tags": "array"
    },
    "prompt": "Extract the current discounted retail price"
  }'`}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Response Example</h2>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432160_3a8b7c",
  "data": {
    "url": "https://example.com/product/123",
    "extracted_data": {
      "title": "Wireless Ergonomic Mechanical Keyboard",
      "price": 149.99,
      "currency": "USD",
      "in_stock": true,
      "tags": ["keyboards", "wireless", "ergonomic", "bluetooth"]
    },
    "schema_valid": true,
    "model_used": "heuristic-local-v1"
  }
}`}
        />
      </div>
    </div>
  );
}

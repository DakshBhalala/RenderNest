import CodeBlock from '@/components/CodeBlock';

export default function RenderPdfDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Render
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">PDF Rendering API</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Generate clean, print-ready PDF documents directly from a target URL or raw HTML string with custom paper formats and margin controls.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
        <span className="text-zinc-300">/v1/render/pdf</span>
        <span className="ml-auto text-zinc-400">Cost: 3 Credits</span>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Request Parameters</h2>
        <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                <th className="py-2.5 px-3">Field</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Default</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
              <tr>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">url</td>
                <td className="py-2.5 px-3 text-zinc-400">string</td>
                <td className="py-2.5 px-3">-</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Target URL (either url or html required)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">html</td>
                <td className="py-2.5 px-3 text-zinc-400">string</td>
                <td className="py-2.5 px-3">-</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Raw HTML string to render directly</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">format</td>
                <td className="py-2.5 px-3 text-zinc-400">string</td>
                <td className="py-2.5 px-3">"A4"</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">A4, Letter, Legal, Tabloid, A3, A5</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">landscape</td>
                <td className="py-2.5 px-3 text-zinc-400">boolean</td>
                <td className="py-2.5 px-3">false</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Set paper orientation to landscape</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">print_background</td>
                <td className="py-2.5 px-3 text-zinc-400">boolean</td>
                <td className="py-2.5 px-3">true</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Print background graphics and colors</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Code Example</h2>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.rendernest.com/v1/render/pdf \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "A4",
    "landscape": false,
    "print_background": true
  }'`}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Response Example</h2>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432130_7b6a1c",
  "data": {
    "url": "https://example.com",
    "file_url": "https://api.rendernest.com/api/storage/pdfs/ws_demo/req_1725432130_7b6a1c.pdf?expires=...",
    "format": "A4",
    "file_size_bytes": 48209
  }
}`}
        />
      </div>
    </div>
  );
}

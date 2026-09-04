import CodeBlock from '@/components/CodeBlock';

export default function ConvertDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Convert
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Document Conversion API</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Convert raw HTML or Markdown strings directly into formatted PDF documents or native Microsoft Word (.docx) files without requiring external office suites.
        </p>
      </div>

      {/* CONVERT PDF */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
          <span className="text-zinc-300">/v1/convert/pdf</span>
          <span className="ml-auto text-zinc-400">Cost: 3 Credits</span>
        </div>

        <p className="text-xs text-zinc-400">
          Provide raw HTML or Markdown. The service compiles typography styling and produces a vector-rendered PDF document.
        </p>

        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.rendernest.com/v1/convert/pdf \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Monthly Report\\n\\n### Executive Summary\\nAll targets exceeded.",
    "title": "Monthly Performance Report"
  }'`}
        />
      </div>

      {/* CONVERT DOCX */}
      <div className="space-y-4 pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
          <span className="text-zinc-300">/v1/convert/docx</span>
          <span className="ml-auto text-zinc-400">Cost: 5 Credits</span>
        </div>

        <p className="text-xs text-zinc-400">
          Parses headings, paragraphs, bullet lists, bold and code text, compiling them into a binary Microsoft Word (.docx) document.
        </p>

        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.rendernest.com/v1/convert/docx \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Architecture Spec\\n\\n- Component A\\n- Component B",
    "title": "Architecture Specification"
  }'`}
        />

        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432190_1a2b3c",
  "data": {
    "file_url": "https://api.rendernest.com/api/storage/converted/ws_demo/req_1725432190_1a2b3c.docx?expires=...",
    "format": "docx",
    "file_size_bytes": 14208
  }
}`}
        />
      </div>
    </div>
  );
}

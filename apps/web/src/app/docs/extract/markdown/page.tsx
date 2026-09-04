import CodeBlock from '@/components/CodeBlock';

export default function ExtractMarkdownDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Extract
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Markdown Extraction</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Convert any webpage into clean, semantic GitHub-Flavored Markdown (GFM). Preserves headings, lists, tables, code blocks, links, and image references. Ideal for feeding LLM agents and RAG pipelines.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
        <span className="text-zinc-300">/v1/extract/markdown</span>
        <span className="ml-auto text-zinc-400">Cost: 2 Credits</span>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Code Example</h2>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.rendernest.com/v1/extract/markdown \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/docs"
  }'`}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Response Example</h2>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432150_2a1b9c",
  "data": {
    "url": "https://example.com/docs",
    "title": "Documentation Overview",
    "description": "Getting started guide",
    "markdown": "# Documentation Overview\\n\\nWelcome to the documentation...\\n\\n| Feature | Status |\\n| --- | --- |\\n| API | Operational |",
    "word_count": 420,
    "links_count": 18,
    "images_count": 3
  }
}`}
        />
      </div>
    </div>
  );
}

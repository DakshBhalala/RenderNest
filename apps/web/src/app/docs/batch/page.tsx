import CodeBlock from '@/components/CodeBlock';

export default function BatchDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Async & Automation
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Batch Processing API</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Queue large processing jobs across multiple URLs asynchronously. Background workers execute the tasks with bounded retries and deliver notifications when complete.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
          <span className="text-zinc-300">/v1/batch</span>
        </div>

        <p className="text-xs text-zinc-400">
          Enqueues up to 100 URLs for parallel or queued execution. Returns an immediate job identifier and poll URL.
        </p>

        <CodeBlock
          language="bash"
          code={`curl -X POST https://api.rendernest.com/v1/batch \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operation": "extract/markdown",
    "urls": [
      "https://example.com/page-1",
      "https://example.com/page-2",
      "https://example.com/page-3"
    ],
    "webhook_url": "https://customer.com/webhooks/RenderNest"
  }'`}
        />

        <CodeBlock
          filename="Immediate Enqueue Response"
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432200_8b7a6c",
  "data": {
    "job_id": "clz19x0abc001",
    "status": "queued",
    "items_count": 3,
    "poll_url": "/v1/jobs/clz19x0abc001"
  }
}`}
        />
      </div>

      <div className="space-y-4 pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded bg-blue-500/20 px-2.5 py-1 text-blue-400 font-bold">GET</span>
          <span className="text-zinc-300">/v1/jobs/:jobId</span>
        </div>

        <p className="text-xs text-zinc-400">
          Check status, progression counters, and completed outputs of any job.
        </p>

        <CodeBlock
          language="bash"
          code={`curl -X GET https://api.rendernest.com/v1/jobs/clz19x0abc001 \\
  -H "Authorization: Bearer wf_live_xxxx"`}
        />

        <CodeBlock
          filename="Job Status Response"
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432205_1c2d3e",
  "data": {
    "job_id": "clz19x0abc001",
    "operation": "extract/markdown",
    "status": "completed",
    "retry_count": 0,
    "created_at": "2026-09-04T04:10:00.000Z",
    "started_at": "2026-09-04T04:10:01.000Z",
    "completed_at": "2026-09-04T04:10:04.000Z",
    "output": {
      "total": 3,
      "completed": 3,
      "failed": 0,
      "results": [
        { "url": "https://example.com/page-1", "success": true, "data": { "markdown": "# Page 1..." } },
        { "url": "https://example.com/page-2", "success": true, "data": { "markdown": "# Page 2..." } },
        { "url": "https://example.com/page-3", "success": true, "data": { "markdown": "# Page 3..." } }
      ]
    }
  }
}`}
        />
      </div>
    </div>
  );
}

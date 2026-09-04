import CodeBlock from '@/components/CodeBlock';
import { ERROR_CODES } from '@rendernest/shared';

export default function ErrorsDocs() {
  const errorDefinitions = [
    { code: 'INVALID_API_KEY', status: 401, desc: 'API key is missing, malformed, deactivated, or revoked.' },
    { code: 'INVALID_URL', status: 400, desc: 'URL string is empty, unparseable, or uses an unsupported protocol.' },
    { code: 'URL_BLOCKED', status: 403, desc: 'Target host resolves to private, loopback, or cloud metadata network.' },
    { code: 'RATE_LIMITED', status: 429, desc: 'Workspace has exceeded its requests-per-minute ceiling.' },
    { code: 'QUOTA_EXCEEDED', status: 402, desc: 'Insufficient credit balance in workspace to pay for operation.' },
    { code: 'TIMEOUT', status: 504, desc: 'Target website did not finish loading within the allowed timeout window.' },
    { code: 'RENDER_FAILED', status: 502, desc: 'Chromium headless engine encountered a crash or navigation failure.' },
    { code: 'EXTRACTION_FAILED', status: 502, desc: 'Parser or structured extractor was unable to decode page content.' },
    { code: 'ANALYSIS_FAILED', status: 502, desc: 'Analysis heuristics could not parse document structure.' },
    { code: 'INVALID_REQUEST', status: 422, desc: 'Payload failed JSON schema validation rules.' },
    { code: 'NOT_FOUND', status: 404, desc: 'Requested job or resource could not be found.' },
    { code: 'INTERNAL_ERROR', status: 500, desc: 'An unexpected internal error occurred. Traced via request_id.' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Reference
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Errors & Codes</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          RenderNest uses standard HTTP status codes combined with machine-readable error codes.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Standard Error Schema</h2>
        <CodeBlock
          language="json"
          code={`{
  "success": false,
  "request_id": "req_1725432100_9f8e7d",
  "error": {
    "code": "URL_BLOCKED",
    "message": "The target address resolves to a restricted or private destination.",
    "details": {}
  }
}`}
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
              <th className="py-3 px-4 font-medium">Error Code</th>
              <th className="py-3 px-4 font-medium">HTTP Status</th>
              <th className="py-3 px-4 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
            {errorDefinitions.map((err) => (
              <tr key={err.code} className="hover:bg-zinc-900/30">
                <td className="py-3 px-4 text-emerald-400">{err.code}</td>
                <td className="py-3 px-4 text-zinc-400 font-sans">{err.status}</td>
                <td className="py-3 px-4 font-sans text-zinc-400">{err.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

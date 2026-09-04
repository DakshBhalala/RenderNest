import CodeBlock from '@/components/CodeBlock';
import { PLANS } from '@rendernest/shared';

export default function RateLimitsDocs() {
  const planList = Object.values(PLANS);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Reference
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Rate Limits</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Rate limits ensure cluster stability and prevent noisy-neighbor congestion. Limits apply at the workspace level across all active API keys.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
              <th className="py-3 px-4 font-medium">Plan Tier</th>
              <th className="py-3 px-4 font-medium">Requests Per Minute (RPM)</th>
              <th className="py-3 px-4 font-medium">Max Concurrency</th>
              <th className="py-3 px-4 font-medium">Monthly Credit Quota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
            {planList.map((plan) => (
              <tr key={plan.id} className="hover:bg-zinc-900/30">
                <td className="py-3 px-4 font-sans font-semibold text-white">{plan.name}</td>
                <td className="py-3 px-4 text-emerald-400">{plan.rateLimitRpm} RPM</td>
                <td className="py-3 px-4 text-zinc-400">{plan.maxConcurrency} concurrent</td>
                <td className="py-3 px-4 text-zinc-300">{plan.monthlyCredits.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">Handling HTTP 429</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          When rate limits are breached, RenderNest responds with HTTP 429 Too Many Requests and a <code className="text-emerald-400">RATE_LIMITED</code> error code. Client applications should implement exponential backoff with jitter before retrying.
        </p>

        <CodeBlock
          language="json"
          code={`{
  "success": false,
  "request_id": "req_1725432100_9f8e7d",
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit of 120 RPM exceeded for workspace tier 'starter'. Please retry in a few seconds."
  }
}`}
        />
      </div>
    </div>
  );
}

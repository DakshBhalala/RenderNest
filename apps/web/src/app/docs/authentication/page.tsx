import CodeBlock from '@/components/CodeBlock';

export default function AuthenticationDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Authentication
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">API Key Security</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          RenderNest authenticates all API requests using cryptographically generated Bearer tokens.
        </p>
      </div>

      <div className="space-y-6 text-xs text-zinc-300">
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white">Header Format</h2>
          <p className="text-zinc-400">
            Pass your API key in the standard HTTP <code className="text-emerald-400">Authorization</code> header prefixed with <code className="text-emerald-400">Bearer</code>:
          </p>

          <CodeBlock
            language="bash"
            code={`Authorization: Bearer wf_live_9a7b8c1d2e3f405162738495a6b7c8d9`}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-white">Key Environments</h2>
          <p className="text-zinc-400">
            RenderNest supports two distinct key environments:
          </p>
          <ul className="space-y-2 list-disc pl-4 text-zinc-400">
            <li>
              <strong className="text-white">Live (<code className="text-emerald-400">wf_live_...</code>):</strong> Production keys connected to live billing and real quota balances.
            </li>
            <li>
              <strong className="text-white">Test (<code className="text-blue-400">wf_test_...</code>):</strong> Sandbox keys for CI/CD, unit testing, and isolated staging workloads.
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-white">Security Architecture</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
            <p className="text-zinc-400">
              RenderNest never stores your raw API keys in plain text. Keys are hashed with SHA-256 upon generation. When an authenticated request arrives, its hash is verified against the database index.
            </p>
            <p className="text-zinc-400">
              If a key is compromised, revoke it immediately from the dashboard. Revocation takes effect instantly across all edge workers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import CodeBlock from '@/components/CodeBlock';

export default function WebhooksDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Async & Automation
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Webhooks & HMAC Verification</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Receive real-time event notifications when asynchronous jobs complete or fail. Every delivery includes an HMAC-SHA256 signature to prevent spoofing and replay attacks.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Supported Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="font-mono font-bold text-emerald-400">job.completed</div>
            <div className="text-zinc-400 mt-1">Fired when all items in an asynchronous batch job have finished.</div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="font-mono font-bold text-rose-400">job.failed</div>
            <div className="text-zinc-400 mt-1">Fired when all attempts of a job have permanently failed.</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Verifying Signatures</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          RenderNest signs all webhook HTTP requests using your endpoint signing secret (<code className="text-emerald-400">whsec_...</code>). The signature is passed in the <code className="text-emerald-400">X-RenderNest-Signature</code> header in the format <code className="text-emerald-400">t=timestamp,v1=signature</code>.
        </p>

        <CodeBlock
          filename="Signature Verification Example (Node.js)"
          language="javascript"
          code={`import crypto from 'crypto';

export function verifyRenderNestSignature(rawBody, signatureHeader, secret) {
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => p.split('='))
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  // Prevent replay attacks (tolerance: 5 minutes)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > 300) {
    throw new Error('Webhook timestamp too old');
  }

  const payload = \`\${timestamp}.\${rawBody}\`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Payload Structure</h2>
        <CodeBlock
          filename="Webhook Event Payload"
          language="json"
          code={`{
  "event": "job.completed",
  "job_id": "clz19x0abc001",
  "request_id": "req_clz19x0abc001",
  "timestamp": "2026-09-04T04:10:04.000Z",
  "data": {
    "operation": "extract/markdown",
    "total": 3,
    "completed": 3,
    "failed": 0,
    "results": [...]
  }
}`}
        />
      </div>
    </div>
  );
}

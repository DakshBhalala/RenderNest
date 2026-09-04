import CodeBlock from '@/components/CodeBlock';

export default function ScreenshotDocs() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
          Render
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Screenshot API</h1>
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
          Capture high-fidelity screenshots in PNG, JPEG, or WebP formats using headless Chromium with custom viewports, device scale factors, and wait delays.
        </p>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold">POST</span>
        <span className="text-zinc-300">/v1/render/screenshot</span>
        <span className="ml-auto text-zinc-400">Cost: 1 Credit</span>
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
                <td className="py-2.5 px-3 text-zinc-400">string (required)</td>
                <td className="py-2.5 px-3">-</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Target web address (must be http or https)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">format</td>
                <td className="py-2.5 px-3 text-zinc-400">string</td>
                <td className="py-2.5 px-3">"png"</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Image format: png, jpeg, webp</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">full_page</td>
                <td className="py-2.5 px-3 text-zinc-400">boolean</td>
                <td className="py-2.5 px-3">true</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Capture entire scrollable page height</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">width</td>
                <td className="py-2.5 px-3 text-zinc-400">integer</td>
                <td className="py-2.5 px-3">1440</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Viewport width in pixels (320 - 3840)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">height</td>
                <td className="py-2.5 px-3 text-zinc-400">integer</td>
                <td className="py-2.5 px-3">900</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Viewport height in pixels (240 - 2160)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">device_scale_factor</td>
                <td className="py-2.5 px-3 text-zinc-400">number</td>
                <td className="py-2.5 px-3">1</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Pixel density multiplier (e.g. 2 for Retina)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400">delay_ms</td>
                <td className="py-2.5 px-3 text-zinc-400">integer</td>
                <td className="py-2.5 px-3">0</td>
                <td className="py-2.5 px-3 font-sans text-zinc-400">Milliseconds to wait after load before capture</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Code Example</h2>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://api-rendernest.duckdns.org/v1/render/screenshot \\
  -H "Authorization: Bearer wf_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "png",
    "full_page": true,
    "width": 1440,
    "height": 900
  }'`}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Response Example</h2>
        <CodeBlock
          language="json"
          code={`{
  "success": true,
  "request_id": "req_1725432120_8a7c2b",
  "data": {
    "url": "https://example.com",
    "format": "png",
    "file_url": "https://api-rendernest.duckdns.org/api/storage/screenshots/ws_demo/req_1725432120_8a7c2b.png?expires=1726036920&signature=...",
    "width": 1440,
    "height": 900,
    "file_size_bytes": 148291
  }
}`}
        />
      </div>
    </div>
  );
}

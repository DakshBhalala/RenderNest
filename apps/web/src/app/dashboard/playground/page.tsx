'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Copy,
  Check,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  FileText,
  Eye,
  Terminal,
} from 'lucide-react';
import { OPERATIONS } from '@rendernest/shared';

export default function PlaygroundPage() {
  const [endpoint, setEndpoint] = useState('render/screenshot');
  const [apiKey, setApiKey] = useState('wf_live_dev_test_rendernest_key_12345');
  const [keysList, setKeysList] = useState<any[]>([]);

  // Form State
  const [url, setUrl] = useState('https://news.ycombinator.com');
  const [format, setFormat] = useState('png');
  const [fullPage, setFullPage] = useState(false);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(800);
  const [jsonSchemaText, setJsonSchemaText] = useState(
    JSON.stringify({ title: 'string', word_count: 'number' }, null, 2)
  );
  const [urlA, setUrlA] = useState('https://example.com');
  const [urlB, setUrlB] = useState('https://iana.org');
  const [markdownInput, setMarkdownInput] = useState(
    '# RenderNest Document\n\n- Rendered in seconds\n- High fidelity\n\n```js\nconst status = "success";\n```'
  );

  // Execution State
  const [running, setRunning] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'preview' | 'json' | 'code'>('preview');
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetch('/api/keys')
      .then((r) => r.json())
      .then((d) => {
        if (d.keys && d.keys.length > 0) {
          setKeysList(d.keys);
        }
      })
      .catch(() => {});
  }, []);

  const opDef = OPERATIONS[endpoint] || OPERATIONS['render/screenshot'];

  // Build Payload based on current endpoint
  const getPayload = () => {
    switch (endpoint) {
      case 'render/screenshot':
        return {
          url,
          format,
          full_page: fullPage,
          width,
          height,
        };
      case 'render/pdf':
        return {
          url,
          format: 'A4',
          landscape: false,
          print_background: true,
        };
      case 'extract/text':
      case 'extract/markdown':
      case 'inspect':
      case 'analyze':
        return { url };
      case 'extract/json': {
        let schemaObj = {};
        try {
          schemaObj = JSON.parse(jsonSchemaText);
        } catch {
          schemaObj = { title: 'string' };
        }
        return { url, schema: schemaObj };
      }
      case 'compare':
        return { url_a: urlA, url_b: urlB, tolerance: 0.1 };
      case 'convert/pdf':
        return { markdown: markdownInput, title: 'Converted Document' };
      case 'convert/docx':
        return { markdown: markdownInput, title: 'Converted Document' };
      default:
        return { url };
    }
  };

  const handleRunRequest = async () => {
    setRunning(true);
    setStatusCode(null);
    setResponseJson(null);
    setErrorMessage(null);
    const start = Date.now();

    try {
      const payload = getPayload();
      const res = await fetch(`/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const elapsed = Date.now() - start;
      setLatency(elapsed);
      setStatusCode(res.status);

      const json = await res.json();
      setResponseJson(json);
      if (!res.ok) {
        setErrorMessage(json.error?.message || `Request failed with status ${res.status}`);
      }
    } catch (err: any) {
      setLatency(Date.now() - start);
      setStatusCode(500);
      setErrorMessage(err.message || 'Network request failed');
    } finally {
      setRunning(false);
    }
  };

  // Generate code snippet
  const payloadStr = JSON.stringify(getPayload(), null, 2);
  const codeSnippets = {
    curl: `curl -X POST https://api.rendernest.com/v1/${endpoint} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${payloadStr}'`,
    js: `const response = await fetch("https://api.rendernest.com/v1/${endpoint}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${payloadStr})
});

const data = await response.json();
console.log(data);`,
    python: `import requests

response = requests.post(
    "https://api.rendernest.com/v1/${endpoint}",
    headers={
        "Authorization": "Bearer ${apiKey}",
        "Content-Type": "application/json"
    },
    json=${payloadStr}
)

print(response.json())`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[codeLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">API Playground</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Interactively test all RenderNest endpoints with real rendering and extraction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: REQUEST BUILDER */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-5 space-y-4">
            {/* ENDPOINT SELECTOR */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Select Endpoint</label>
              <select
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
              >
                {Object.values(OPERATIONS)
                  .filter((op) => op.operation !== 'batch')
                  .map((op) => (
                    <option key={op.operation} value={op.operation}>
                      POST /v1/{op.operation} ({op.credits} credit{op.credits > 1 ? 's' : ''})
                    </option>
                  ))}
              </select>
            </div>

            {/* API KEY INPUT */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
                placeholder="wf_live_..."
              />
            </div>

            {/* DYNAMIC ENDPOINT FIELDS */}
            {endpoint !== 'compare' && !endpoint.startsWith('convert') && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Target URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {endpoint === 'render/screenshot' && (
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Format</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-200"
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fullPage}
                        onChange={(e) => setFullPage(e.target.checked)}
                        className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                      />
                      Full Page
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                      className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                      className="w-full rounded bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {endpoint === 'extract/json' && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <label className="block text-[11px] text-zinc-400">Schema Definition (JSON)</label>
                <textarea
                  rows={4}
                  value={jsonSchemaText}
                  onChange={(e) => setJsonSchemaText(e.target.value)}
                  className="w-full rounded bg-zinc-900 border border-zinc-700 p-2 text-xs font-mono text-emerald-400 focus:outline-none"
                />
              </div>
            )}

            {endpoint === 'compare' && (
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">URL A (Baseline)</label>
                  <input
                    type="url"
                    value={urlA}
                    onChange={(e) => setUrlA(e.target.value)}
                    className="w-full rounded bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">URL B (Comparison)</label>
                  <input
                    type="url"
                    value={urlB}
                    onChange={(e) => setUrlB(e.target.value)}
                    className="w-full rounded bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}

            {endpoint.startsWith('convert') && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <label className="block text-[11px] text-zinc-400">Markdown Content</label>
                <textarea
                  rows={6}
                  value={markdownInput}
                  onChange={(e) => setMarkdownInput(e.target.value)}
                  className="w-full rounded bg-zinc-900 border border-zinc-700 p-2 text-xs font-mono text-zinc-200 focus:outline-none"
                />
              </div>
            )}

            {/* RUN BUTTON */}
            <button
              onClick={handleRunRequest}
              disabled={running}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-all shadow-md disabled:opacity-50"
            >
              <Play className={`h-4 w-4 ${running ? 'animate-spin' : 'fill-zinc-950'}`} />
              {running ? 'Executing operation...' : 'Run request'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE OUTPUT & PREVIEW */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden flex flex-col h-[640px]">
            {/* TABS & STATUS BAR */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
                    previewTab === 'preview'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Visual Preview
                </button>
                <button
                  onClick={() => setPreviewTab('json')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
                    previewTab === 'json'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  JSON Response
                </button>
                <button
                  onClick={() => setPreviewTab('code')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
                    previewTab === 'code'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Integration Code
                </button>
              </div>

              {/* TIMING STATUS PILL */}
              <div className="flex items-center gap-2 text-xs">
                {statusCode !== null && (
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                      statusCode >= 200 && statusCode < 300
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {statusCode} {statusCode === 200 ? 'OK' : 'Error'}
                  </span>
                )}
                {latency !== null && (
                  <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {latency}ms
                  </span>
                )}
              </div>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 p-5 overflow-y-auto bg-[#090a0f]">
              {errorMessage && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. VISUAL PREVIEW TAB */}
              {previewTab === 'preview' && (
                <div className="h-full flex flex-col justify-center items-center text-center">
                  {running && (
                    <div className="space-y-3">
                      <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                      <p className="text-xs text-zinc-400">Processing via RenderNest engine...</p>
                    </div>
                  )}

                  {!running && !responseJson && (
                    <div className="text-xs text-zinc-400 max-w-sm">
                      <Terminal className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
                      Configure parameters on the left and click <strong>Run request</strong> to view live outputs.
                    </div>
                  )}

                  {!running && responseJson && responseJson.data && (
                    <div className="w-full text-left space-y-4">
                      {/* Screenshot / Diff Image Preview */}
                      {(responseJson.data.file_url && responseJson.data.format !== 'pdf' && responseJson.data.format !== 'docx') ||
                      responseJson.data.difference_image_url ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span>Rendered Media Output</span>
                            <a
                              href={responseJson.data.file_url || responseJson.data.difference_image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              Open Full Size <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 overflow-hidden max-h-[440px] overflow-y-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={responseJson.data.file_url || responseJson.data.difference_image_url}
                              alt="Rendered Output"
                              className="w-full h-auto rounded border border-zinc-800"
                            />
                          </div>
                        </div>
                      ) : null}

                      {/* PDF Preview / Download */}
                      {responseJson.data.format === 'pdf' && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center space-y-3">
                          <FileText className="h-10 w-10 text-emerald-400 mx-auto" />
                          <h4 className="text-sm font-bold text-white">PDF Document Generated</h4>
                          <p className="text-xs text-zinc-400">Size: {responseJson.data.file_size_bytes} bytes</p>
                          <a
                            href={responseJson.data.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download PDF Document
                          </a>
                        </div>
                      )}

                      {/* Markdown Preview */}
                      {responseJson.data.markdown && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-zinc-400">Markdown Content</div>
                          <pre className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-200 overflow-x-auto whitespace-pre-wrap max-h-[460px]">
                            {responseJson.data.markdown}
                          </pre>
                        </div>
                      )}

                      {/* Extracted JSON / Inspect / Analyze */}
                      {responseJson.data.extracted_data && (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-zinc-400">Structured Data</div>
                          <pre className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[460px]">
                            {JSON.stringify(responseJson.data.extracted_data, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Analysis Score Badge */}
                      {responseJson.data.score !== undefined && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">Composite Quality Score</span>
                            <span className="text-2xl font-extrabold text-emerald-400">
                              {responseJson.data.score} / 100
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                              <span className="text-zinc-400">SEO:</span>{' '}
                              <span className="font-bold text-white">{responseJson.data.metrics?.seo_score}%</span>
                            </div>
                            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                              <span className="text-zinc-400">Social:</span>{' '}
                              <span className="font-bold text-white">{responseJson.data.metrics?.social_score}%</span>
                            </div>
                            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                              <span className="text-zinc-400">A11y:</span>{' '}
                              <span className="font-bold text-white">{responseJson.data.metrics?.accessibility_score}%</span>
                            </div>
                            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                              <span className="text-zinc-400">Content:</span>{' '}
                              <span className="font-bold text-white">{responseJson.data.metrics?.content_score}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. JSON RESPONSE TAB */}
              {previewTab === 'json' && (
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto">
                    {responseJson ? JSON.stringify(responseJson, null, 2) : '// No response yet'}
                  </pre>
                </div>
              )}

              {/* 3. INTEGRATION CODE TAB */}
              {previewTab === 'code' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {(['curl', 'js', 'python'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setCodeLang(lang)}
                          className={`px-2.5 py-1 text-xs font-mono rounded ${
                            codeLang === lang
                              ? 'bg-zinc-800 text-emerald-400 font-bold border border-zinc-700'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                    {codeSnippets[codeLang]}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

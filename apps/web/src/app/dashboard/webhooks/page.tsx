'use client';

import { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  Copy,
  Check,
  Trash2,
  Send,
  Power,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface WebhookItem {
  id: string;
  url: string;
  secretPrefix: string;
  events: string;
  active: boolean;
  createdAt: string;
  deliveries: any[];
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['job.completed', 'job.failed']);
  const [saving, setSaving] = useState(false);

  // Secret Modal
  const [secretModal, setSecretModal] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Test Ping State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhooks');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, events }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create webhook');

      setAddOpen(false);
      setUrl('');
      setSecretModal(data.signing_secret);
      await fetchWebhooks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await fetch(`/api/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentActive }),
    });
    await fetchWebhooks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) return;
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    await fetchWebhooks();
  };

  const handleTestPing = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
      await fetchWebhooks();
    } catch (err: any) {
      setTestResult({ success: false, response_body: err.message });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Webhooks</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure HTTP callbacks for event notifications when asynchronous jobs complete or fail.
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add endpoint
        </button>
      </div>

      {/* SECRET MODAL */}
      {secretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-emerald-500/40 bg-[#0c0e15] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Save your signing secret</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Use this secret to verify HMAC signatures in the <code className="text-emerald-400">X-RenderNest-Signature</code> header. It will not be shown again.
            </p>

            <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs text-emerald-400">
              <span className="truncate flex-1">{secretModal}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(secretModal);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
                className="flex items-center gap-1 rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:text-white"
              >
                {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSecretModal(null)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD WEBHOOK MODAL */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add Webhook Endpoint</h3>
            <p className="text-xs text-zinc-400 mb-4">RenderNest will dispatch signed POST requests to this URL.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Endpoint URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/RenderNest"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">Subscribed Events</label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={events.includes('job.completed')}
                      onChange={(e) => {
                        if (e.target.checked) setEvents([...events, 'job.completed']);
                        else setEvents(events.filter((x) => x !== 'job.completed'));
                      }}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500"
                    />
                    <span className="font-mono text-emerald-400 font-medium">job.completed</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={events.includes('job.failed')}
                      onChange={(e) => {
                        if (e.target.checked) setEvents([...events, 'job.failed']);
                        else setEvents(events.filter((x) => x !== 'job.failed'));
                      }}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500"
                    />
                    <span className="font-mono text-rose-400 font-medium">job.failed</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !url}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEST PING RESULT ALERT */}
      {testResult && (
        <div
          className={`rounded-xl border p-4 flex items-center justify-between text-xs ${
            testResult.success
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
              : 'border-red-500/30 bg-red-950/20 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {testResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <div>
              <div className="font-semibold text-white">
                {testResult.success ? 'Webhook Delivered Successfully' : 'Webhook Delivery Failed'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                HTTP {testResult.status_code || 0} • Duration: {testResult.duration_ms || 0}ms • Response:{' '}
                {testResult.response_body || 'None'}
              </div>
            </div>
          </div>
          <button onClick={() => setTestResult(null)} className="text-zinc-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* WEBHOOKS LIST */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading webhooks...</div>
        ) : webhooks.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400">
            <Radio className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
            <div className="font-semibold text-white mb-1">No webhooks configured</div>
            <p className="text-zinc-400 mb-4">Add a destination URL to receive notifications on completed batch jobs.</p>
            <button
              onClick={() => setAddOpen(true)}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              Add endpoint
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Endpoint URL</th>
                  <th className="py-3 px-4 font-medium">Events</th>
                  <th className="py-3 px-4 font-medium">Secret Prefix</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                {webhooks.map((wh) => (
                  <tr key={wh.id} className="hover:bg-zinc-900/30">
                    <td className="py-3 px-4 font-sans text-white font-medium truncate max-w-xs">{wh.url}</td>
                    <td className="py-3 px-4 text-emerald-400 text-[11px]">{wh.events}</td>
                    <td className="py-3 px-4 text-zinc-400">{wh.secretPrefix}...</td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          wh.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${wh.active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        {wh.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 font-sans">
                      <button
                        onClick={() => handleTestPing(wh.id)}
                        disabled={testingId === wh.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                        title="Send mock webhook ping"
                      >
                        <Send className={`h-3 w-3 ${testingId === wh.id ? 'animate-spin' : ''}`} />
                        <span>Ping</span>
                      </button>
                      <button
                        onClick={() => handleToggle(wh.id, wh.active)}
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                        title={wh.active ? 'Disable' : 'Enable'}
                      >
                        <Power className={`h-4 w-4 ${wh.active ? 'text-amber-400' : 'text-emerald-400'}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
                        title="Delete webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

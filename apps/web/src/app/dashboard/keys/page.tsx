'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Power,
  ExternalLink,
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  environment: string;
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [creating, setCreating] = useState(false);

  // Newly Created Key Dialog
  const [rawKeyModal, setRawKeyModal] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error('Failed to load keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName, environment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');

      setCreateOpen(false);
      setKeyName('');
      setRawKeyModal(data.raw_key);
      await fetchKeys();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'revoked' : 'active';
    await fetch(`/api/keys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    await fetchKeys();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action is irreversible.')) {
      return;
    }
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    await fetchKeys();
  };

  const handleCopyRawKey = () => {
    if (rawKeyModal) {
      navigator.clipboard.writeText(rawKeyModal);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Keys</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage authentication credentials for your applications, CI/CD, and agent pipelines.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create new API key
        </button>
      </div>

      {/* RAW KEY DISPLAY MODAL */}
      {rawKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-emerald-500/40 bg-[#0c0e15] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Save your API key now</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Please copy your API key and store it securely. For security reasons,{' '}
              <strong className="text-white">you will never be able to see this key again</strong>.
            </p>

            <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
              <code className="font-mono text-xs text-emerald-400 select-all break-all flex-1">
                {rawKeyModal}
              </code>
              <button
                onClick={handleCopyRawKey}
                className="flex items-center gap-1 rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors shrink-0"
              >
                {copiedRaw ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedRaw ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setRawKeyModal(null)}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
              >
                I have stored my key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE KEY MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create API Key</h3>
            <p className="text-xs text-zinc-400 mb-4">Generate a new key to authenticate API requests.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Key Name</label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Backend, CI Pipeline"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="live">Live (wf_live_...)</option>
                  <option value="test">Test (wf_test_...)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Generating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KEYS TABLE */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400">
            <Key className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
            <div className="font-semibold text-white mb-1">No API keys created</div>
            <p className="text-zinc-400 mb-4">Generate an API key to begin issuing requests to RenderNest.</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              Create key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Prefix</th>
                  <th className="py-3 px-4 font-medium">Environment</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Created</th>
                  <th className="py-3 px-4 font-medium">Last Used</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {keys.map((k) => {
                  const isActive = k.status === 'active';
                  return (
                    <tr key={k.id} className="hover:bg-zinc-900/30">
                      <td className="py-3 px-4 font-medium text-white">{k.name}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">{k.keyPrefix}...</td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                            k.environment === 'live'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {k.environment}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          {isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-sans">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-sans">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(k.id, k.status)}
                          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                          title={isActive ? 'Revoke key' : 'Activate key'}
                        >
                          <Power className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-emerald-400'}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id)}
                          className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800 transition-colors"
                          title="Delete key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  X,
  Clock,
  Coins,
  FileCode,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { OPERATIONS } from '@rendernest/shared';

export default function RequestLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [endpoint, setEndpoint] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (endpoint !== 'all') params.append('endpoint', endpoint);
      if (status !== 'all') params.append('status', status);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/requests?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load request logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [endpoint, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Request Logs</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time execution log of API calls across all endpoints and environments.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh logs
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-[#0c0e15] p-3">
        {/* ENDPOINT SELECT */}
        <select
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="all">All Endpoints</option>
          {Object.values(OPERATIONS).map((op) => (
            <option key={op.operation} value={op.operation}>
              {op.operation}
            </option>
          ))}
        </select>

        {/* STATUS SELECT */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="200">2xx Success</option>
          <option value="400">4xx Client Error</option>
          <option value="500">5xx Server Error</option>
        </select>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Request ID, URL or error..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
          >
            Filter
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading requests...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400">
            <FileCode className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
            <div className="font-semibold text-white mb-1">No matching requests found</div>
            <p className="text-zinc-400">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Endpoint</th>
                  <th className="py-3 px-4 font-medium">Request ID</th>
                  <th className="py-3 px-4 font-medium">Latency</th>
                  <th className="py-3 px-4 font-medium">Credits</th>
                  <th className="py-3 px-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                {logs.map((log) => {
                  const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-medium text-white">{log.endpoint}</td>
                      <td className="py-3 px-4 text-zinc-400 truncate max-w-[160px]">{log.id}</td>
                      <td className="py-3 px-4 text-zinc-400">{log.latencyMs} ms</td>
                      <td className="py-3 px-4 text-emerald-400">+{log.credits}</td>
                      <td className="py-3 px-4 text-zinc-400 font-sans text-[11px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-3 bg-zinc-900/30 text-xs text-zinc-400">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="rounded px-2.5 py-1 bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="rounded px-2.5 py-1 bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl h-full bg-[#0c0e15] border-l border-zinc-800 p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedLog.endpoint}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                      selectedLog.statusCode >= 200 && selectedLog.statusCode < 300
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {selectedLog.statusCode}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-400">Duration</div>
                <div className="font-mono text-white mt-0.5">{selectedLog.latencyMs} ms</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-400">Credits Deducted</div>
                <div className="font-mono text-emerald-400 mt-0.5">{selectedLog.credits} credits</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-400">Method & Client IP</div>
                <div className="font-mono text-white mt-0.5">
                  {selectedLog.method} • {selectedLog.ipAddress || '127.0.0.1'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-400">Timestamp</div>
                <div className="font-mono text-white mt-0.5">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {selectedLog.errorMessage && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Error Description
                </div>
                <div>{selectedLog.errorMessage}</div>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-zinc-300">Sanitized Request Body</div>
              <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                {selectedLog.requestBodySanitized || '// Empty or unrecorded body'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

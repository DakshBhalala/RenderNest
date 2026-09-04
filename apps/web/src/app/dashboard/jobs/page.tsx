'use client';

import { useState, useEffect } from 'react';
import { Layers, RefreshCw, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Batch Jobs</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track asynchronous multi-URL batch tasks and worker execution states.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh jobs
        </button>
      </div>

      {/* JOBS TABLE */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading background jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400">
            <Layers className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
            <div className="font-semibold text-white mb-1">No background jobs yet</div>
            <p className="text-zinc-400">Submit an asynchronous batch via POST /v1/batch to queue jobs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Job ID</th>
                  <th className="py-3 px-4 font-medium">Operation</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Items</th>
                  <th className="py-3 px-4 font-medium">Created</th>
                  <th className="py-3 px-4 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                {jobs.map((job) => {
                  const isDone = job.status === 'completed';
                  const isProcessing = job.status === 'processing';
                  const isFailed = job.status === 'failed';

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-white truncate max-w-[140px]">{job.id}</td>
                      <td className="py-3 px-4 text-emerald-400 font-sans font-medium">{job.operation}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium font-sans ${
                            isDone
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isProcessing
                              ? 'bg-blue-500/10 text-blue-400'
                              : isFailed
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-400'
                                : isProcessing
                                ? 'bg-blue-400 animate-pulse'
                                : isFailed
                                ? 'bg-red-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-zinc-400">
                        {job.input?.urls?.length || 0} URLs
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-sans text-[11px]">
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-sans text-[11px]">
                        {job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : 'In progress'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JOB DETAIL MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Job Details</h3>
                <p className="text-xs font-mono text-zinc-400">{selectedJob.id}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-400">Status</div>
                <div className="font-bold text-emerald-400 capitalize mt-0.5">{selectedJob.status}</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-400">Operation</div>
                <div className="font-mono text-white mt-0.5">{selectedJob.operation}</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-400">Retries</div>
                <div className="font-mono text-white mt-0.5">{selectedJob.retryCount}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold text-zinc-300">Target URLs</div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-zinc-300 space-y-1 max-h-36 overflow-y-auto">
                {selectedJob.input?.urls?.map((u: string, idx: number) => (
                  <div key={idx} className="truncate text-emerald-400">
                    {idx + 1}. {u}
                  </div>
                ))}
              </div>
            </div>

            {selectedJob.output && (
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-zinc-300">Job Output Data</div>
                <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-zinc-300 overflow-x-auto max-h-60 text-xs">
                  {JSON.stringify(selectedJob.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
  Terminal,
  Key,
  Layers,
  TrendingUp,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/usage').then((r) => r.json()),
      fetch('/api/requests?limit=5').then((r) => r.json()),
    ])
      .then(([usageData, reqData]) => {
        setData(usageData);
        setRecentLogs(reqData.logs || []);
      })
      .catch((err) => console.error('Error fetching dashboard overview:', err))
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics || {
    totalRequests: 0,
    successfulRequests: 0,
    successRate: 100,
    totalCreditsUsed: 0,
    averageLatencyMs: 0,
  };

  const workspace = data?.workspace || {
    name: 'Workspace',
    creditBalance: 500,
    planTier: 'free',
    planMaxCredits: 500,
  };

  const creditUsedPercent = Math.min(
    100,
    Math.round((metrics.totalCreditsUsed / (workspace.planMaxCredits || 500)) * 100)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Overview</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time performance metrics and credit activity for {workspace.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/playground"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <Terminal className="h-3.5 w-3.5" />
            Open Playground
          </Link>
          <Link
            href="/dashboard/keys"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Key className="h-3.5 w-3.5" />
            API Keys
          </Link>
        </div>
      </div>

      {/* 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Total Requests</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.totalRequests.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span>Past 30 days</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Success Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.successRate}%</div>
          <div className="mt-2 text-[11px] text-zinc-400">
            {metrics.successfulRequests.toLocaleString()} successful
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Average Latency</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.averageLatencyMs} ms</div>
          <div className="mt-2 text-[11px] text-zinc-400">Across all operations</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Credits Used</span>
            <Coins className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.totalCreditsUsed.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            {workspace.creditBalance.toLocaleString()} remaining
          </div>
        </div>
      </div>

      {/* PLAN & USAGE PROGRESS CARD */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Monthly Credit Allowance</h2>
            <p className="text-xs text-zinc-400">
              Active Tier: <span className="text-emerald-400 font-semibold uppercase">{workspace.planTier}</span> ({workspace.planMaxCredits.toLocaleString()} credits / month)
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            Manage subscription <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800 mb-2">
          <div
            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${creditUsedPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-zinc-400">
          <span>{metrics.totalCreditsUsed.toLocaleString()} credits consumed</span>
          <span>{creditUsedPercent}% of monthly quota</span>
        </div>
      </div>

      {/* RECENT REQUESTS TABLE */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/40">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Requests</h3>
            <p className="text-[11px] text-zinc-400">Latest calls to your workspace endpoints.</p>
          </div>
          <Link
            href="/dashboard/requests"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View all logs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            <Layers className="h-8 w-8 text-zinc-400 mx-auto mb-3" />
            <div className="font-medium text-white mb-1">No API requests yet</div>
            <p className="text-zinc-400 mb-4 max-w-sm mx-auto">
              Create an API key and make your first request using cURL or the interactive playground.
            </p>
            <Link
              href="/dashboard/playground"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              Try the playground
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Endpoint</th>
                  <th className="py-2.5 px-4 font-medium">Latency</th>
                  <th className="py-2.5 px-4 font-medium">Credits</th>
                  <th className="py-2.5 px-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                {recentLogs.map((log) => {
                  const isSuccess = log.statusCode >= 200 && log.statusCode < 300;
                  return (
                    <tr key={log.id} className="hover:bg-zinc-900/30">
                      <td className="py-2.5 px-4">
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
                      <td className="py-2.5 px-4 text-white font-sans font-medium">{log.endpoint}</td>
                      <td className="py-2.5 px-4 text-zinc-400">{log.latencyMs} ms</td>
                      <td className="py-2.5 px-4 text-emerald-400">+{log.credits}</td>
                      <td className="py-2.5 px-4 text-zinc-400 font-sans text-[11px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
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

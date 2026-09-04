'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Coins, Activity, Clock, Layers } from 'lucide-react';

export default function UsagePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/usage')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics || { totalRequests: 0, totalCreditsUsed: 0, successRate: 100 };
  const workspace = data?.workspace || { name: 'Workspace', creditBalance: 500, planTier: 'free', planMaxCredits: 500 };
  const breakdown = data?.endpointBreakdown || [];
  const timeSeries = data?.timeSeries || [];

  const maxDailyRequests = Math.max(1, ...timeSeries.map((t: any) => t.requests));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Usage & Quotas</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Detailed breakdown of your credit consumption and request volume.
        </p>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Credits Consumed</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.totalCreditsUsed.toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-zinc-400">Past 30 days</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Remaining Credits</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{workspace.creditBalance.toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-zinc-400">Current active balance</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Rate Limit Ceiling</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{workspace.rateLimitRpm || 30} RPM</div>
          <div className="mt-1 text-[11px] text-zinc-400">{workspace.planTier.toUpperCase()} tier</div>
        </div>
      </div>

      {/* 14-DAY ACTIVITY CHART */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-semibold text-white">Daily Request Volume</h2>
            <p className="text-[11px] text-zinc-400">Requests processed over the past 14 days.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Requests</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 h-44 pt-4 pb-2 border-b border-zinc-800/80">
          {timeSeries.map((day: any) => {
            const heightPercent = Math.max(8, Math.round((day.requests / maxDailyRequests) * 100));
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 rounded bg-zinc-800 px-2 py-1 text-[10px] text-white font-mono pointer-events-none transition-opacity">
                  {day.requests} reqs ({day.credits} cr)
                </div>
                <div
                  className="w-full rounded-t bg-emerald-500/80 hover:bg-emerald-400 transition-all cursor-pointer"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-zinc-400 pt-2 font-mono">
          <span>{timeSeries[0]?.date}</span>
          <span>{timeSeries[timeSeries.length - 1]?.date}</span>
        </div>
      </div>

      {/* ENDPOINT BREAKDOWN TABLE */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] overflow-hidden">
        <div className="border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/40">
          <h3 className="text-sm font-semibold text-white">Consumption by Endpoint</h3>
          <p className="text-[11px] text-zinc-400">Breakdown of calls and credits spent across operations.</p>
        </div>

        {breakdown.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No consumption recorded yet for this billing cycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/40">
                  <th className="py-3 px-4 font-medium">Operation</th>
                  <th className="py-3 px-4 font-medium">Calls</th>
                  <th className="py-3 px-4 font-medium">Total Credits</th>
                  <th className="py-3 px-4 font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                {breakdown.map((row: any) => (
                  <tr key={row.operation} className="hover:bg-zinc-900/30">
                    <td className="py-3 px-4 font-sans font-medium text-white">{row.operation}</td>
                    <td className="py-3 px-4 text-zinc-300">{row.count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-emerald-400">{row.credits.toLocaleString()} credits</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-zinc-400">{row.percentage}%</span>
                      </div>
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

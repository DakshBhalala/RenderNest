'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { PLANS, OPERATIONS } from '@rendernest/shared';

export default function PricingPage() {
  const planList = Object.values(PLANS);
  const operationList = Object.values(OPERATIONS);

  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f]">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Transparent Pricing</h1>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Pay for what you process
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed">
              Every tier grants a monthly credit budget that can be used across all 10 API endpoints. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>

          {/* PLANS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {planList.map((plan) => {
              const isPopular = plan.code === 'growth';
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-6 flex flex-col justify-between transition-all ${
                    isPopular
                      ? 'border-emerald-500/50 bg-emerald-950/10 shadow-lg shadow-emerald-500/5'
                      : 'border-zinc-800 bg-[#0c0e15]'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-zinc-400 min-h-[36px] mb-4">{plan.description}</p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-extrabold text-white">${plan.priceMonthly}</span>
                      <span className="text-xs text-zinc-400">/ month</span>
                    </div>

                    <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3 mb-6">
                      <div className="text-xs font-semibold text-emerald-400">
                        {plan.monthlyCredits.toLocaleString()} Credits / mo
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{plan.rateLimitRpm} requests / min</div>
                    </div>

                    <ul className="space-y-2.5 mb-6 text-xs text-zinc-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/dashboard"
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-center transition-all ${
                      isPopular
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-sm'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {plan.priceMonthly === 0 ? 'Start free' : `Choose ${plan.name}`}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* CREDIT REGISTRY TABLE */}
          <div className="max-w-4xl mx-auto rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 mb-20">
            <h3 className="text-lg font-bold text-white mb-2">Operation Credit Registry</h3>
            <p className="text-xs text-zinc-400 mb-6">
              Credits are deducted atomically upon successful completion of each operation. Failed requests are not charged.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2.5 px-3 font-medium">Operation</th>
                    <th className="py-2.5 px-3 font-medium">Endpoint</th>
                    <th className="py-2.5 px-3 font-medium">Credit Cost</th>
                    <th className="py-2.5 px-3 font-medium">Timeout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                  {operationList.map((op) => (
                    <tr key={op.operation} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-sans font-medium text-white">{op.name}</td>
                      <td className="py-2.5 px-3 text-emerald-400">/v1/{op.operation}</td>
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-200">
                          {op.credits} {op.credits === 1 ? 'credit' : 'credits'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">{op.timeoutMs / 1000}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-white text-center mb-8">Frequently Asked Questions</h3>
            <div className="space-y-4 text-xs">
              {[
                {
                  q: 'What happens if I exhaust my monthly credits?',
                  a: 'Requests will return a 402 QUOTA_EXCEEDED error. You can upgrade your plan or purchase top-up credits directly from your workspace dashboard.',
                },
                {
                  q: 'Are failed requests charged against my quota?',
                  a: 'No. If an operation fails due to target timeout, network unreachability, or internal error, zero credits are deducted from your balance.',
                },
                {
                  q: 'Does RenderNest store my rendered documents permanently?',
                  a: 'By default, generated media files (screenshots, PDFs, and DOCX) are stored in secure expiring storage with a 7-day retention period before automated cleanup.',
                },
                {
                  q: 'Can I use RenderNest in local offline development?',
                  a: 'Yes! RenderNest supports zero-dependency local development with SQLite and local in-memory queues without requiring Docker or cloud providers.',
                },
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="font-semibold text-white mb-1.5">{item.q}</div>
                  <div className="text-zinc-400 leading-relaxed">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

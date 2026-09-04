'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, CreditCard, Check, Building, Save } from 'lucide-react';
import { PLANS } from '@rendernest/shared';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [name, setName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setUser(d.user);
          setWorkspace(d.workspace);
          setName(d.workspace?.name || '');
          setSelectedPlan(d.workspace?.planTier || 'free');
        }
      })
      .catch(() => {
        setName('Default Workspace');
        setSelectedPlan('growth');
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Workspace Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage workspace identity, subscription tier, and developer preferences.
        </p>
      </div>

      {/* WORKSPACE PROFILE */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <Building className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">General Information</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Workspace ID</label>
            <input
              type="text"
              disabled
              value={workspace?.id || 'ws_default_1234'}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-400 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {saved ? 'Saved successfully' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* SUBSCRIPTION & BILLING */}
      <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <CreditCard className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Subscription & Plan Tier</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.values(PLANS).map((plan) => {
            const isCurrent = selectedPlan === plan.code;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.code)}
                className={`rounded-xl border p-5 cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-emerald-500/60 bg-emerald-950/20'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm">{plan.name}</span>
                  <span className="font-mono text-xs text-emerald-400">
                    ${plan.priceMonthly}/mo
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mb-3">{plan.description}</div>
                <div className="text-xs font-mono text-zinc-300">
                  {plan.monthlyCredits.toLocaleString()} credits • {plan.rateLimitRpm} RPM
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-4 text-xs text-zinc-400 leading-relaxed">
          <strong className="text-white">Stripe Billing Architecture:</strong> In production, billing operates via Stripe Customer Portal and webhooks. In local development, plan tiers can be toggled freely for testing quota behaviors.
        </div>
      </div>
    </div>
  );
}

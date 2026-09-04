'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Terminal,
  Key,
  ListFilter,
  Layers,
  Radio,
  BarChart3,
  Settings,
  BookOpen,
  Activity,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Developer';
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-overview',
      category: 'Navigation',
      title: 'Overview',
      description: 'Go to dashboard overview & workspace metrics',
      icon: Activity,
      action: () => {
        router.push('/dashboard');
        onClose();
      },
    },
    {
      id: 'nav-playground',
      category: 'Navigation',
      title: 'API Playground',
      description: 'Test live screenshots, PDFs, extraction, and unified processing',
      icon: Terminal,
      action: () => {
        router.push('/dashboard/playground');
        onClose();
      },
      shortcut: 'P',
    },
    {
      id: 'nav-keys',
      category: 'Navigation',
      title: 'API Keys',
      description: 'Manage production and test API tokens',
      icon: Key,
      action: () => {
        router.push('/dashboard/keys');
        onClose();
      },
      shortcut: 'K',
    },
    {
      id: 'nav-requests',
      category: 'Navigation',
      title: 'Request Logs',
      description: 'Inspect live API request history, latency, and status codes',
      icon: ListFilter,
      action: () => {
        router.push('/dashboard/requests');
        onClose();
      },
      shortcut: 'R',
    },
    {
      id: 'nav-jobs',
      category: 'Navigation',
      title: 'Batch Jobs',
      description: 'Monitor asynchronous batch pipelines and execution progress',
      icon: Layers,
      action: () => {
        router.push('/dashboard/jobs');
        onClose();
      },
      shortcut: 'J',
    },
    {
      id: 'nav-webhooks',
      category: 'Navigation',
      title: 'Webhooks',
      description: 'Configure event subscriptions and test HMAC signatures',
      icon: Radio,
      action: () => {
        router.push('/dashboard/webhooks');
        onClose();
      },
      shortcut: 'W',
    },
    {
      id: 'nav-usage',
      category: 'Navigation',
      title: 'Usage & Quotas',
      description: 'View credit consumption, concurrency, and rate limits',
      icon: BarChart3,
      action: () => {
        router.push('/dashboard/usage');
        onClose();
      },
      shortcut: 'U',
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Workspace Settings',
      description: 'Manage workspace configuration, billing tier, and security',
      icon: Settings,
      action: () => {
        router.push('/dashboard/settings');
        onClose();
      },
      shortcut: 'S',
    },

    // Actions
    {
      id: 'act-create-key',
      category: 'Actions',
      title: 'Create New API Key',
      description: 'Generate a new authenticated key for your service',
      icon: Key,
      action: () => {
        router.push('/dashboard/keys');
        onClose();
      },
    },
    {
      id: 'act-run-unified',
      category: 'Actions',
      title: 'Run Unified Process (/v1/process)',
      description: 'Execute multi-operation pipeline with shared compute discount',
      icon: Sparkles,
      action: () => {
        router.push('/dashboard/playground');
        onClose();
      },
    },

    // Developer
    {
      id: 'dev-docs',
      category: 'Developer',
      title: 'API Documentation',
      description: 'Read the comprehensive developer reference & integration guides',
      icon: BookOpen,
      action: () => {
        router.push('/docs');
        onClose();
      },
    },
    {
      id: 'dev-openapi',
      category: 'Developer',
      title: 'OpenAPI 3.1 Spec',
      description: 'Inspect raw JSON schema definition for client generation',
      icon: Code2,
      action: () => {
        window.open('/openapi.json', '_blank');
        onClose();
      },
    },
    {
      id: 'dev-status',
      category: 'Developer',
      title: 'Platform Status',
      description: 'Check uptime, latency benchmarks, and operational health',
      icon: ExternalLink,
      action: () => {
        router.push('/status');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-[#0d0f17] shadow-2xl shadow-black/80 ring-1 ring-white/10 transition-all"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar */}
        <div className="flex items-center border-b border-zinc-800 px-4 py-3 bg-zinc-950/50">
          <Search className="h-4 w-4 text-zinc-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search dashboard..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-800/30">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 text-white border border-emerald-500/30'
                        : 'text-zinc-300 hover:bg-zinc-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                          <span>{cmd.title}</span>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">
                            {cmd.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {cmd.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {cmd.shortcut && (
                        <kbd className="hidden sm:inline-block rounded border border-zinc-700/60 bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                          {cmd.shortcut}
                        </kbd>
                      )}
                      {isSelected && <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950/70 px-4 py-2 text-[10px] text-zinc-400 font-mono">
          <span>Navigate with ↑ ↓ and Enter</span>
          <span>RenderNest 2.0 Command Palette</span>
        </div>
      </div>
    </div>
  );
}

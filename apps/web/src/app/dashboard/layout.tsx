'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Terminal,
  Key,
  ListFilter,
  Layers,
  Radio,
  BarChart3,
  Settings,
  BookOpen,
  Activity,
  LogOut,
  ChevronDown,
  Coins,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          setWorkspace(data.workspace);
        }
      })
      .catch(() => {
        // In local development, if no session cookie, set demo context
        setUser({ name: 'Demo Developer', email: 'developer@rendernest.com' });
        setWorkspace({ name: 'Default Workspace', creditBalance: 48500, planTier: 'growth' });
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/playground', label: 'Playground', icon: Terminal },
    { href: '/dashboard/keys', label: 'API Keys', icon: Key },
    { href: '/dashboard/requests', label: 'Request Logs', icon: ListFilter },
    { href: '/dashboard/jobs', label: 'Batch Jobs', icon: Layers },
    { href: '/dashboard/webhooks', label: 'Webhooks', icon: Radio },
    { href: '/dashboard/usage', label: 'Usage & Quotas', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#090a0f] text-zinc-100 overflow-hidden">
      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-800/80 bg-[#0c0e15] flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-800/80">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700">
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">RenderNest</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* WORKSPACE CARD */}
        <div className="p-4 border-b border-zinc-800/60">
          <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium text-white truncate max-w-[120px]">
                {workspace?.name || 'Workspace'}
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                {workspace?.planTier || 'free'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
              <Coins className="h-3.5 w-3.5 text-emerald-400" />
              <span>{(workspace?.creditBalance ?? 500).toLocaleString()} credits</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER USER / LOGOUT */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2">
          <Link
            href="/docs"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Documentation</span>
          </Link>
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40 px-2">
            <div className="text-xs truncate max-w-[140px]">
              <div className="font-medium text-white truncate">{user?.name || 'Developer'}</div>
              <div className="text-[10px] text-zinc-400 truncate">{user?.email || 'dev@rendernest.com'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 sm:px-6 bg-[#090a0f]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-medium text-white">Dashboard</span>
              <span>/</span>
              <span className="capitalize">{pathname.replace('/dashboard/', '').replace('/dashboard', 'Overview')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
              title="Open Command Palette (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden md:inline">Quick search...</span>
              <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-700/80 bg-zinc-950 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                Ctrl K
              </kbd>
            </button>

            <Link
              href="/status"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Systems Operational</span>
            </Link>
            <Link
              href="/docs"
              className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 font-medium text-zinc-300 hover:text-white transition-colors"
            >
              API Reference
            </Link>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#090a0f]">{children}</main>
      </div>

      {/* COMMAND PALETTE */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

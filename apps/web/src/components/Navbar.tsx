'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, ArrowRight, Activity, Terminal } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-[#090a0f]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700/80 group-hover:border-brand-500/50 transition-colors shadow-sm">
              <Layers className="h-5 w-5 text-brand-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                RenderNest
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  v1.0
                </span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/#capabilities"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Capabilities
            </Link>
            <Link
              href="/pricing"
              className={`transition-colors ${
                pathname === '/pricing' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className={`transition-colors ${
                pathname.startsWith('/docs') ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Documentation
            </Link>
            <Link
              href="/status"
              className={`flex items-center gap-1.5 transition-colors ${
                pathname === '/status' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Status
            </Link>
            <Link
              href="/changelog"
              className={`transition-colors ${
                pathname === '/changelog' ? 'text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Changelog
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/playground"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
          >
            <Terminal className="h-3.5 w-3.5 text-brand-500" />
            Playground
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3.5 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-brand-600 transition-colors shadow-sm"
          >
            Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

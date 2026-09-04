'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  BookOpen,
  Key,
  AlertTriangle,
  Zap,
  Camera,
  FileCode,
  Search,
  BarChart3,
  Layers,
  FileText,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  external?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      title: 'Getting Started',
      items: [
        { href: '/docs', label: 'Introduction', icon: BookOpen },
        { href: '/docs/getting-started', label: 'Quickstart', icon: Zap },
        { href: '/docs/authentication', label: 'Authentication', icon: Key },
        { href: '/docs/errors', label: 'Errors & Codes', icon: AlertTriangle },
        { href: '/docs/rate-limits', label: 'Rate Limits', icon: Clock },
      ],
    },
    {
      title: 'Render',
      items: [
        { href: '/docs/render/screenshot', label: 'Screenshot', icon: Camera },
        { href: '/docs/render/pdf', label: 'PDF Document', icon: FileText },
      ],
    },
    {
      title: 'Extract',
      items: [
        { href: '/docs/extract/text', label: 'Clean Text', icon: FileText },
        { href: '/docs/extract/markdown', label: 'Markdown', icon: FileCode },
        { href: '/docs/extract/json', label: 'Structured JSON', icon: Layers },
      ],
    },
    {
      title: 'Inspect & Analyze',
      items: [
        { href: '/docs/inspect', label: 'Page Inspection', icon: Search },
        { href: '/docs/analyze', label: 'Analysis & Compare', icon: BarChart3 },
      ],
    },
    {
      title: 'Convert',
      items: [{ href: '/docs/convert', label: 'PDF & DOCX', icon: FileText }],
    },
    {
      title: 'Async & Automation',
      items: [
        { href: '/docs/batch', label: 'Batch Processing', icon: Zap },
        { href: '/docs/webhooks', label: 'Webhooks & HMAC', icon: Radio },
      ],
    },
    {
      title: 'Reference',
      items: [{ href: '/openapi.json', label: 'OpenAPI 3.1 Spec', icon: ExternalLink, external: true }],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f]">
      <Navbar />

      <div className="mx-auto flex w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* SIDEBAR */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-3">
            {navSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  {section.title}
                </h4>
                <ul className="space-y-1 text-xs">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          target={item.external ? '_blank' : undefined}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                          }`}
                        >
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.label}</span>
                          {item.external && <ExternalLink className="h-3 w-3 ml-auto opacity-60" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 max-w-3xl pb-16">{children}</main>
      </div>

      <Footer />
    </div>
  );
}

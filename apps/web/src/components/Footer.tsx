import Link from 'next/link';
import { Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#090a0f] text-zinc-400 text-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700">
                <Layers className="h-4 w-4 text-brand-500" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">RenderNest</span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Serious developer infrastructure for turning web pages, documents, and HTML into structured data, images, PDFs, and deep page intelligence.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Pillars</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/docs/render/screenshot" className="hover:text-white transition-colors">Screenshot</Link></li>
              <li><Link href="/docs/render/pdf" className="hover:text-white transition-colors">PDF Render</Link></li>
              <li><Link href="/docs/extract/text" className="hover:text-white transition-colors">Clean Text</Link></li>
              <li><Link href="/docs/extract/markdown" className="hover:text-white transition-colors">Markdown</Link></li>
              <li><Link href="/docs/extract/json" className="hover:text-white transition-colors">Structured JSON</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Intelligence</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/docs/inspect" className="hover:text-white transition-colors">Page Inspection</Link></li>
              <li><Link href="/docs/analyze" className="hover:text-white transition-colors">SEO & Audits</Link></li>
              <li><Link href="/docs/analyze" className="hover:text-white transition-colors">Visual Compare</Link></li>
              <li><Link href="/docs/convert" className="hover:text-white transition-colors">HTML/MD to PDF</Link></li>
              <li><Link href="/docs/convert" className="hover:text-white transition-colors">HTML/MD to DOCX</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/openapi.json" target="_blank" className="hover:text-white transition-colors">OpenAPI 3.1</Link></li>
              <li><Link href="/status" className="hover:text-white transition-colors">System Status</Link></li>
              <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© {new Date().getFullYear()} RenderNest Infrastructure Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

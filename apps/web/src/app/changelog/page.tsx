import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ChangelogPage() {
  const releases = [
    {
      version: 'v1.0.0',
      date: 'September 4, 2026',
      title: 'RenderNest Public Launch',
      changes: [
        'Initial release of RenderNest unified developer API.',
        'High-definition screenshot rendering with full-page and custom viewport support.',
        'HTML & web page PDF rendering with custom margin and print background.',
        'Clean text extraction with boilerplate and ad stripping.',
        'Semantic GitHub-flavored Markdown generator with preserved tables and code blocks.',
        'Structured JSON extraction engine with schema enforcement.',
        'Page inspection API returning OpenGraph, Twitter card, and JSON-LD metadata.',
        'SEO and accessibility analysis report generator.',
        'Pixel-level visual comparison engine with diff overlay generation.',
        'HTML and Markdown to DOCX document converter.',
        'Asynchronous multi-URL batch processing with HMAC-signed webhooks.',
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f]">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Changelog</h1>
            <p className="mt-2 text-sm text-zinc-400">
              New features, performance enhancements, and infrastructure updates for RenderNest.
            </p>
          </div>

          <div className="space-y-12">
            {releases.map((rel) => (
              <div key={rel.version} className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                    {rel.version}
                  </span>
                  <span className="text-xs text-zinc-400">{rel.date}</span>
                </div>

                <h2 className="text-lg font-bold text-white mb-4">{rel.title}</h2>

                <ul className="space-y-2 text-xs text-zinc-300">
                  {rel.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

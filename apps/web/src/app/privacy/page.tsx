import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f]">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-xs text-zinc-400 mb-10">Last updated: September 4, 2026</p>

          <div className="space-y-8 text-xs text-zinc-300 leading-relaxed">
            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">1. Information We Collect</h2>
              <p className="mb-2">
                We collect information necessary to operate, monitor, and invoice our developer platform:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li><strong className="text-zinc-200">Account Data:</strong> Email address, hashed authentication credentials, workspace identifiers, and subscription tier.</li>
                <li><strong className="text-zinc-200">API Metadata:</strong> Request timestamps, HTTP methods, route endpoints, status codes, latency, and credit usage.</li>
                <li><strong className="text-zinc-200">Payment Information:</strong> Handled directly through PCI-DSS compliant billing processors (such as Stripe). RenderNest never stores full credit card numbers.</li>
              </ul>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">2. Processing of Customer Document Payloads</h2>
              <p>
                RenderNest treats URL targets, HTML snippets, and rendered documents as transient processing inputs. Generated screenshots, PDFs, and extracted data are temporarily cached in object storage to fulfill signed customer download requests and are automatically expired and purged according to your workspace retention policies. We do not use customer content to train AI models.
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">3. Data Retention & Erasure</h2>
              <p>
                Request logs and execution history are retained in accordance with plan limits (from 7 days for Free plans up to 90 days for Enterprise plans). You may delete API keys, webhooks, or request account closure at any time via the RenderNest Dashboard or by contacting support.
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">4. Third-Party Subprocessors</h2>
              <p>
                We partner with select cloud infrastructure providers (PostgreSQL hosting, Redis caches, object storage, and payment processors) who comply with rigorous security certifications including SOC 2 Type II and ISO 27001.
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">5. Contact & Data Privacy Inquiries</h2>
              <p>
                If you have questions regarding data privacy, GDPR compliance, or data subject rights requests, please contact our Data Protection Officer at <code className="text-emerald-400 font-mono">privacy@rendernest.com</code>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

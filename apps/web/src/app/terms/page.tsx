import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f]">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Terms of Service</h1>
          <p className="text-xs text-zinc-400 mb-10">Last updated: September 4, 2026</p>

          <div className="space-y-8 text-xs text-zinc-300 leading-relaxed">
            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">1. Acceptance of Terms</h2>
              <p>
                By creating an account, generating an API key, or accessing RenderNest APIs and services, you agree to be bound by these Terms of Service. If you are entering into these terms on behalf of an entity, you represent that you have legal authority to bind that entity.
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">2. Acceptable Use Policy</h2>
              <p className="mb-2">
                RenderNest is developer infrastructure designed for legitimate rendering, document conversion, testing, and data extraction. You agree not to use RenderNest to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Attempt Server-Side Request Forgery (SSRF) against internal, loopback, or private networks.</li>
                <li>Conduct denial-of-service attacks, port scanning, or malicious network reconnaissance.</li>
                <li>Bypass authentication mechanisms, digital copyright protections, or access controls.</li>
                <li>Transmit malicious code, viruses, worms, or unauthorized scripts.</li>
                <li>Exceed allocated rate limits, quotas, or attempt to manipulate billing balances.</li>
              </ul>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">3. API Usage, Credits, and Payment</h2>
              <p>
                API requests consume credits based on operation definitions. Subscriptions renew monthly or annually. Credits reset at each billing cycle. You are responsible for keeping your API keys secure; RenderNest is not liable for unauthorized usage incurred through compromised credentials.
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">4. Service Availability & SLAs</h2>
              <p>
                We strive for continuous service availability. Scheduled maintenance windows will be communicated via the RenderNest Status Page. RenderNest reserves the right to throttle or terminate API access if requests threaten infrastructure stability.
              </p>
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6">
              <h2 className="text-sm font-bold text-white mb-2">5. Limitation of Liability</h2>
              <p>
                RenderNest provides services on an "as is" and "as available" basis. To the maximum extent permitted by applicable law, RenderNest and its affiliates shall not be liable for indirect, punitive, or consequential damages resulting from service usage or disruption.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Lock, Server, AlertTriangle, EyeOff, RefreshCw } from 'lucide-react';

export default function SecurityPage() {
  const sections = [
    {
      icon: ShieldCheck,
      title: 'Layered SSRF & Network Security',
      description:
        'RenderNest processes untrusted URLs using a defense-in-depth security model. Prior to initiating any network connection, URLs are strictly parsed, IPv4/IPv6 addresses are resolved via DNS, and checked against comprehensive RFC-defined private, loopback, multicast, link-local, and cloud metadata ranges (including 169.254.169.254, AWS, GCP, and Azure metadata endpoints). In addition, Chromium network traffic is guarded at runtime via Playwright route interception, guaranteeing that any 301/302 redirects to internal endpoints are instantly dropped before data transmission.',
    },
    {
      icon: EyeOff,
      title: 'Multi-Tenant Isolation & Zero Cross-Contamination',
      description:
        'All resources—including API keys, jobs, request logs, stored artifacts, and webhook endpoints—are strictly partitioned by Workspace ID. API routes enforce database-level tenant ownership checks before processing requests. Attempts to access or enumerate resources belonging to other workspaces return HTTP 404 responses to eliminate identifier probing and tenant leakage.',
    },
    {
      icon: Lock,
      title: 'Cryptographic API Key Architecture',
      description:
        'API keys use high-entropy random generation and prefix tagging (wf_live_ / wf_test_). Raw API keys are shown exactly once at creation and are never stored in plaintext. RenderNest stores only SHA-256 hashes of API keys in our database. We provide instant key rotation (generating a replacement while maintaining continuity) and one-click emergency revocation to neutralize compromised credentials.',
    },
    {
      icon: Server,
      title: 'Ephemeral Isolated Browser Sandboxing',
      description:
        'Every rendering and extraction job executes in an isolated, short-lived browser context. Cookies, session storage, local storage, cache, and authentication state are destroyed immediately upon job completion. Workers run with non-root privileges, constrained memory and CPU limits, and strict navigation timeouts to prevent resource exhaustion attacks.',
    },
    {
      icon: RefreshCw,
      title: 'HMAC-SHA256 Signed Artifact Storage',
      description:
        'Generated screenshots, PDFs, and documents are stored in scoped object storage. File access requires short-lived signed URLs secured by HMAC-SHA256 tokens and explicit timestamp expirations. Download endpoints strictly prevent directory traversal (blocking relative segments like .. and .), disallow unauthenticated access, and enforce no-store caching headers.',
    },
    {
      icon: AlertTriangle,
      title: 'Atomic Quotas & Rate Limiting',
      description:
        'To prevent race-condition abuse, credit accounting utilizes conditional atomic database updates (WHERE credit_balance >= required_credits). Simultaneous requests cannot drive balances negative. Requests are throttled using sliding-window rate limiters per workspace, IP, and endpoint tier, returning standard 429 and Retry-After response headers.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f]">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400 mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              Infrastructure-Grade Trust
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              RenderNest Security Architecture
            </h1>
            <p className="mt-3 text-base text-zinc-400 max-w-3xl">
              How we protect developer infrastructure, eliminate SSRF threats, maintain tenant isolation, and safeguard sensitive data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 sm:p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700/80 mb-5">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h2 className="text-base font-bold text-white mb-2">{section.title}</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed">{section.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vulnerability Disclosure Section */}
          <div className="rounded-xl border border-zinc-800 bg-[#0c0e15] p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-2">Vulnerability Reporting & Coordinated Disclosure</h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              We welcome reports from security researchers and developers. If you believe you have discovered a vulnerability in RenderNest, please report it to our security team.
            </p>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 space-y-1">
              <div><span className="text-zinc-500">Email:</span> security@rendernest.com</div>
              <div><span className="text-zinc-500">Response SLA:</span> Within 24 hours</div>
              <div><span className="text-zinc-500">Safe Harbor:</span> We will not pursue legal action against researchers acting in good faith who avoid privacy violations, data destruction, and service interruption.</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

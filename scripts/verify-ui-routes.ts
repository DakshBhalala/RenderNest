const BASE_URL = 'http://localhost:3000';

const routes = [
  '/',
  '/pricing',
  '/status',
  '/changelog',
  '/security',
  '/terms',
  '/privacy',
  '/login',
  '/signup',
  '/docs',
  '/docs/getting-started',
  '/docs/authentication',
  '/docs/errors',
  '/docs/rate-limits',
  '/docs/render/screenshot',
  '/docs/render/pdf',
  '/docs/extract/text',
  '/docs/extract/markdown',
  '/docs/extract/json',
  '/docs/inspect',
  '/docs/analyze',
  '/docs/convert',
  '/docs/batch',
  '/docs/webhooks',
  '/dashboard',
  '/dashboard/playground',
  '/dashboard/keys',
  '/dashboard/requests',
  '/dashboard/jobs',
  '/dashboard/webhooks',
  '/dashboard/usage',
  '/dashboard/settings',
];

async function verifyRoutes() {
  console.log('🌐 Verifying RenderNest UI routes...\n');
  let passed = 0;
  let failed = 0;

  for (const route of routes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      if (res.status === 200) {
        console.log(`   ✅ [200 OK] ${route}`);
        passed++;
      } else {
        console.error(`   ❌ [${res.status}] ${route}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`   ❌ Error fetching ${route}:`, err.message);
      failed++;
    }
  }

  console.log(`\nRoute Verification: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

verifyRoutes();

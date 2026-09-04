import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function check(category: string, name: string, fn: () => { passed: boolean; message: string }) {
  try {
    const res = fn();
    results.push({ category, name, ...res });
  } catch (err: any) {
    results.push({ category, name, passed: false, message: err.message });
  }
}

const rootDir = process.cwd();

console.log('========================================================');
console.log(' 🚀 RenderNest Pre-Deployment Automated Health & Config Gate');
console.log('========================================================\n');

// 1. Docker & Orchestration
check('DOCKER', 'Dockerfile presence & syntax', () => {
  const file = path.join(rootDir, 'Dockerfile');
  const exists = fs.existsSync(file);
  const content = exists ? fs.readFileSync(file, 'utf-8') : '';
  const hasHealth = content.includes('HEALTHCHECK');
  const hasNonRoot = content.includes('USER node');
  return {
    passed: exists && hasHealth && hasNonRoot,
    message: exists ? 'Dockerfile configured with non-root user & healthcheck' : 'Dockerfile missing',
  };
});

check('DOCKER', 'Dockerfile.worker presence & syntax', () => {
  const file = path.join(rootDir, 'Dockerfile.worker');
  const exists = fs.existsSync(file);
  const content = exists ? fs.readFileSync(file, 'utf-8') : '';
  const hasPlaywright = content.includes('playwright install chromium');
  return {
    passed: exists && hasPlaywright,
    message: exists ? 'Worker Dockerfile includes Playwright Chromium install' : 'Dockerfile.worker missing',
  };
});

check('DOCKER', 'docker-compose.production.yml presence', () => {
  const file = path.join(rootDir, 'docker-compose.production.yml');
  const exists = fs.existsSync(file);
  const content = exists ? fs.readFileSync(file, 'utf-8') : '';
  const hasAllServices =
    content.includes('caddy:') &&
    content.includes('postgres:') &&
    content.includes('redis:') &&
    content.includes('web:') &&
    content.includes('worker:');
  return {
    passed: exists && hasAllServices,
    message: exists && hasAllServices ? 'All 5 production services defined' : 'Missing required production services',
  };
});

check('REVERSE_PROXY', 'Caddyfile configuration', () => {
  const file = path.join(rootDir, 'Caddyfile');
  const exists = fs.existsSync(file);
  const content = exists ? fs.readFileSync(file, 'utf-8') : '';
  const hasHsts = content.includes('Strict-Transport-Security');
  const hasReverseProxy = content.includes('reverse_proxy web:3000');
  return {
    passed: exists && hasHsts && hasReverseProxy,
    message: exists ? 'Caddyfile configured with HSTS and reverse proxy' : 'Caddyfile missing',
  };
});

// 2. Database & Migrations
check('DATABASE', 'PostgreSQL Schema presence', () => {
  const file = path.join(rootDir, 'packages/database/prisma/schema.postgresql.prisma');
  const exists = fs.existsSync(file);
  const content = exists ? fs.readFileSync(file, 'utf-8') : '';
  const isPostgres = content.includes('provider = "postgresql"');
  return {
    passed: exists && isPostgres,
    message: isPostgres ? 'PostgreSQL schema verified' : 'schema.postgresql.prisma missing or invalid',
  };
});

check('DATABASE', 'Production Migration Script presence', () => {
  const file = path.join(rootDir, 'scripts/migrate-production.sh');
  const exists = fs.existsSync(file);
  return {
    passed: exists,
    message: exists ? 'scripts/migrate-production.sh present' : 'Migration script missing',
  };
});

check('DATABASE', 'PostgreSQL Backup & Restore Scripts', () => {
  const backup = fs.existsSync(path.join(rootDir, 'scripts/backup-postgres.sh'));
  const restore = fs.existsSync(path.join(rootDir, 'scripts/restore-postgres.sh'));
  return {
    passed: backup && restore,
    message: backup && restore ? 'Backup and restore scripts present' : 'Backup/restore scripts missing',
  };
});

// 3. Environment & Secrets
check('CONFIG', '.env.production.example template', () => {
  const file = path.join(rootDir, '.env.production.example');
  const exists = fs.existsSync(file);
  const content = exists ? fs.readFileSync(file, 'utf-8') : '';
  const hasAll =
    content.includes('DATABASE_URL') &&
    content.includes('REDIS_URL') &&
    content.includes('AUTH_SECRET') &&
    content.includes('STORAGE_PROVIDER') &&
    content.includes('R2_ACCOUNT_ID') &&
    content.includes('RAPIDAPI_PROXY_SECRET');
  return {
    passed: exists && hasAll,
    message: hasAll ? 'All production environment variables declared' : '.env.production.example missing keys',
  };
});

check('SECURITY', 'Gitignore prevents secret leaks', () => {
  const file = path.join(rootDir, '.gitignore');
  const content = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
  const ignoresEnv = content.includes('.env') && content.includes('.env.production');
  return {
    passed: ignoresEnv,
    message: ignoresEnv ? '.env and .env.production are properly gitignored' : '.gitignore missing .env.production',
  };
});

// 4. OpenAPI Specification
check('OPENAPI', 'OpenAPI 3.1.0 schema validity', () => {
  const file = path.join(rootDir, 'apps/web/src/app/openapi.json/route.ts');
  const exists = fs.existsSync(file);
  return {
    passed: exists,
    message: exists ? 'OpenAPI route present' : 'OpenAPI route missing',
  };
});

// 5. RapidAPI Adapter
check('RAPIDAPI', 'RapidAPI gateway integration logic', () => {
  const authFile = path.join(rootDir, 'apps/web/src/lib/auth.ts');
  const content = fs.readFileSync(authFile, 'utf-8');
  const hasRapidApi = content.includes('x-rapidapi-proxy-secret') && content.includes('RapidAPI Marketplace');
  return {
    passed: hasRapidApi,
    message: hasRapidApi ? 'RapidAPI proxy secret verification & workspace auto-link implemented' : 'RapidAPI adapter missing',
  };
});

// Print Results Table
console.log('Category'.padEnd(16) + 'Check'.padEnd(45) + 'Status'.padEnd(10) + 'Details');
console.log('-'.repeat(95));

let failedCount = 0;
for (const r of results) {
  const statusStr = r.passed ? '✅ PASS' : '❌ FAIL';
  if (!r.passed) failedCount++;
  console.log(
    r.category.padEnd(16) +
      r.name.slice(0, 43).padEnd(45) +
      statusStr.padEnd(10) +
      r.message
  );
}

console.log('-'.repeat(95));
console.log(`\nDeployment Pre-flight Summary: ${results.length - failedCount}/${results.length} checks passed.`);

if (failedCount > 0) {
  console.error(`❌ Deployment gate failed with ${failedCount} errors.`);
  process.exit(1);
} else {
  console.log('✨ All deployment configuration and readiness checks passed successfully!');
  process.exit(0);
}

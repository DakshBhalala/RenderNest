import { UrlSafetyService, LocalStorageProvider } from '@rendernest/providers';
import { IdempotencyService } from '../apps/web/src/lib/idempotency';
import { extractCleanMarkdown } from '../packages/providers/src/extract/content-extractor';
import path from 'path';
import crypto from 'crypto';

export interface AttackVectorResult {
  category: string;
  vector: string;
  description: string;
  passed: boolean;
  details?: string;
}

export async function runAttackSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: AttackVectorResult[];
}> {
  const results: AttackVectorResult[] = [];

  function record(category: string, vector: string, description: string, passed: boolean, details?: string) {
    results.push({ category, vector, description, passed, details });
  }

  console.log('🛡️  Running Autonomous Red-Team Security Attack Suite...\n');

  // --- 1. SSRF & Protocol Smuggling Matrix ---
  const ssrfTargets = [
    { url: 'http://127.0.0.1:80', desc: 'IPv4 loopback standard' },
    { url: 'http://127.0.0.2:8080', desc: 'IPv4 loopback secondary' },
    { url: 'http://localhost:3000', desc: 'Localhost alias' },
    { url: 'http://[::1]:80', desc: 'IPv6 bracketed loopback' },
    { url: 'http://10.0.0.1/', desc: 'RFC 1918 Class A private IP' },
    { url: 'http://172.16.0.1/', desc: 'RFC 1918 Class B private IP' },
    { url: 'http://192.168.1.1/', desc: 'RFC 1918 Class C private IP' },
    { url: 'http://169.254.169.254/latest/meta-data/', desc: 'AWS/GCP Link-Local Cloud Metadata' },
    { url: 'http://100.64.0.1/', desc: 'Carrier-Grade NAT (CGNAT) address' },
    { url: 'http://0x7f000001/', desc: 'Hexadecimal IPv4 loopback literal' },
    { url: 'http://2130706433/', desc: 'Dword/Decimal IPv4 loopback literal' },
    { url: 'http://[::ffff:127.0.0.1]/', desc: 'IPv4-mapped IPv6 loopback' },
    { url: 'http://metadata.google.internal/', desc: 'Internal cloud DNS suffix' },
    { url: 'http://app.corp.local/', desc: 'mDNS .local domain' },
    { url: 'http://service.internal/', desc: 'Internal TLD' },
  ];

  for (const target of ssrfTargets) {
    let blocked = false;
    try {
      await UrlSafetyService.validateUrl(target.url);
    } catch {
      blocked = true;
    }
    record('SSRF Defense', target.url, target.desc, blocked, blocked ? 'Safely blocked' : 'FAILED: SSRF allowed');
  }

  // --- 2. Dangerous Ports Matrix ---
  const dangerousPorts = [22, 23, 25, 3306, 5432, 6379, 11211, 27017, 9200];
  for (const port of dangerousPorts) {
    let blocked = false;
    try {
      await UrlSafetyService.validateUrl(`http://example.com:${port}/`);
    } catch {
      blocked = true;
    }
    record('Port Defense', `Port ${port}`, `Blocks non-web service port ${port}`, blocked, blocked ? 'Port rejected' : 'FAILED: Dangerous port allowed');
  }

  // --- 3. Webhook SSRF Matrix ---
  const webhookTargets = [
    { url: 'http://127.0.0.1:9000/hook', desc: 'Loopback webhook' },
    { url: 'http://169.254.169.254/hook', desc: 'Metadata webhook' },
    { url: 'http://10.200.1.1/hook', desc: 'Private subnet webhook' },
  ];

  for (const target of webhookTargets) {
    let blocked = false;
    try {
      await UrlSafetyService.validateWebhookUrl(target.url);
    } catch {
      blocked = true;
    }
    record('Webhook Security', target.url, target.desc, blocked, blocked ? 'Safely blocked' : 'FAILED: Internal webhook allowed');
  }

  // --- 4. Storage Path Traversal Matrix ---
  const testDir = path.resolve(process.cwd(), '.test-storage-attack');
  const secretKey = 'attack-test-secret-key-32-chars!';
  const storage = new LocalStorageProvider({
    baseDir: testDir,
    appUrl: 'https://api-rendernest.duckdns.org',
    secretKey,
  });

  const traversalKeys = [
    { key: '../../../etc/passwd', desc: 'POSIX path traversal escape' },
    { key: '..\\..\\..\\windows\\win.ini', desc: 'Windows backslash path traversal' },
    { key: 'artifacts/../../escaped.txt', desc: 'Mid-path directory traversal escape' },
    { key: 'artifacts\0/../../escaped.txt', desc: 'Null byte poisoned traversal' },
  ];

  for (const item of traversalKeys) {
    let putBlocked = false;
    try {
      await storage.put(item.key, Buffer.from('malicious payload'));
    } catch (e: any) {
      putBlocked = e.message.includes('Path traversal');
    }

    const getResult = await storage.get(item.key);
    const getSafe = getResult === null;

    record('Storage Defense', item.key, item.desc, putBlocked && getSafe, putBlocked && getSafe ? 'Traversal strictly contained' : 'FAILED: Traversal permitted');
  }

  // HMAC Signature Tampering
  const validKey = 'artifacts/legit_report.pdf';
  const signedUrl = await storage.createSignedUrl(validKey, 3600);
  const parsedUrl = new URL(signedUrl);
  const expires = parseInt(parsedUrl.searchParams.get('expires') || '0', 10);
  const sig = parsedUrl.searchParams.get('signature') || '';

  const tamperedSig = sig.slice(0, -4) + 'ffff';
  const tamperedCheck = storage.verifySignature(validKey, expires, tamperedSig);
  record('HMAC Security', 'Tampered Signature', 'Signature modification rejected', !tamperedCheck, !tamperedCheck ? 'Tampered HMAC rejected' : 'FAILED: Tampered signature accepted');

  const expiredSigCheck = storage.verifySignature(validKey, expires - 4000, sig);
  record('HMAC Security', 'Expired Signature', 'Expired timestamp rejected', !expiredSigCheck, !expiredSigCheck ? 'Expired token rejected' : 'FAILED: Expired token accepted');

  const crossResourceCheck = storage.verifySignature('artifacts/other_user.pdf', expires, sig);
  record('HMAC Security', 'Cross-Resource Replay', 'Using keyA signature for keyB rejected', !crossResourceCheck, !crossResourceCheck ? 'Cross-resource replay rejected' : 'FAILED: Cross-resource accepted');

  // --- 5. Idempotency Conflict & Cross-Tenant Isolation ---
  const ws1 = `ws_sec_attack_${Date.now()}_1`;
  const ws2 = `ws_sec_attack_${Date.now()}_2`;
  const idemKey = `idem_attack_${Date.now()}`;
  const payloadA = { action: 'render', count: 1 };
  const payloadB = { action: 'render', count: 2 };
  const hashA = crypto.createHash('sha256').update(JSON.stringify(payloadA)).digest('hex');
  const hashB = crypto.createHash('sha256').update(JSON.stringify(payloadB)).digest('hex');

  IdempotencyService.set(ws1, idemKey, 200, { success: true }, hashA);

  const exactReplay = IdempotencyService.get(ws1, idemKey, hashA);
  const replayPass = !!exactReplay && !exactReplay.mismatch;
  record('Idempotency Integrity', 'Exact Payload Replay', 'Same key + same payload yields cached response', replayPass);

  const conflictReplay = IdempotencyService.get(ws1, idemKey, hashB);
  const conflictPass = !!conflictReplay && conflictReplay.mismatch === true;
  record('Idempotency Integrity', 'Mismatched Payload Conflict', 'Same key + modified payload flags mismatch conflict', conflictPass);

  const tenantIsolation = IdempotencyService.get(ws2, idemKey, hashA);
  const isolationPass = tenantIsolation === null;
  record('Idempotency Integrity', 'Multi-Tenant Isolation', 'Workspace B cannot view or replay Workspace A keys', isolationPass);

  // --- 6. Content Sanitization & Markdown XSS Neutralization ---
  const xssHtml = `
    <html>
      <head><title>XSS Test</title></head>
      <body>
        <script>alert(1)</script>
        <iframe src="http://malicious.com"></iframe>
        <a href="javascript:alert(1)">Exploit Link</a>
        <a href="vbscript:msgbox(1)">VBScript Link</a>
        <a href="data:text/html,<script>alert(1)</script>">Data Link</a>
        <a href="https://legitimate.org">Safe Link</a>
      </body>
    </html>
  `;
  const cleanMarkdown = extractCleanMarkdown(xssHtml);
  const xssPassed =
    !cleanMarkdown.markdown.includes('javascript:') &&
    !cleanMarkdown.markdown.includes('vbscript:') &&
    !cleanMarkdown.markdown.includes('data:text/html') &&
    !cleanMarkdown.markdown.includes('alert(1)') &&
    cleanMarkdown.markdown.includes('Safe Link');

  record('Content Sanitization', 'Markdown XSS Neutralization', 'Strips javascript:/data: links and scripts from markdown', xssPassed);

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`\nAttack Suite Complete: ${passed}/${total} vectors defended (${failed} vulnerabilities).`);
  return { total, passed, failed, results };
}

if (require.main === module) {
  runAttackSuite().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

import dns from 'dns';
import net from 'net';
import { ApiError } from '@rendernest/shared';

export class UrlSafetyService {
  // Comprehensive RFC 1918, RFC 3927, RFC 5737, RFC 6598, RFC 2544, RFC 1112 reserved ranges
  private static PRIVATE_IPV4_RANGES = [
    { start: 0x00000000, end: 0x00ffffff }, // 0.0.0.0/8 (Current network)
    { start: 0x0a000000, end: 0x0affffff }, // 10.0.0.0/8 (Private)
    { start: 0x64400000, end: 0x647fffff }, // 100.64.0.0/10 (Shared / Carrier-Grade NAT)
    { start: 0x7f000000, end: 0x7fffffff }, // 127.0.0.0/8 (Loopback)
    { start: 0xa9fe0000, end: 0xa9feffff }, // 169.254.0.0/16 (Link-Local, AWS/GCP/Azure Metadata)
    { start: 0xac100000, end: 0xac1fffff }, // 172.16.0.0/12 (Private)
    { start: 0xc0000000, end: 0xc00000ff }, // 192.0.0.0/24 (IETF Protocol Assignments)
    { start: 0xc0000200, end: 0xc00002ff }, // 192.0.2.0/24 (TEST-NET-1)
    { start: 0xc0586300, end: 0xc05863ff }, // 192.88.99.0/24 (6to4 Anycast)
    { start: 0xc0a80000, end: 0xc0a8ffff }, // 192.168.0.0/16 (Private)
    { start: 0xc6120000, end: 0xc613ffff }, // 198.18.0.0/15 (Network Benchmark)
    { start: 0xc6336400, end: 0xc63364ff }, // 198.51.100.0/24 (TEST-NET-2)
    { start: 0xcb007100, end: 0xcb0071ff }, // 203.0.113.0/24 (TEST-NET-3)
    { start: 0xe0000000, end: 0xefffffff }, // 224.0.0.0/4 (Multicast)
    { start: 0xf0000000, end: 0xffffffff }, // 240.0.0.0/4 (Reserved / Broadcast)
  ];

  // Dangerous ports frequently abused for internal network scanning or protocol smuggling
  private static DANGEROUS_PORTS = new Set([
    20, 21, 22, 23, 25, 53, 69, 110, 119, 123, 143, 161, 389, 445, 636, 1080,
    1433, 1521, 2049, 2375, 2376, 3306, 3389, 5000, 5432, 5900, 5984, 6379,
    7000, 7001, 8086, 8500, 9000, 9042, 9200, 9300, 11211, 27017, 27018, 28017
  ]);

  private static BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'localhost.localdomain',
    'metadata.google.internal',
    '169.254.169.254',
    'instance-data',
    'docker.for.win.localhost',
    'host.docker.internal',
  ]);

  static async validateUrl(rawUrl: string, allowCustomPorts: boolean = false): Promise<string> {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw ApiError.invalidUrl('A URL string must be provided.');
    }

    const trimmed = rawUrl.trim();
    if (trimmed.length > 2048) {
      throw ApiError.invalidUrl('URL exceeds maximum supported length of 2048 characters.');
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw ApiError.invalidUrl(`The string '${trimmed}' is not a valid URL.`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw ApiError.invalidUrl(`Protocol '${parsed.protocol}' is not supported. Only http: and https: are allowed.`);
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames and suffixes
    if (
      this.BLOCKED_HOSTNAMES.has(hostname) ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.lan') ||
      hostname.endsWith('.corp')
    ) {
      throw ApiError.urlBlocked(`Access to host '${hostname}' is restricted by network security policy.`);
    }

    // Check dangerous port access
    if (parsed.port) {
      const portNum = parseInt(parsed.port, 10);
      if (!allowCustomPorts && this.DANGEROUS_PORTS.has(portNum)) {
        throw ApiError.urlBlocked(`Port ${portNum} is restricted for security reasons.`);
      }
    }

    // Resolve DNS and inspect all IP records
    try {
      const records = await dns.promises.lookup(hostname, { all: true });
      if (!records || records.length === 0) {
        throw ApiError.invalidUrl(`Could not resolve hostname '${hostname}'.`);
      }

      for (const record of records) {
        if (this.isPrivateIp(record.address, record.family)) {
          throw ApiError.urlBlocked(
            `Target host '${hostname}' resolves to a restricted IP address (${record.address}).`
          );
        }
      }
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw ApiError.invalidUrl(`DNS resolution failed for '${hostname}': ${err.message}`);
    }

    return parsed.toString();
  }

  static async validateWebhookUrl(rawUrl: string): Promise<string> {
    const validated = await this.validateUrl(rawUrl, false);
    const parsed = new URL(validated);

    // In production, enforce HTTPS for webhooks to protect customer payloads
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      throw ApiError.invalidRequest('Webhook endpoints must use secure HTTPS in production.');
    }

    return validated;
  }

  private static hostSafetyCache = new Map<string, { safe: boolean; expires: number }>();

  static async isHostSafe(hostname: string): Promise<boolean> {
    if (!hostname || typeof hostname !== 'string') return false;
    let cleanHost = hostname.toLowerCase().trim();
    if (cleanHost.startsWith('[') && cleanHost.endsWith(']')) {
      cleanHost = cleanHost.slice(1, -1);
    }

    if (
      this.BLOCKED_HOSTNAMES.has(cleanHost) ||
      cleanHost.endsWith('.localhost') ||
      cleanHost.endsWith('.local') ||
      cleanHost.endsWith('.internal') ||
      cleanHost.endsWith('.lan') ||
      cleanHost.endsWith('.corp') ||
      this.isPrivateIp(cleanHost)
    ) {
      return false;
    }

    // Check cache
    const cached = this.hostSafetyCache.get(cleanHost);
    if (cached && cached.expires > Date.now()) {
      return cached.safe;
    }

    try {
      const records = await dns.promises.lookup(cleanHost, { all: true });
      if (!records || records.length === 0) {
        this.hostSafetyCache.set(cleanHost, { safe: false, expires: Date.now() + 60000 });
        return false;
      }
      for (const record of records) {
        if (this.isPrivateIp(record.address, record.family)) {
          this.hostSafetyCache.set(cleanHost, { safe: false, expires: Date.now() + 60000 });
          return false;
        }
      }
      this.hostSafetyCache.set(cleanHost, { safe: true, expires: Date.now() + 60000 });
      return true;
    } catch {
      return false;
    }
  }

  static isPrivateIp(ip: string, family?: number): boolean {
    if (!ip || typeof ip !== 'string') return true;

    // Strip bracket formatting from IPv6 strings, e.g. '[::1]' -> '::1'
    let cleanIp = ip.trim();
    if (cleanIp.startsWith('[') && cleanIp.endsWith(']')) {
      cleanIp = cleanIp.slice(1, -1);
    }

    // Check IPv4-mapped IPv6 addresses, e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1
    if (cleanIp.toLowerCase().startsWith('::ffff:')) {
      const v4Part = cleanIp.slice(7);
      return this.isPrivateIp(v4Part, 4);
    }

    // Detect hex or decimal IPv4 literals, e.g. 0x7f000001 or 2130706433
    if (/^0x[0-9a-fA-F]+$/.test(cleanIp) || /^\d+$/.test(cleanIp)) {
      const num = parseInt(cleanIp, cleanIp.startsWith('0x') || cleanIp.startsWith('0X') ? 16 : 10);
      if (!isNaN(num) && num >= 0 && num <= 0xffffffff) {
        for (const range of this.PRIVATE_IPV4_RANGES) {
          if (num >= range.start && num <= range.end) {
            return true;
          }
        }
        return false;
      }
    }

    const ipFamily = family || net.isIP(cleanIp);
    if (ipFamily === 0) {
      // Not an IP address (e.g. a domain name)
      return false;
    }

    if (ipFamily === 4) {
      const parts = cleanIp.split('.').map((p) => parseInt(p, 10));
      if (parts.length !== 4 || parts.some(isNaN) || parts.some((p) => p < 0 || p > 255)) {
        return true; // Malformed IPv4 considered unsafe
      }
      const num = ((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0);

      for (const range of this.PRIVATE_IPV4_RANGES) {
        if (num >= range.start && num <= range.end) {
          return true;
        }
      }
      return false;
    }

    // IPv6 checks
    const normalized = cleanIp.toLowerCase();
    if (
      normalized === '::1' ||
      normalized === '::' ||
      normalized === '0:0:0:0:0:0:0:1' ||
      normalized === '0:0:0:0:0:0:0:0' ||
      /^fe[89ab][0-9a-f]:/i.test(normalized) || // Link-local fe80::/10
      /^f[cd][0-9a-f]{2}:/i.test(normalized) || // Unique local fc00::/7 (fc00:: - fdff::)
      /^ff[0-9a-f]{2}:/i.test(normalized)       // Multicast ff00::/8
    ) {
      return true;
    }

    return false;
  }
}

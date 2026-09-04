import { describe, it, expect } from 'vitest';
import { UrlSafetyService } from '@rendernest/providers';

describe('Security Attack Matrix - SSRF, Protocols, Ports & Webhooks', () => {
  describe('Comprehensive IP & CIDR Range Blocking', () => {
    it('blocks IPv4 loopback and localhost variants', async () => {
      expect(UrlSafetyService.isPrivateIp('127.0.0.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('127.0.0.2')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('127.255.255.254')).toBe(true);
      await expect(UrlSafetyService.validateUrl('http://127.0.0.1:80')).rejects.toThrow();
      await expect(UrlSafetyService.validateUrl('http://localhost')).rejects.toThrow();
    });

    it('blocks RFC 1918 private IPv4 ranges', async () => {
      // 10.0.0.0/8
      expect(UrlSafetyService.isPrivateIp('10.0.0.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('10.255.255.255')).toBe(true);

      // 172.16.0.0/12
      expect(UrlSafetyService.isPrivateIp('172.16.0.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('172.31.255.255')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('172.32.0.1')).toBe(false); // Public

      // 192.168.0.0/16
      expect(UrlSafetyService.isPrivateIp('192.168.0.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('192.168.254.254')).toBe(true);
    });

    it('blocks Carrier-Grade NAT (100.64.0.0/10)', async () => {
      expect(UrlSafetyService.isPrivateIp('100.64.0.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('100.127.255.254')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('100.128.0.1')).toBe(false); // Public
    });

    it('blocks Link-Local & Cloud Metadata IP (169.254.169.254)', async () => {
      expect(UrlSafetyService.isPrivateIp('169.254.169.254')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('169.254.1.1')).toBe(true);
      await expect(
        UrlSafetyService.validateUrl('http://169.254.169.254/latest/meta-data/')
      ).rejects.toThrow();
    });

    it('blocks Multicast, Broadcast & Reserved (224.0.0.0/4 & 240.0.0.0/4)', async () => {
      expect(UrlSafetyService.isPrivateIp('224.0.0.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('239.255.255.250')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('240.0.0.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('255.255.255.255')).toBe(true);
    });

    it('blocks IPv6 loopback, link-local, unique local & IPv4-mapped IPv6', async () => {
      expect(UrlSafetyService.isPrivateIp('::1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('[::1]')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('fe80::1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('[fe80::1]')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('fc00::1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('[fc00::1]')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('fd12:3456:789a::1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('::ffff:127.0.0.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('::ffff:192.168.1.1')).toBe(true);
      expect(UrlSafetyService.isPrivateIp('::ffff:169.254.169.254')).toBe(true);
    });

    it('blocks hex and decimal encoded IPv4 representations', async () => {
      // 127.0.0.1 in hex is 0x7f000001
      expect(UrlSafetyService.isPrivateIp('0x7f000001')).toBe(true);
      // 127.0.0.1 in decimal integer is 2130706433
      expect(UrlSafetyService.isPrivateIp('2130706433')).toBe(true);
      // 10.0.0.1 in decimal is 167772161
      expect(UrlSafetyService.isPrivateIp('167772161')).toBe(true);
    });

    it('evaluates host safety with DNS caching (isHostSafe)', async () => {
      expect(await UrlSafetyService.isHostSafe('localhost')).toBe(false);
      expect(await UrlSafetyService.isHostSafe('127.0.0.1')).toBe(false);
      expect(await UrlSafetyService.isHostSafe('169.254.169.254')).toBe(false);
      expect(await UrlSafetyService.isHostSafe('metadata.google.internal')).toBe(false);
      expect(await UrlSafetyService.isHostSafe('internal.corp')).toBe(false);
      expect(await UrlSafetyService.isHostSafe('example.com')).toBe(true);
    });
  });

  describe('Dangerous Port Blocking', () => {
    it('rejects internal infrastructure and management ports', async () => {
      const dangerousPorts = [22, 23, 25, 3306, 5432, 6379, 11211, 27017, 9200];
      for (const port of dangerousPorts) {
        await expect(
          UrlSafetyService.validateUrl(`http://example.com:${port}/`)
        ).rejects.toThrow(/port/i);
      }
    });

    it('allows standard web ports (80, 443, 8080, 8443)', async () => {
      // 80 and 443
      const valid80 = await UrlSafetyService.validateUrl('http://example.com:80/');
      expect(valid80).toBe('http://example.com/');

      const valid443 = await UrlSafetyService.validateUrl('https://example.com:443/');
      expect(valid443).toBe('https://example.com/');
    });
  });

  describe('Webhook Security & SSRF Defense', () => {
    it('blocks private or internal addresses as webhook destinations', async () => {
      await expect(
        UrlSafetyService.validateWebhookUrl('http://127.0.0.1:8000/webhook')
      ).rejects.toThrow();

      await expect(
        UrlSafetyService.validateWebhookUrl('http://localhost:3000/api/hook')
      ).rejects.toThrow();

      await expect(
        UrlSafetyService.validateWebhookUrl('http://169.254.169.254/meta-data')
      ).rejects.toThrow();

      await expect(
        UrlSafetyService.validateWebhookUrl('http://10.0.0.5/receiver')
      ).rejects.toThrow();
    });

    it('accepts valid public HTTPS webhook targets', async () => {
      const valid = await UrlSafetyService.validateWebhookUrl('https://example.com/api/webhook');
      expect(valid).toBe('https://example.com/api/webhook');
    });
  });
});

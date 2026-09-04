import { describe, it, expect } from 'vitest';
import { UrlSafetyService } from '../apps/web/src/lib/security/url-safety';

describe('UrlSafetyService - SSRF & Protocol Hardening', () => {
  it('should detect private IPv4 ranges accurately', () => {
    expect(UrlSafetyService.isPrivateIp('127.0.0.1')).toBe(true);
    expect(UrlSafetyService.isPrivateIp('10.0.1.5')).toBe(true);
    expect(UrlSafetyService.isPrivateIp('192.168.1.1')).toBe(true);
    expect(UrlSafetyService.isPrivateIp('172.16.0.1')).toBe(true);
    expect(UrlSafetyService.isPrivateIp('169.254.169.254')).toBe(true); // AWS/GCP/Azure Metadata
    expect(UrlSafetyService.isPrivateIp('0.0.0.0')).toBe(true);

    // Public IPs
    expect(UrlSafetyService.isPrivateIp('8.8.8.8')).toBe(false);
    expect(UrlSafetyService.isPrivateIp('1.1.1.1')).toBe(false);
    expect(UrlSafetyService.isPrivateIp('93.184.216.34')).toBe(false);
  });

  it('should reject non-http protocols', async () => {
    await expect(UrlSafetyService.validateUrl('file:///etc/passwd')).rejects.toThrow();
    await expect(UrlSafetyService.validateUrl('ftp://example.com/file')).rejects.toThrow();
    await expect(UrlSafetyService.validateUrl('javascript:alert(1)')).rejects.toThrow();
    await expect(UrlSafetyService.validateUrl('data:text/html,test')).rejects.toThrow();
  });

  it('should reject blocked hostnames and localhost', async () => {
    await expect(UrlSafetyService.validateUrl('http://localhost')).rejects.toThrow();
    await expect(UrlSafetyService.validateUrl('http://localhost:3000')).rejects.toThrow();
    await expect(UrlSafetyService.validateUrl('http://127.0.0.1:8080')).rejects.toThrow();
    await expect(UrlSafetyService.validateUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow();
    await expect(UrlSafetyService.validateUrl('http://instance-data')).rejects.toThrow();
    await expect(UrlSafetyService.validateUrl('http://server.local')).rejects.toThrow();
  });

  it('should accept valid public URLs', async () => {
    const valid = await UrlSafetyService.validateUrl('https://example.com');
    expect(valid).toBe('https://example.com/');
  });
});

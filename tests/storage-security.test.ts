import { describe, it, expect } from 'vitest';
import { LocalStorageProvider } from '@rendernest/providers';
import path from 'path';
import fs from 'fs';

describe('Storage Security - HMAC Signed URLs & Traversal Defense', () => {
  const testDir = path.resolve(process.cwd(), '.test-storage');
  const secretKey = 'test-secret-key-32-chars-long!!';
  const storage = new LocalStorageProvider({
    baseDir: testDir,
    appUrl: 'https://api.rendernest.com',
    secretKey,
  });

  it('generates a valid signed URL with HMAC-SHA256', async () => {
    const key = 'artifacts/screenshot_123.png';
    const signedUrl = await storage.createSignedUrl(key, 3600);

    expect(signedUrl).toContain('https://api.rendernest.com/api/storage/');
    expect(signedUrl).toContain('expires=');
    expect(signedUrl).toContain('signature=');

    const url = new URL(signedUrl);
    const expires = parseInt(url.searchParams.get('expires') || '0', 10);
    const signature = url.searchParams.get('signature') || '';

    expect(storage.verifySignature(key, expires, signature)).toBe(true);
  });

  it('rejects tampered signatures', async () => {
    const key = 'artifacts/doc.pdf';
    const signedUrl = await storage.createSignedUrl(key, 3600);
    const url = new URL(signedUrl);
    const expires = parseInt(url.searchParams.get('expires') || '0', 10);
    const signature = url.searchParams.get('signature') || '';

    // Tamper with signature
    const tampered = signature.slice(0, -4) + '0000';
    expect(storage.verifySignature(key, expires, tampered)).toBe(false);
  });

  it('rejects expired signed URLs', async () => {
    const key = 'artifacts/expired.png';
    // Expired 10 seconds ago
    const pastExpires = Math.floor(Date.now() / 1000) - 10;
    const crypto = await import('crypto');
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(`${key}:${pastExpires}`)
      .digest('hex');

    expect(storage.verifySignature(key, pastExpires, signature)).toBe(false);
  });

  it('rejects cross-resource URL tampering', async () => {
    const keyA = 'artifacts/userA_private.pdf';
    const keyB = 'artifacts/userB_secret.pdf';
    const signedUrl = await storage.createSignedUrl(keyA, 3600);
    const url = new URL(signedUrl);
    const expires = parseInt(url.searchParams.get('expires') || '0', 10);
    const signature = url.searchParams.get('signature') || '';

    // Attacker attempts to use keyA's signature to access keyB
    expect(storage.verifySignature(keyB, expires, signature)).toBe(false);
  });

  it('rejects directory traversal attempts (.. / etc / win.ini)', async () => {
    // Attempting to put outside baseDir must throw traversal error
    await expect(
      storage.put('../../../escaped.txt', Buffer.from('malicious content'))
    ).rejects.toThrow(/Path traversal attempt detected/);

    // Attempting to get outside baseDir must return null safely
    const result = await storage.get('../../package.json');
    expect(result).toBeNull();
  });

  it('neutralizes null bytes and sanitized path tricks', async () => {
    await expect(
      storage.put('secret\0/../../escaped.txt', Buffer.from('malicious content'))
    ).rejects.toThrow(/Path traversal attempt detected/);
  });
});

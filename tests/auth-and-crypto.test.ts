import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey, hashPassword, verifyPassword } from '../apps/web/src/lib/auth';

describe('Authentication & Cryptography', () => {
  it('should generate secure API keys with correct prefixes', () => {
    const liveKey = generateApiKey('live');
    expect(liveKey.rawKey.startsWith('wf_live_')).toBe(true);
    expect(liveKey.prefix.startsWith('wf_live_')).toBe(true);
    expect(liveKey.hash).toBe(hashApiKey(liveKey.rawKey));

    const testKey = generateApiKey('test');
    expect(testKey.rawKey.startsWith('wf_test_')).toBe(true);
    expect(testKey.prefix.startsWith('wf_test_')).toBe(true);
  });

  it('should hash and verify passwords properly using bcrypt', async () => {
    const rawPass = 'SecretPassword!123';
    const hash = await hashPassword(rawPass);

    expect(hash).not.toBe(rawPass);
    expect(await verifyPassword(rawPass, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });
});

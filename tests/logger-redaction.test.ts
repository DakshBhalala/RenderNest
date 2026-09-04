import { describe, it, expect } from 'vitest';
import { redactObject } from '../apps/web/src/lib/logger';

describe('Structured Logger Redaction', () => {
  it('redacts sensitive headers, API keys, and passwords', () => {
    const rawMeta = {
      requestId: 'req_123456789',
      endpoint: '/v1/render/screenshot',
      authorization: 'Bearer wf_live_secret_key_abcdef123456',
      apiKey: 'wf_live_super_secret_token_here',
      webhookSecret: 'whsec_9999999999',
      password: 'super_secure_password_123',
      nested: {
        token: 'eyJh...jwtToken',
        clientSecret: 'sk_test_12345',
        safeParam: 'public_value',
      },
    };

    const redacted = redactObject(rawMeta);

    expect(redacted.requestId).toBe('req_123456789');
    expect(redacted.endpoint).toBe('/v1/render/screenshot');
    expect(redacted.authorization).toContain('[REDACTED]');
    expect(redacted.apiKey).toContain('[REDACTED]');
    expect(redacted.webhookSecret).toBe('[REDACTED]');
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.nested.token).toBe('[REDACTED]');
    expect(redacted.nested.clientSecret).toBe('[REDACTED]');
    expect(redacted.nested.safeParam).toBe('public_value');
  });
});

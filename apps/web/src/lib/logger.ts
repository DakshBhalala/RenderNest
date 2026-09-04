/**
 * RenderNest Production Structured Logger with Automatic Secret Redaction
 */

const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'api_key',
  'apikey',
  'key',
  'keyhash',
  'secret',
  'webhooksecret',
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'privatekey',
]);

function redactValue(key: string, value: any): any {
  if (value === null || value === undefined) return value;

  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('token')) {
    if (typeof value === 'string') {
      if (value.startsWith('wf_live_') || value.startsWith('wf_test_')) {
        return `${value.slice(0, 12)}...[REDACTED]`;
      }
      if (value.startsWith('Bearer ')) {
        return `Bearer ${value.slice(7, 15)}...[REDACTED]`;
      }
      return '[REDACTED]';
    }
    return '[REDACTED]';
  }

  if (typeof value === 'object') {
    return redactObject(value);
  }

  return value;
}

export function redactObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item));
  }

  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    clean[k] = redactValue(k, v);
  }
  return clean;
}

export interface LogMetadata {
  requestId?: string;
  workspaceId?: string;
  apiKeyId?: string;
  operation?: string;
  endpoint?: string;
  statusCode?: number;
  latencyMs?: number;
  [key: string]: any;
}

export const logger = {
  info(message: string, meta?: LogMetadata) {
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...(meta ? redactObject(meta) : {}),
    };
    console.log(JSON.stringify(payload));
  },

  warn(message: string, meta?: LogMetadata) {
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...(meta ? redactObject(meta) : {}),
    };
    console.warn(JSON.stringify(payload));
  },

  error(message: string, meta?: LogMetadata) {
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      ...(meta ? redactObject(meta) : {}),
    };
    console.error(JSON.stringify(payload));
  },

  debug(message: string, meta?: LogMetadata) {
    if (process.env.NODE_ENV === 'production' && !process.env.DEBUG) return;
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      ...(meta ? redactObject(meta) : {}),
    };
    console.debug(JSON.stringify(payload));
  },
};

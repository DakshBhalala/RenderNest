import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface CachedResponse {
  statusCode: number;
  body: any;
  createdAt: number;
  payloadHash?: string;
  mismatch?: boolean;
}

const idempotencyStore = new Map<string, CachedResponse>();
const PERSISTENT_STORAGE_DIR = path.resolve(process.cwd(), '.storage', 'idempotency');

try {
  if (!fs.existsSync(PERSISTENT_STORAGE_DIR)) {
    fs.mkdirSync(PERSISTENT_STORAGE_DIR, { recursive: true });
  }
} catch {
  // Directory initialization fallback
}

function getDiskKey(compositeKey: string): string {
  const hash = crypto.createHash('sha256').update(compositeKey).digest('hex');
  return path.join(PERSISTENT_STORAGE_DIR, `${hash}.json`);
}

// Prune memory entries older than 24 hours every 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, value] of idempotencyStore.entries()) {
    if (value.createdAt < cutoff) {
      idempotencyStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

export class IdempotencyService {
  static get(
    workspaceId: string,
    idempotencyKey: string,
    currentPayloadHash?: string
  ): CachedResponse | null {
    const key = `${workspaceId}:${idempotencyKey}`;
    let entry = idempotencyStore.get(key);

    // If not in memory, attempt to recover from persistent disk cache
    if (!entry) {
      const diskPath = getDiskKey(key);
      if (fs.existsSync(diskPath)) {
        try {
          const raw = fs.readFileSync(diskPath, 'utf-8');
          entry = JSON.parse(raw);
          if (entry) {
            idempotencyStore.set(key, entry);
          }
        } catch {
          // File read / parse error
        }
      }
    }

    if (!entry) return null;

    // Expire after 24 hours
    if (Date.now() - entry.createdAt > 24 * 60 * 60 * 1000) {
      idempotencyStore.delete(key);
      try {
        const diskPath = getDiskKey(key);
        if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
      } catch {}
      return null;
    }

    // Detect idempotency key reuse with different request payload
    if (currentPayloadHash && entry.payloadHash && entry.payloadHash !== currentPayloadHash) {
      return { ...entry, mismatch: true };
    }

    return entry;
  }

  static set(
    workspaceId: string,
    idempotencyKey: string,
    statusCode: number,
    body: any,
    payloadHash?: string
  ): void {
    const key = `${workspaceId}:${idempotencyKey}`;
    const payload: CachedResponse = {
      statusCode,
      body,
      createdAt: Date.now(),
      payloadHash,
    };

    idempotencyStore.set(key, payload);

    // Asynchronously write to persistent disk storage
    try {
      const diskPath = getDiskKey(key);
      fs.promises.writeFile(diskPath, JSON.stringify(payload), 'utf-8').catch(() => {});
    } catch {
      // Non-blocking disk persistence failure
    }
  }

  static clearMemoryCache(): void {
    idempotencyStore.clear();
  }
}

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageProvider, StoragePutOptions, StoragePutResult } from './storage-provider';

export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;
  private appUrl: string;
  private secretKey: string;

  constructor(options?: { baseDir?: string; appUrl?: string; secretKey?: string }) {
    this.baseDir = options?.baseDir || process.env.LOCAL_STORAGE_PATH || path.resolve(process.cwd(), '.storage');
    this.appUrl = options?.appUrl || process.env.APP_URL || 'http://localhost:3000';
    this.secretKey = options?.secretKey || process.env.AUTH_SECRET || 'RenderNest-local-storage-secret-key-32chars';

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    const resolvedBase = path.resolve(this.baseDir);
    // Sanitize key: strip null bytes and normalize slashes
    const cleanKey = key.replace(/\0/g, '').replace(/\\/g, '/');
    const safeKey = cleanKey.replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');
    const fullPath = path.resolve(resolvedBase, safeKey);

    // Enforce base directory containment to prevent directory traversal
    if (!fullPath.startsWith(resolvedBase + path.sep) && fullPath !== resolvedBase) {
      throw new Error(`Path traversal attempt detected: target '${key}' resolves outside base directory.`);
    }

    const targetDir = path.dirname(fullPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return fullPath;
  }

  private getMetaPath(key: string): string {
    return `${this.getFilePath(key)}.meta.json`;
  }

  async put(key: string, buffer: Buffer, options?: StoragePutOptions): Promise<StoragePutResult> {
    const filePath = this.getFilePath(key);
    await fs.promises.writeFile(filePath, buffer);

    const contentType = options?.contentType || 'application/octet-stream';
    const expiresAt = options?.expiresInSeconds ? Date.now() + options.expiresInSeconds * 1000 : null;

    const meta = {
      contentType,
      size: buffer.length,
      expiresAt,
      metadata: options?.metadata || {},
      createdAt: Date.now(),
    };

    await fs.promises.writeFile(this.getMetaPath(key), JSON.stringify(meta, null, 2), 'utf-8');

    const signedUrl = await this.createSignedUrl(key, options?.expiresInSeconds || 86400);

    return {
      key,
      url: signedUrl,
      size: buffer.length,
    };
  }

  async get(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const filePath = this.getFilePath(key);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const buffer = await fs.promises.readFile(filePath);
      let contentType = 'application/octet-stream';

      const metaPath = this.getMetaPath(key);
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf-8'));
          if (meta.expiresAt && Date.now() > meta.expiresAt) {
            await this.delete(key);
            return null;
          }
          if (meta.contentType) {
            contentType = meta.contentType;
          }
        } catch {
          // Fall back to default contentType
        }
      }

      return { buffer, contentType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      const metaPath = this.getMetaPath(key);

      let deleted = false;
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        deleted = true;
      }
      if (fs.existsSync(metaPath)) {
        await fs.promises.unlink(metaPath);
      }
      return deleted;
    } catch {
      return false;
    }
  }

  async createSignedUrl(key: string, expiresInSeconds: number = 86400): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signaturePayload = `${key}:${expires}`;
    const signature = crypto.createHmac('sha256', this.secretKey).update(signaturePayload).digest('hex');

    const baseUrl = this.appUrl.replace(/\/+$/, '');
    const cleanKey = encodeURIComponent(key);
    return `${baseUrl}/api/storage/${cleanKey}?expires=${expires}&signature=${signature}`;
  }

  verifySignature(key: string, expires: number, signature: string): boolean {
    if (Math.floor(Date.now() / 1000) > expires) {
      return false;
    }
    const expected = crypto.createHmac('sha256', this.secretKey).update(`${key}:${expires}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  async cleanupExpired(): Promise<number> {
    let count = 0;
    try {
      const files = await fs.promises.readdir(this.baseDir);
      for (const file of files) {
        if (file.endsWith('.meta.json')) {
          const metaPath = path.join(this.baseDir, file);
          try {
            const raw = await fs.promises.readFile(metaPath, 'utf-8');
            const meta = JSON.parse(raw);
            if (meta.expiresAt && Date.now() > meta.expiresAt) {
              const origFile = metaPath.replace('.meta.json', '');
              if (fs.existsSync(origFile)) {
                await fs.promises.unlink(origFile);
              }
              await fs.promises.unlink(metaPath);
              count++;
            }
          } catch {
            // Ignore corrupted meta
          }
        }
      }
    } catch {
      // Directory read error
    }
    return count;
  }
}

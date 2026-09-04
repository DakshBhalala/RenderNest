export interface StoragePutOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  expiresInSeconds?: number;
}

export interface StoragePutResult {
  key: string;
  url: string;
  size: number;
}

export interface IStorageProvider {
  put(key: string, buffer: Buffer, options?: StoragePutOptions): Promise<StoragePutResult>;
  get(key: string): Promise<{ buffer: Buffer; contentType: string } | null>;
  delete(key: string): Promise<boolean>;
  createSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  cleanupExpired(): Promise<number>;
}

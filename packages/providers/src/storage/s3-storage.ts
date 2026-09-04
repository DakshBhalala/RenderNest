import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider, StoragePutOptions, StoragePutResult } from './storage-provider';

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(options?: {
    endpoint?: string;
    bucket?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }) {
    this.bucket = options?.bucket || process.env.S3_BUCKET || process.env.R2_BUCKET || 'rendernest-production-artifacts';

    let endpoint = options?.endpoint || process.env.S3_ENDPOINT;
    if (!endpoint && process.env.R2_ACCOUNT_ID) {
      endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    }

    const accessKeyId =
      options?.accessKeyId || process.env.S3_ACCESS_KEY || process.env.R2_ACCESS_KEY || '';
    const secretAccessKey =
      options?.secretAccessKey || process.env.S3_SECRET_KEY || process.env.R2_SECRET_KEY || '';
    const region = options?.region || process.env.S3_REGION || 'auto';

    this.client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async put(key: string, buffer: Buffer, options?: StoragePutOptions): Promise<StoragePutResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: options?.contentType || 'application/octet-stream',
      Metadata: options?.metadata,
    });

    await this.client.send(command);

    const signedUrl = await this.createSignedUrl(key, options?.expiresInSeconds || 86400);

    return {
      key,
      url: signedUrl,
      size: buffer.length,
    };
  }

  async get(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      if (!response.Body) {
        return null;
      }

      const byteArray = await response.Body.transformToByteArray();
      return {
        buffer: Buffer.from(byteArray),
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async createSignedUrl(key: string, expiresInSeconds: number = 86400): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async cleanupExpired(): Promise<number> {
    // S3 handles lifecycle expirations natively via bucket lifecycle rules
    return 0;
  }
}

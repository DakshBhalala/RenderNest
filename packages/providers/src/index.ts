export * from './storage/storage-provider';
export * from './storage/local-storage';
export * from './storage/s3-storage';

export * from './browser/browser-provider';
export * from './browser/playwright-browser';

export * from './extract/extraction-provider';
export * from './extract/local-extractor';
export * from './extract/openai-extractor';
export * from './extract/content-extractor';

export * from './convert/pdf-converter';
export * from './convert/docx-converter';

export * from './queue/queue-provider';
export * from './queue/bullmq-queue';
export * from './queue/memory-queue';

export * from './compare/visual-compare';
export * from './security/url-safety';
export * from './security/url-normalizer';
export * from './graph/page-document';
export * from './graph/execution-planner';
export * from './extract/extraction-engine';

import { IStorageProvider } from './storage/storage-provider';
import { LocalStorageProvider } from './storage/local-storage';
import { S3StorageProvider } from './storage/s3-storage';
import { IBrowserProvider } from './browser/browser-provider';
import { PlaywrightBrowserProvider } from './browser/playwright-browser';
import { IExtractionProvider } from './extract/extraction-provider';
import { LocalExtractionProvider } from './extract/local-extractor';
import { OpenAIExtractionProvider } from './extract/openai-extractor';
import { IQueueProvider } from './queue/queue-provider';
import { BullMQQueueProvider } from './queue/bullmq-queue';
import { MemoryQueueProvider } from './queue/memory-queue';
import { PdfConverter } from './convert/pdf-converter';
import { DocxConverter } from './convert/docx-converter';

let storageProviderInstance: IStorageProvider | null = null;
let browserProviderInstance: IBrowserProvider | null = null;
let extractionProviderInstance: IExtractionProvider | null = null;
let queueProviderInstance: IQueueProvider | null = null;
let pdfConverterInstance: PdfConverter | null = null;
let docxConverterInstance: DocxConverter | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageProviderInstance) {
    const providerType = process.env.STORAGE_PROVIDER || 'local';
    if (providerType === 's3' || providerType === 'r2') {
      storageProviderInstance = new S3StorageProvider();
    } else {
      storageProviderInstance = new LocalStorageProvider();
    }
  }
  return storageProviderInstance;
}

export function getBrowserProvider(): IBrowserProvider {
  if (!browserProviderInstance) {
    browserProviderInstance = new PlaywrightBrowserProvider();
  }
  return browserProviderInstance;
}

export function getExtractionProvider(): IExtractionProvider {
  if (!extractionProviderInstance) {
    const providerType = process.env.EXTRACTION_PROVIDER;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if ((providerType === 'openai' || (!providerType && hasOpenAI)) && hasOpenAI) {
      extractionProviderInstance = new OpenAIExtractionProvider();
    } else {
      extractionProviderInstance = new LocalExtractionProvider();
    }
  }
  return extractionProviderInstance;
}

export function getQueueProvider(): IQueueProvider {
  if (!queueProviderInstance) {
    if (process.env.REDIS_URL) {
      try {
        queueProviderInstance = new BullMQQueueProvider();
      } catch {
        console.warn('Failed to connect to Redis. Falling back to in-memory queue provider.');
        queueProviderInstance = new MemoryQueueProvider();
      }
    } else {
      queueProviderInstance = new MemoryQueueProvider();
    }
  }
  return queueProviderInstance;
}

export function getPdfConverter(): PdfConverter {
  if (!pdfConverterInstance) {
    pdfConverterInstance = new PdfConverter(getBrowserProvider());
  }
  return pdfConverterInstance;
}

export function getDocxConverter(): DocxConverter {
  if (!docxConverterInstance) {
    docxConverterInstance = new DocxConverter();
  }
  return docxConverterInstance;
}

export async function checkRedisHealth(): Promise<{ ready: boolean; status: string }> {
  if (!process.env.REDIS_URL) {
    return { ready: true, status: 'skipped_memory_mode' };
  }
  try {
    const Redis = (await import('ioredis')).default;
    const client = new Redis(process.env.REDIS_URL, {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });
    await client.connect();
    const pingRes = await client.ping();
    client.disconnect();
    return pingRes === 'PONG'
      ? { ready: true, status: 'ready' }
      : { ready: false, status: 'unexpected_response' };
  } catch (err: any) {
    return { ready: false, status: `unreachable: ${err.message}` };
  }
}


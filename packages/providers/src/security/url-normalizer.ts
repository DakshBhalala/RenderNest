import crypto from 'crypto';

export class UrlNormalizer {
  // Tracking query parameters stripped to prevent duplicate cache misses and crawler loops
  private static TRACKING_PARAMS = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'utm_id',
    'fbclid',
    'gclid',
    'gclsrc',
    'dclid',
    'msclkid',
    'mc_eid',
    'mc_cid',
    'yclid',
    'igshid',
    'ref',
    '_ga',
    '_gl',
  ]);

  /**
   * Normalizes a URL:
   * - Lowercases protocol and host
   * - Strips tracking and analytics parameters
   * - Sorts query parameters alphabetically
   * - Removes URL fragments/hashes
   * - Strips redundant default ports (80 for http, 443 for https)
   * - Trims trailing slash if not root
   */
  static normalize(rawUrl: string): string {
    const url = new URL(rawUrl.trim());

    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();

    // Remove default ports
    if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) {
      url.port = '';
    }

    // Remove fragment
    url.hash = '';

    // Filter and sort query params
    const searchParams = new URLSearchParams();
    const sortedKeys = Array.from(url.searchParams.keys()).sort();

    for (const key of sortedKeys) {
      if (!this.TRACKING_PARAMS.has(key.toLowerCase())) {
        const values = url.searchParams.getAll(key);
        for (const val of values) {
          searchParams.append(key, val);
        }
      }
    }

    url.search = searchParams.toString();

    // Remove trailing slash if path is longer than '/'
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }

    return url.toString();
  }

  /**
   * Generates a cryptographic SHA-256 hash of normalized text or HTML
   */
  static computeContentHash(content: string): string {
    return crypto.createHash('sha256').update(content.trim()).digest('hex');
  }

  static hashContent(content: string): string {
    return this.computeContentHash(content);
  }
}

export interface PageSnapshot {
  url: string;
  normalizedUrl?: string;
  timestamp?: string;
  contentHash?: string;
  text?: string;
  markdown?: string;
  title?: string;
  status?: number;
  statusCode?: number;
  textWordCount?: number;
  metadataTitle?: string;
}

export class ChangeDetector {
  /**
   * Compares two snapshots/documents and determines semantic and structural drift
   */
  static compare(
    previous: any,
    current: any
  ): {
    identical: boolean;
    hasChanged: boolean;
    contentChanged: boolean;
    textChanged: boolean;
    markdownChanged: boolean;
    titleChanged: boolean;
    statusChanged: boolean;
    wordCountDelta: number;
    changes: string[];
  } {
    const prevText = previous.text || '';
    const currText = current.text || '';
    const prevMd = previous.markdown || '';
    const currMd = current.markdown || '';
    const prevTitle = previous.title || previous.metadataTitle || previous.metadata?.title || '';
    const currTitle = current.title || current.metadataTitle || current.metadata?.title || '';
    const prevStatus = previous.status ?? previous.statusCode ?? 200;
    const currStatus = current.status ?? current.statusCode ?? 200;

    const prevHash = previous.contentHash || UrlNormalizer.computeContentHash(prevText || previous.html || '');
    const currHash = current.contentHash || UrlNormalizer.computeContentHash(currText || current.html || '');

    const contentChanged = prevHash !== currHash;
    const textChanged = prevText !== currText;
    const markdownChanged = prevMd !== currMd;
    const titleChanged = prevTitle !== currTitle;
    const statusChanged = prevStatus !== currStatus;

    const changes: string[] = [];
    if (titleChanged) {
      changes.push(`title changed ("${prevTitle}" -> "${currTitle}")`);
    }
    if (statusChanged) {
      changes.push(`status changed (${prevStatus} -> ${currStatus})`);
    }
    if (textChanged || contentChanged) {
      changes.push('text content hash changed');
    }
    if (markdownChanged) {
      changes.push('markdown content changed');
    }

    const hasChanged = contentChanged || textChanged || markdownChanged || titleChanged || statusChanged;

    const prevWords = previous.textWordCount ?? prevText.split(/\s+/).filter(Boolean).length;
    const currWords = current.textWordCount ?? currText.split(/\s+/).filter(Boolean).length;

    return {
      identical: !hasChanged,
      hasChanged,
      contentChanged,
      textChanged,
      markdownChanged,
      titleChanged,
      statusChanged,
      wordCountDelta: currWords - prevWords,
      changes,
    };
  }
}

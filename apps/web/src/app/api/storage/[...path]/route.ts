import { NextRequest, NextResponse } from 'next/server';
import { getStorageProvider, LocalStorageProvider } from '@rendernest/providers';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Prevent directory traversal
  if (params.path.some((segment) => segment === '..' || segment === '.' || segment.includes('/') || segment.includes('\\'))) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  const fileKey = params.path.join('/');
  const expires = request.nextUrl.searchParams.get('expires');
  const signature = request.nextUrl.searchParams.get('signature');

  // Strictly require valid signed URL tokens to access any stored artifacts
  if (!expires || !signature) {
    return NextResponse.json(
      { error: 'Forbidden: Access to stored assets requires a valid signature and expiration timestamp.' },
      { status: 403 }
    );
  }

  const expTimestamp = parseInt(expires, 10);
  if (isNaN(expTimestamp) || Math.floor(Date.now() / 1000) > expTimestamp) {
    return NextResponse.json(
      { error: 'Forbidden: Signed download link has expired.' },
      { status: 403 }
    );
  }

  const storage = getStorageProvider();

  if (storage instanceof LocalStorageProvider) {
    const isValid = storage.verifySignature(fileKey, expTimestamp, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid signature token.' },
        { status: 403 }
      );
    }
  }

  const result = await storage.get(fileKey);
  if (!result) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return new NextResponse(result.buffer as any, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

import { NextResponse } from 'next/server';
import { metrics } from '../../../lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = metrics.getSnapshot();
  return NextResponse.json(snapshot, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json',
    },
  });
}

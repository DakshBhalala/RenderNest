import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ authenticated: false, user: null, workspace: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: current.user,
    workspace: current.workspace,
  });
}

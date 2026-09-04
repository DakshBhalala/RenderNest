import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { hashPassword, createSessionToken, generateApiKey } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Valid email and password (min 6 characters) are required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const slug = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Create User, Workspace, Membership, and Default API key in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          name: name || 'Developer',
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${name || 'Personal'}'s Workspace`,
          slug,
          planTier: 'free',
          creditBalance: 500, // 500 free credits upon signup
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'OWNER',
        },
      });

      // Generate initial dev API key
      const keyGen = generateApiKey('live');
      await tx.apiKey.create({
        data: {
          workspaceId: workspace.id,
          name: 'Default Key',
          keyPrefix: keyGen.prefix,
          keyHash: keyGen.hash,
          environment: 'live',
        },
      });

      return { user, workspace, initialKey: keyGen.rawKey };
    });

    const token = await createSessionToken(result.user.id);

    const response = NextResponse.json({
      success: true,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      workspace: result.workspace,
      initial_api_key: result.initialKey,
    });

    response.cookies.set('rendernest_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 86400,
    });

    return response;
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}

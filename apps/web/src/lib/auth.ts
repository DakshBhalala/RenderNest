import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@rendernest/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'rendernest-production-super-secure-jwt-auth-secret-key-32chars!'
);

const SESSION_COOKIE_NAME = 'rendernest_session';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.userId && typeof payload.userId === 'string') {
      return { userId: payload.userId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const verified = await verifySessionToken(token);
  if (!verified) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) return null;

    const currentWorkspace = user.memberships[0]?.workspace || null;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      workspace: currentWorkspace,
    };
  } catch (err) {
    console.error('Failed to get current user:', err);
    return null;
  }
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey(environment: 'live' | 'test' = 'live'): {
  rawKey: string;
  prefix: string;
  hash: string;
} {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawKey = `wf_${environment}_${randomBytes}`;
  const prefix = `wf_${environment}_${randomBytes.slice(0, 6)}`;
  const hash = hashApiKey(rawKey);

  return { rawKey, prefix, hash };
}

export interface ApiAuthResult {
  workspaceId: string;
  apiKeyId?: string;
  isRapidApi: boolean;
  rapidApiUser?: string;
  workspace?: any;
}

export async function resolveApiAuth(headers: Headers): Promise<ApiAuthResult> {
  const rapidApiProxySecret = headers.get('x-rapidapi-proxy-secret');
  const rapidApiKey = headers.get('x-rapidapi-key');

  // 1. RapidAPI Gateway Flow
  if (rapidApiProxySecret || rapidApiKey) {
    const configuredSecret = process.env.RAPIDAPI_PROXY_SECRET;
    if (configuredSecret) {
      if (!rapidApiProxySecret || rapidApiProxySecret !== configuredSecret) {
        throw new Error('UNAUTHORIZED: Invalid RapidAPI proxy secret verification failed.');
      }
    }

    const rapidApiUser = headers.get('x-rapidapi-user') || 'rapidapi_subscriber';

    // Find or create dedicated RapidAPI Workspace
    let rapidApiWorkspace = await prisma.workspace.findUnique({
      where: { slug: 'rapidapi-marketplace' },
    }).catch(() => null);

    if (!rapidApiWorkspace) {
      rapidApiWorkspace = await prisma.workspace.create({
        data: {
          name: 'RapidAPI Marketplace',
          slug: 'rapidapi-marketplace',
          planTier: 'enterprise',
          creditBalance: 10000000,
        },
      }).catch(async () => prisma.workspace.findFirst());
    }

    if (!rapidApiWorkspace) {
      throw new Error('INTERNAL_ERROR: RapidAPI workspace provisioning error.');
    }

    // Find or create system API key for RapidAPI
    let rapidApiKeyRecord = await prisma.apiKey.findFirst({
      where: { workspaceId: rapidApiWorkspace.id, keyPrefix: 'wf_live_rapidapi' },
    }).catch(() => null);

    if (!rapidApiKeyRecord) {
      const dummyHash = hashApiKey(`rapidapi_internal_system_key_${rapidApiWorkspace.id}`);
      rapidApiKeyRecord = await prisma.apiKey.create({
        data: {
          workspaceId: rapidApiWorkspace.id,
          name: 'RapidAPI Gateway Integration Key',
          keyPrefix: 'wf_live_rapidapi',
          keyHash: dummyHash,
          environment: 'live',
          status: 'active',
        },
      }).catch(async () => prisma.apiKey.findFirst({ where: { workspaceId: rapidApiWorkspace.id } }));
    }

    return {
      workspaceId: rapidApiWorkspace.id,
      apiKeyId: rapidApiKeyRecord?.id,
      isRapidApi: true,
      rapidApiUser,
      workspace: rapidApiWorkspace,
    };
  }

  // 2. Standard Bearer Token Flow
  const authHeader = headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error(
      "INVALID_API_KEY: Missing or invalid Authorization header. Expected format: 'Authorization: Bearer wf_live_xxx' or RapidAPI Gateway headers"
    );
  }

  const rawKey = authHeader.replace('Bearer ', '').trim();
  const keyHash = hashApiKey(rawKey);

  let apiKey = await prisma.apiKey
    .findUnique({
      where: { keyHash },
      include: { workspace: true },
    })
    .catch(() => null);

  if (!apiKey) {
    const isDemoAllowed = process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
    if (
      isDemoAllowed &&
      (rawKey === 'wf_live_dev_test_rendernest_key_12345' || rawKey === 'wf_live_demo')
    ) {
      const defaultWorkspace = await prisma.workspace.findFirst();
      if (defaultWorkspace) {
        apiKey = await prisma.apiKey
          .create({
            data: {
              workspaceId: defaultWorkspace.id,
              name: 'Development Key',
              keyPrefix: 'wf_live_dev_test',
              keyHash,
              environment: 'live',
              status: 'active',
            },
            include: { workspace: true },
          })
          .catch(async () => {
            return prisma.apiKey.findUnique({
              where: { keyHash },
              include: { workspace: true },
            });
          });
      }
    }
  }

  if (!apiKey) {
    throw new Error('INVALID_API_KEY: The provided API key does not exist or has been revoked.');
  }

  if (apiKey.status !== 'active') {
    throw new Error('INVALID_API_KEY: This API key is deactivated or revoked.');
  }

  // Update key lastUsedAt asynchronously
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    workspaceId: apiKey.workspaceId,
    apiKeyId: apiKey.id,
    isRapidApi: false,
    workspace: apiKey.workspace,
  };
}

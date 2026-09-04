import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current?.workspace) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));
  const endpoint = searchParams.get('endpoint');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: any = { workspaceId: current.workspace.id };

  if (endpoint && endpoint !== 'all') {
    where.operation = endpoint;
  }

  if (status && status !== 'all') {
    const code = parseInt(status, 10);
    if (!isNaN(code)) {
      if (code === 200) {
        where.statusCode = { gte: 200, lt: 300 };
      } else if (code === 400) {
        where.statusCode = { gte: 400, lt: 500 };
      } else if (code === 500) {
        where.statusCode = { gte: 500 };
      }
    }
  }

  if (search) {
    where.OR = [
      { id: { contains: search } },
      { endpoint: { contains: search } },
      { errorMessage: { contains: search } },
    ];
  }

  const [total, logs] = await Promise.all([
    prisma.requestLog.count({ where }),
    prisma.requestLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        apiKey: {
          select: { name: true, keyPrefix: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

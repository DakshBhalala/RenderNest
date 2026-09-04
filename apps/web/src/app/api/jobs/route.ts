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
  const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '20', 10)));

  const where = { workspaceId: current.workspace.id };

  const [total, rawJobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const jobs = rawJobs.map((j) => {
    let parsedInput = null;
    let parsedOutput = null;
    try {
      parsedInput = JSON.parse(j.input);
    } catch {}
    try {
      parsedOutput = j.output ? JSON.parse(j.output) : null;
    } catch {}

    return {
      ...j,
      input: parsedInput,
      output: parsedOutput,
    };
  });

  return NextResponse.json({
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

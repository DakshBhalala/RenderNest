import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { ApiError } from '@rendernest/shared';
import { resolveApiAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = request.headers.get('x-request-id') || `req_${Date.now()}`;

  try {
    let authResult;
    try {
      authResult = await resolveApiAuth(request.headers);
    } catch (err: any) {
      if (err.message.includes('UNAUTHORIZED:')) {
        throw ApiError.unauthorized(err.message.replace('UNAUTHORIZED:', '').trim());
      }
      throw ApiError.invalidApiKey(err.message);
    }

    const callerWorkspaceId = authResult.workspaceId;

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
    });

    // Enforce strict multi-tenant boundary: never reveal foreign tenant jobs
    if (!job || job.workspaceId !== callerWorkspaceId) {
      throw ApiError.notFound(`Job with ID '${params.jobId}' was not found.`);
    }

    let parsedOutput = null;
    if (job.output) {
      try {
        parsedOutput = JSON.parse(job.output);
      } catch {
        parsedOutput = job.output;
      }
    }

    return NextResponse.json({
      success: true,
      request_id: requestId,
      data: {
        job_id: job.id,
        workspace_id: job.workspaceId,
        operation: job.operation,
        status: job.status,
        retry_count: job.retryCount,
        created_at: job.createdAt,
        started_at: job.startedAt,
        completed_at: job.completedAt,
        output: parsedOutput,
        error: job.errorMessage,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      return NextResponse.json(err.toResponse(requestId), { status: err.statusCode });
    }
    const internalErr = ApiError.internal(err.message);
    return NextResponse.json(internalErr.toResponse(requestId), { status: 500 });
  }
}

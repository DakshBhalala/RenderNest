import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@rendernest/database';
import { ApiError } from '@rendernest/shared';
import { resolveApiAuth } from '@/lib/auth';

export async function POST(
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

    // Enforce tenant boundary
    if (!job || job.workspaceId !== callerWorkspaceId) {
      throw ApiError.notFound(`Job with ID '${params.jobId}' was not found.`);
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw ApiError.invalidRequest(`Job cannot be cancelled because it is already ${job.status}.`);
    }

    if (job.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        request_id: requestId,
        data: {
          job_id: job.id,
          status: 'cancelled',
          message: 'Job is already cancelled.',
        },
      });
    }

    // Cancel job
    const updated = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        errorMessage: 'Cancelled by user request.',
      },
    });

    return NextResponse.json({
      success: true,
      request_id: requestId,
      data: {
        job_id: updated.id,
        status: 'cancelled',
        message: 'Job has been successfully cancelled.',
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

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ZodSchema } from 'zod';
import { prisma } from '@rendernest/database';
import {
  ApiError,
  OPERATIONS,
  OperationDefinition,
  PLANS,
} from '@rendernest/shared';
import { hashApiKey, resolveApiAuth } from './auth';
import { IdempotencyService } from './idempotency';
import { logger } from './logger';
import { metrics } from './metrics';

export interface ApiHandlerContext {
  requestId: string;
  workspaceId: string;
  apiKeyId?: string;
  operation: string;
  operationDef: OperationDefinition;
}

// In-memory rate limiting tracker (sliding window)
const rateLimitMap = new Map<string, { timestamps: number[] }>();

function checkRateLimit(key: string, limitRpm: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  let record = rateLimitMap.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter timestamps within last 60 seconds
  record.timestamps = record.timestamps.filter((ts) => ts > oneMinuteAgo);

  const currentCount = record.timestamps.length;
  const remaining = Math.max(0, limitRpm - currentCount);

  if (currentCount >= limitRpm) {
    return { allowed: false, remaining: 0 };
  }

  record.timestamps.push(now);
  return { allowed: true, remaining: remaining - 1 };
}

export function createApiHandler<TInput, TOutput>(options: {
  operation: string;
  schema: ZodSchema<TInput>;
  handler: (input: TInput, context: ApiHandlerContext) => Promise<TOutput>;
}) {
  const { operation, schema, handler } = options;
  const operationDef = OPERATIONS[operation] || {
    name: operation,
    operation,
    credits: 1,
    timeoutMs: 30000,
    queue: 'default',
    enabled: true,
    description: '',
  };

  return async function handle(request: NextRequest): Promise<NextResponse> {
    const rawReqId = request.headers.get('x-request-id');
    const requestId =
      rawReqId && /^[a-zA-Z0-9_\-]{8,64}$/.test(rawReqId)
        ? rawReqId
        : `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    const startTime = Date.now();
    metrics.recordRequestStart();

    let workspaceId: string | undefined = undefined;
    let apiKeyId: string | undefined = undefined;
    let workspace: any = null;
    let rawBody: any = null;
    let creditDeducted = false;

    // Standard security and tracking response headers
    const responseHeaders = new Headers();
    responseHeaders.set('X-Request-Id', requestId);
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    try {
      // 1. Validate payload size before auth & processing
      const contentLengthHeader = request.headers.get('content-length');
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 5 * 1024 * 1024) {
        throw ApiError.invalidRequest('Payload exceeds maximum permitted size of 5MB.');
      }

      // 2. Authenticate Request (supports standard Bearer API key & RapidAPI Gateway)
      let authResult;
      try {
        authResult = await resolveApiAuth(request.headers);
      } catch (err: any) {
        if (err.message.includes('UNAUTHORIZED:')) {
          throw ApiError.unauthorized(err.message.replace('UNAUTHORIZED:', '').trim());
        }
        if (err.message.includes('INVALID_API_KEY:')) {
          throw ApiError.invalidApiKey(err.message.replace('INVALID_API_KEY:', '').trim());
        }
        throw ApiError.invalidApiKey(err.message);
      }

      workspaceId = authResult.workspaceId;
      apiKeyId = authResult.apiKeyId;
      workspace = authResult.workspace;

      if (authResult.isRapidApi) {
        responseHeaders.set('X-RapidAPI-Proxied', 'true');
        if (authResult.rapidApiUser) {
          responseHeaders.set('X-RapidAPI-User', authResult.rapidApiUser);
        }
      }

      // 2. Validate Body & Size before credit deduction
      try {
        rawBody = await request.json();
      } catch {
        throw ApiError.invalidRequest('Request body must be valid JSON.');
      }

      const parseResult = schema.safeParse(rawBody);
      if (!parseResult.success) {
        const issues = parseResult.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join(', ');
        throw ApiError.invalidRequest(
          `Payload validation failed: ${issues}`,
          parseResult.error.format()
        );
      }

      const rawBodyString = JSON.stringify(rawBody);
      const payloadHash = crypto.createHash('sha256').update(rawBodyString).digest('hex');

      // 3. Check Idempotency Header & Payload Hash
      const idempotencyKey =
        request.headers.get('idempotency-key') ||
        request.headers.get('x-idempotency-key');

      if (idempotencyKey && idempotencyKey.length <= 256) {
        const cached = IdempotencyService.get(workspaceId, idempotencyKey, payloadHash);
        if (cached?.mismatch) {
          throw ApiError.idempotencyConflict(
            'Idempotency key was previously used with a different request payload.'
          );
        }
        if (cached) {
          const latencyMs = Date.now() - startTime;
          metrics.recordRequestEnd(operation, cached.statusCode, latencyMs, 0);
          responseHeaders.set('Idempotency-Replay', 'true');
          return NextResponse.json(cached.body, {
            status: cached.statusCode,
            headers: responseHeaders,
          });
        }
      }

      // 4. Check Rate Limit
      const planTier = (workspace?.planTier || 'free') as keyof typeof PLANS;
      const plan = PLANS[planTier] || PLANS.free;
      const { allowed: rateLimitOk, remaining } = checkRateLimit(workspaceId, plan.rateLimitRpm);

      responseHeaders.set('X-RateLimit-Limit', String(plan.rateLimitRpm));
      responseHeaders.set('X-RateLimit-Remaining', String(remaining));

      if (!rateLimitOk) {
        responseHeaders.set('Retry-After', '60');
        const err = ApiError.rateLimited(
          `Rate limit of ${plan.rateLimitRpm} RPM exceeded for workspace tier '${planTier}'. Please retry in a few seconds.`
        );
        return NextResponse.json(err.toResponse(requestId), {
          status: 429,
          headers: responseHeaders,
        });
      }

      // 5. Atomic Credit Reservation
      // Prevents race conditions by conditionally updating only when balance >= credits required
      if (operationDef.credits > 0) {
        const updateResult = await prisma.workspace.updateMany({
          where: {
            id: workspaceId,
            creditBalance: { gte: operationDef.credits },
          },
          data: {
            creditBalance: { decrement: operationDef.credits },
          },
        });

        if (updateResult.count === 0) {
          const ws = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { creditBalance: true },
          });
          const available = ws?.creditBalance ?? 0;
          throw ApiError.quotaExceeded(
            `Insufficient credit balance (${available} credits available, ${operationDef.credits} required). Please upgrade your subscription.`
          );
        }
        creditDeducted = true;
      }

      // 6. Execute Operation Handler
      const data = await handler(parseResult.data, {
        requestId,
        workspaceId,
        apiKeyId,
        operation,
        operationDef,
      });

      const latencyMs = Date.now() - startTime;
      metrics.recordRequestEnd(operation, 200, latencyMs, operationDef.credits);

      // 7. Record Credit Transaction & Request Log Asynchronously
      if (creditDeducted) {
        prisma.$transaction([
          prisma.creditTransaction.create({
            data: {
              workspaceId,
              amount: -operationDef.credits,
              type: 'CONSUME',
              description: `API call to ${operation}`,
              balanceAfter: Math.max(
                0,
                (workspace?.creditBalance ?? operationDef.credits) - operationDef.credits
              ),
            },
          }),
          prisma.requestLog.create({
            data: {
              workspaceId,
              apiKeyId,
              endpoint: request.nextUrl.pathname,
              operation,
              method: request.method,
              statusCode: 200,
              latencyMs,
              credits: operationDef.credits,
              ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
              userAgent: request.headers.get('user-agent'),
              requestBodySanitized: JSON.stringify(rawBody).slice(0, 4000),
            },
          }),
        ]).catch((e) => logger.error('Failed to write transaction/log', { error: String(e) }));
      }

      logger.info(`API [${operation}] success`, {
        requestId,
        workspaceId,
        operation,
        statusCode: 200,
        latencyMs,
        credits: operationDef.credits,
      });

      const responsePayload = {
        success: true,
        request_id: requestId,
        data,
      };

      // Cache for idempotency if key was provided
      if (idempotencyKey && idempotencyKey.length <= 256) {
        IdempotencyService.set(workspaceId, idempotencyKey, 200, responsePayload, payloadHash);
      }

      return NextResponse.json(responsePayload, {
        status: 200,
        headers: responseHeaders,
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      let apiError: ApiError;

      if (err instanceof ApiError) {
        apiError = err;
      } else {
        logger.error(`Unhandled error in API [${operation}]`, {
          requestId,
          error: err.message || String(err),
        });
        apiError = ApiError.internal(err.message || 'An unexpected internal error occurred.');
      }

      // Refund reserved credits if operation failed
      if (creditDeducted && operationDef.credits > 0 && workspaceId) {
        prisma.workspace
          .update({
            where: { id: workspaceId },
            data: { creditBalance: { increment: operationDef.credits } },
          })
          .catch((e) => logger.error('Failed to refund credits after error', { error: String(e) }));
      }

      metrics.recordRequestEnd(operation, apiError.statusCode, latencyMs, 0);

      // Log failed request if workspace is known
      if (workspaceId) {
        prisma.requestLog
          .create({
            data: {
              workspaceId,
              apiKeyId,
              endpoint: request.nextUrl.pathname,
              operation,
              method: request.method,
              statusCode: apiError.statusCode,
              latencyMs,
              credits: 0,
              ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
              userAgent: request.headers.get('user-agent'),
              requestBodySanitized: rawBody ? JSON.stringify(rawBody).slice(0, 4000) : null,
              errorMessage: apiError.message,
            },
          })
          .catch(() => {});
      }

      logger.warn(`API [${operation}] error: ${apiError.message}`, {
        requestId,
        workspaceId,
        operation,
        statusCode: apiError.statusCode,
        code: apiError.code,
        latencyMs,
      });

      return NextResponse.json(apiError.toResponse(requestId), {
        status: apiError.statusCode,
        headers: responseHeaders,
      });
    }
  };
}

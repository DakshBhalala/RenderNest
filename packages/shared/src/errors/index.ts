import { ERROR_CODES, ErrorCode } from '../constants';
import { ApiErrorResponse } from '../types';

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: ErrorCode, message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  public toResponse(requestId: string): ApiErrorResponse {
    return {
      success: false,
      request_id: requestId,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }

  static invalidUrl(message: string = 'The provided URL is invalid or unsupported.') {
    return new ApiError(ERROR_CODES.INVALID_URL, message, 400);
  }

  static urlBlocked(message: string = 'The target address resolves to a restricted or private destination.') {
    return new ApiError(ERROR_CODES.URL_BLOCKED, message, 403);
  }

  static invalidApiKey(message: string = 'The provided API key is invalid, revoked, or missing.') {
    return new ApiError(ERROR_CODES.INVALID_API_KEY, message, 401);
  }

  static unauthorized(message: string = 'Unauthorized request.') {
    return new ApiError(ERROR_CODES.INVALID_API_KEY, message, 401);
  }

  static rateLimited(message: string = 'Rate limit exceeded for your workspace tier. Please back off.') {
    return new ApiError(ERROR_CODES.RATE_LIMITED, message, 429);
  }

  static quotaExceeded(message: string = 'Insufficient credit balance in your workspace. Please upgrade your plan.') {
    return new ApiError(ERROR_CODES.QUOTA_EXCEEDED, message, 402);
  }

  static timeout(message: string = 'The operation exceeded the maximum allowed duration.') {
    return new ApiError(ERROR_CODES.TIMEOUT, message, 504);
  }

  static renderFailed(message: string = 'Failed to render the requested page or document.', details?: any) {
    return new ApiError(ERROR_CODES.RENDER_FAILED, message, 502, details);
  }

  static extractionFailed(message: string = 'Failed to extract content from the target resource.', details?: any) {
    return new ApiError(ERROR_CODES.EXTRACTION_FAILED, message, 502, details);
  }

  static analysisFailed(message: string = 'Failed to complete page analysis.', details?: any) {
    return new ApiError(ERROR_CODES.ANALYSIS_FAILED, message, 502, details);
  }

  static invalidRequest(message: string = 'Validation failed for the request payload.', details?: any) {
    return new ApiError(ERROR_CODES.INVALID_REQUEST, message, 422, details);
  }

  static idempotencyConflict(message: string = 'Idempotency key was previously used with a different request payload.') {
    return new ApiError(ERROR_CODES.IDEMPOTENCY_CONFLICT, message, 409);
  }

  static notFound(message: string = 'The requested resource was not found.') {
    return new ApiError(ERROR_CODES.NOT_FOUND, message, 404);
  }

  static internal(message: string = 'An unexpected internal server error occurred.') {
    return new ApiError(ERROR_CODES.INTERNAL_ERROR, message, 500);
  }
}

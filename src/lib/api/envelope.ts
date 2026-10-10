export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function apiSuccess<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}

export function apiError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ApiErrorResponse {
  return { success: false, error: { code, message, details } };
}

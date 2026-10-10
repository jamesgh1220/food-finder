import { apiError } from "./envelope";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "EXTERNAL_SERVICE"
  | "REPOSITORY_ERROR";

const DOMAIN_ERROR_MAP: Record<string, { code: ApiErrorCode; status: number }> = {
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", status: 400 },
  UNAUTHORIZED: { code: "UNAUTHORIZED", status: 401 },
  FORBIDDEN: { code: "FORBIDDEN", status: 403 },
  NOT_FOUND: { code: "NOT_FOUND", status: 404 },
  CONFLICT: { code: "CONFLICT", status: 409 },
  EXTERNAL_SERVICE: { code: "EXTERNAL_SERVICE", status: 502 },
  REPOSITORY_ERROR: { code: "REPOSITORY_ERROR", status: 500 },
};

export function toErrorResponse(error: unknown): Response {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    const message = (error as { message?: unknown }).message;
    const details = (error as { details?: unknown }).details;
    const mapping =
      typeof code === "string" ? DOMAIN_ERROR_MAP[code] : undefined;
    if (mapping) {
      return Response.json(
        apiError(
          mapping.code,
          typeof message === "string" ? message : mapping.code,
          details && typeof details === "object"
            ? (details as Record<string, unknown>)
            : undefined,
        ),
        { status: mapping.status },
      );
    }
  }

  // Server-side logging only; the response never carries internal detail.
  console.error("[API_ERROR]", error);

  return Response.json(
    apiError("INTERNAL_ERROR", "Error interno del servidor."),
    { status: 500 },
  );
}

export function rateLimitedResponse(): Response {
  return Response.json(apiError("RATE_LIMITED", "Demasiadas solicitudes"), {
    status: 429,
  });
}

import { unstable_rethrow } from "next/navigation";
import { toErrorResponse } from "./errors";

/**
 * Runs a handler and maps thrown errors into the API error envelope.
 * Next.js internal control-flow errors (dynamic-render signals, redirects,
 * `notFound`) are rethrowed so the framework can handle them.
 */
export function withErrorBoundary(
  handler: () => Promise<Response>,
): Promise<Response> {
  return handler().catch((error) => {
    unstable_rethrow(error);
    return toErrorResponse(error);
  });
}

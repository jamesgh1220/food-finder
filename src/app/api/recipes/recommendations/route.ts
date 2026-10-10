import type { NextRequest } from "next/server";
import { createServerApplicationServices } from "@/lib/composition/server-application";
import { withErrorBoundary } from "@/lib/api/http";
import { rateLimitedResponse } from "@/lib/api/errors";
import { createRecommendation } from "@/lib/api/handlers/recommendations";
import {
  getDefaultRecommendationsRateLimiter,
  resolveClientKey,
} from "@/lib/api/rate-limit";

const limiter = getDefaultRecommendationsRateLimiter();

export async function POST(request: NextRequest) {
  return withErrorBoundary(async () => {
    if (!limiter.consume(resolveClientKey(request))) {
      return rateLimitedResponse();
    }
    const services = await createServerApplicationServices();
    return createRecommendation(request, services);
  });
}

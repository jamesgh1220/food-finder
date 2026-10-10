import { describe, it, expect } from "vitest";
import { createRateLimiter } from "@/lib/api/rate-limit";

describe("rate limiter", () => {
  it("allows requests under limit", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => 1000 });
    expect(limiter.consume("ip1")).toBe(true);
    expect(limiter.consume("ip1")).toBe(true);
    expect(limiter.consume("ip1")).toBe(true);
    expect(limiter.consume("ip1")).toBe(false);
  });

  it("resets after window", () => {
    const times = [1000, 1000, 1000, 2500];
    let i = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => times[i++] });
    expect(limiter.consume("ip1")).toBe(true);
    expect(limiter.consume("ip1")).toBe(true);
    expect(limiter.consume("ip1")).toBe(false);
    expect(limiter.consume("ip1")).toBe(true);
  });
});

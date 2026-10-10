import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseOrThrow } from "@/lib/api/validation";
import { ValidationError } from "@/domain/errors";

describe("validation helper", () => {
  it("throws ValidationError with issues on invalid input", () => {
    const schema = z.object({ id: z.string().uuid() });
    expect(() => parseOrThrow(schema, { id: "bad" })).toThrow(ValidationError);
    try {
      parseOrThrow(schema, { id: "bad" });
    } catch (e) {
      expect((e as ValidationError).details).toMatchObject({ issues: expect.any(Array) });
    }
  });

  it("returns parsed data on valid input", () => {
    const schema = z.object({ id: z.string().uuid() });
    const res = parseOrThrow(schema, { id: "123e4567-e89b-12d3-a456-426614174000" });
    expect(res).toEqual({ id: "123e4567-e89b-12d3-a456-426614174000" });
  });
});

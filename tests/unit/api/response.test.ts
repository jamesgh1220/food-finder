import { describe, it, expect, vi } from "vitest";
import { apiSuccess, apiError } from "@/lib/api/envelope";
import { toErrorResponse } from "@/lib/api/errors";
import { ValidationError, UnauthorizedError, NotFoundError, ConflictError, ExternalServiceError, RepositoryError } from "@/domain/errors";

describe("API envelope and error mapping", () => {
  it("success envelope", () => {
    expect(apiSuccess({ foo: "bar" })).toEqual({ success: true, data: { foo: "bar" } });
  });

  it("error envelope", () => {
    expect(apiError("VALIDATION_ERROR", "bad", { issues: [] })).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "bad", details: { issues: [] } },
    });
  });

  it("maps domain errors to correct status and codes", async () => {
    const r1 = await toErrorResponse(new ValidationError("bad", { issues: [1] }));
    expect(r1.status).toBe(400);
    expect((await r1.json()).error.code).toBe("VALIDATION_ERROR");

    const r2 = await toErrorResponse(new UnauthorizedError("unauth"));
    expect(r2.status).toBe(401);
    expect((await r2.json()).error.code).toBe("UNAUTHORIZED");

    const r3 = await toErrorResponse(new NotFoundError("not found"));
    expect(r3.status).toBe(404);

    const r4 = await toErrorResponse(new ConflictError("conflict"));
    expect(r4.status).toBe(409);

    const r5 = await toErrorResponse(new ExternalServiceError("ext"));
    expect(r5.status).toBe(502);

    const r6 = await toErrorResponse(new RepositoryError("repo"));
    expect(r6.status).toBe(500);
  });

  it("does not leak stack for unknown errors", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await toErrorResponse(new Error("secret stack trace here"));
    const body = await r.json();
    expect(r.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("Error interno del servidor.");
    expect(JSON.stringify(body)).not.toContain("secret stack trace here");
    spy.mockRestore();
  });
});

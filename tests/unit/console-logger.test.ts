import { describe, expect, it, vi } from "vitest";
import {
  createConsoleLogger,
  redactContext,
  REDACTED,
} from "@/infrastructure/logging/console-logger";

describe("createConsoleLogger", () => {
  it("exposes the four required levels", () => {
    const logger = createConsoleLogger("debug");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("writes to the matching console method", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = createConsoleLogger("debug");
    logger.info("hello", { user: 1 });
    expect(spy).toHaveBeenCalledWith('[INFO] hello {"user":1}');
    spy.mockRestore();
  });

  it("filters levels below the minimum", () => {
    const debugSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = createConsoleLogger("info");
    logger.debug("hidden");
    logger.info("shown");
    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(1);
    debugSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it("redacts secrets at the top level (REQ-09)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = createConsoleLogger("debug");
    logger.error("connection failed", {
      apiKey: "spoonacular-live-key",
      password: "hunter2",
      token: "abc",
      attempts: 3,
    });
    const output = spy.mock.calls[0][0] as string;
    expect(output).not.toContain("spoonacular-live-key");
    expect(output).not.toContain("hunter2");
    expect(output).not.toContain("abc");
    expect(output).toContain(REDACTED);
    expect(output).toContain('"attempts":3');
    spy.mockRestore();
  });
});

describe("redactContext", () => {
  it("walks nested objects and arrays", () => {
    expect(
      redactContext({
        config: { supabaseSecretKey: "s3cr3t", retries: 2 },
        items: [{ serviceToken: "t" }],
      }),
    ).toEqual({
      config: { supabaseSecretKey: REDACTED, retries: 2 },
      items: [{ serviceToken: REDACTED }],
    });
  });
});

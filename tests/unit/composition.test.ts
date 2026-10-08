import { describe, expect, it } from "vitest";
import type { Logger } from "@/application/ports/logger";
import { createApp } from "@/lib/composition/create-app";

const fakeLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe("createApp (composition root)", () => {
  it("wires an injected port instead of the concrete adapter (ISSUE test case 3)", () => {
    const services = createApp({ logger: fakeLogger });
    expect(services.logger).toBe(fakeLogger);
  });

  it("falls back to the single console adapter by default", () => {
    const services = createApp();
    expect(typeof services.logger.info).toBe("function");
    expect(services.logger).not.toBe(fakeLogger);
  });
});

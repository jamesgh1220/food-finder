import { expect, test } from "@playwright/test";

// Placeholder: verifies the Playwright harness runs without a browser.
// Real E2E specs (spec 16) will use the `page` fixture and require
// `pnpm exec playwright install chromium`.
test("playwright harness is wired", async () => {
  expect(1 + 1).toBe(2);
});

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL does not auto-cleanup outside of a global test-runner injection, so we
// unmount the rendered tree after every test to keep the jsdom document clean.
afterEach(() => {
  cleanup();
});

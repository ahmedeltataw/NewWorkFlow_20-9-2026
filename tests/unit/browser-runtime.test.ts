import { afterEach, expect, it, vi } from "vitest";
import { startBrowserMockWorker } from "../../src/mocks/browser-runtime";
import { worker } from "../../src/mocks/browser";

vi.mock("../../src/mocks/browser", () => ({
  worker: { start: vi.fn() },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  delete document.documentElement.dataset.mswReady;
});

it("starts with the public build flag, logs failure once, and marks readiness after retry", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_MOCKING", "enabled");
  const start = vi.mocked(worker.start);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  start
    .mockRejectedValueOnce(new Error("first startup failure"))
    .mockRejectedValueOnce(new Error("second startup failure"))
    .mockResolvedValueOnce(undefined);

  await expect(startBrowserMockWorker()).rejects.toThrow(
    "first startup failure",
  );
  await expect(startBrowserMockWorker()).rejects.toThrow(
    "second startup failure",
  );
  expect(document.documentElement.dataset.mswReady).toBeUndefined();
  expect(log).toHaveBeenCalledTimes(1);

  await expect(startBrowserMockWorker()).resolves.toBeUndefined();
  expect(start).toHaveBeenCalledTimes(3);
  expect(document.documentElement.dataset.mswReady).toBe("true");
});

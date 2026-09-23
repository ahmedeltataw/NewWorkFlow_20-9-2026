import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClient } from "../../src/lib/api/api-client";
import { startBrowserMockWorker } from "../../src/mocks/browser-runtime";

vi.mock("../../src/mocks/browser-runtime", () => ({
  startBrowserMockWorker: vi.fn(),
}));

describe("ApiClient worker readiness", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns a typed error without fetching when startup fails, then awaits readiness on retry", async () => {
    const start = vi.mocked(startBrowserMockWorker);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    start.mockRejectedValueOnce(new Error("worker unavailable"));

    const client = new ApiClient();
    await expect(
      client.requestOtpCode({
        countryCode: "+966",
        nationalNumber: "555123456",
      }),
    ).resolves.toEqual({
      status: "error",
      kind: "network",
      message: "Mock service worker could not start",
      retryEligible: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    start.mockRejectedValueOnce(new Error("worker still unavailable"));
    await expect(client.getHomeFeed()).resolves.toEqual({
      status: "error",
      kind: "network",
      message: "Mock service worker could not start",
      retryEligible: true,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    start.mockResolvedValueOnce();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "success", data: null })),
    );
    await expect(client.getSession()).resolves.toEqual({
      status: "success",
      data: null,
    });
    expect(start).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

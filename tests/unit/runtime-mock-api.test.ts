import { describe, expect, it } from "vitest";

import { resolvePublicMockRequest } from "../../src/mocks/runtime-public";

describe("runtime public mock API", () => {
  it("serves the home feed with the canonical success envelope", async () => {
    const response = await resolvePublicMockRequest(
      new Request("http://localhost:3000/api/home-feed"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "success",
      data: expect.any(Array),
    });
  });

  it("applies marketplace filters", async () => {
    const response = await resolvePublicMockRequest(
      new Request("http://localhost:3000/api/auctions?category=vehicle"),
    );
    const body = (await response.json()) as {
      readonly data: readonly { readonly category: string }[];
    };

    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((auction) => auction.category === "vehicle")).toBe(
      true,
    );
  });

  it("scopes search results to the requested category", async () => {
    const response = await resolvePublicMockRequest(
      new Request("http://localhost:3000/api/search?q=camry&category=vehicle"),
    );
    const body = (await response.json()) as {
      readonly status: string;
      readonly data: readonly { readonly category: string }[];
    };

    expect(body.status).toBe("success");
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((auction) => auction.category === "vehicle")).toBe(
      true,
    );
  });

  it("returns the canonical not-found envelope for an unknown auction", async () => {
    const response = await resolvePublicMockRequest(
      new Request("http://localhost:3000/api/auctions/missing"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      kind: "notFound",
      message: "auction-not-found",
      retryEligible: false,
    });
  });
});

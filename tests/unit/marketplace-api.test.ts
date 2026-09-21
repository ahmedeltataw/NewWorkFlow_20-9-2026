import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "../../src/lib/api/api-client";

describe("ApiClient.queryMarketplace", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serializes the typed marketplace query for the auctions route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ApiClient().queryMarketplace({
      sellerKind: "company",
      companyName: "شركة المزادات الدولية",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auctions?sellerKind=company&companyName=%D8%B4%D8%B1%D9%83%D8%A9+%D8%A7%D9%84%D9%85%D8%B2%D8%A7%D8%AF%D8%A7%D8%AA+%D8%A7%D9%84%D8%AF%D9%88%D9%84%D9%8A%D8%A9",
    );
  });
});

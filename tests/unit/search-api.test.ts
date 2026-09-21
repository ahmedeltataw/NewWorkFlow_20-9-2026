import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClient } from "../../src/lib/api/api-client";
import {
  categoryInferenceTerms,
  inferCategory,
} from "../../src/config/marketplace";

function getFetchUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  const call = fetchMock.mock.calls[0];
  expect(call).toBeDefined();
  return call![0] as string;
}

describe("ApiClient.getSearchSuggestions", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serializes the query parameter for the suggestions route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "success",
          data: ["toyota", "toyota camry"],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ApiClient().getSearchSuggestions("toyota");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/search/suggestions?q=toyota",
    );
  });

  it("omits the query parameter for empty input", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ApiClient().getSearchSuggestions("");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/search/suggestions",
    );
  });

  it("returns the real error status from the envelope", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "error",
          kind: "server",
          message: "mock server unavailable",
          retryEligible: true,
        }),
        { status: 500 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new ApiClient().getSearchSuggestions("test");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.kind).toBe("server");
      expect(result.retryEligible).toBe(true);
    }
  });
});

describe("ApiClient.searchAuctions", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serializes the query parameter for the search route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ApiClient().searchAuctions("فورد");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/search?q="),
    );
  });

  it("omits the query parameter for empty input", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ApiClient().searchAuctions("");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/search");
  });

  it("serializes the category parameter when provided (FR-021 scoping)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ApiClient().searchAuctions("toyota car", "vehicle");

    const url = getFetchUrl(fetchMock);
    expect(url).toContain("category=vehicle");
    expect(url).toContain("q=toyota+car");
  });

  it("omits the category parameter when not provided (unscoped results)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new ApiClient().searchAuctions("random term");

    const url = getFetchUrl(fetchMock);
    expect(url).not.toContain("category=");
  });

  it("returns the real error status from the envelope", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "error",
          kind: "server",
          message: "mock server unavailable",
          retryEligible: true,
        }),
        { status: 500 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new ApiClient().searchAuctions("test");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.kind).toBe("server");
      expect(result.retryEligible).toBe(true);
    }
  });

  it("returns gateRequired status from the envelope", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "gateRequired",
          intent: { intent: "bid", returnTo: "/search?q=test" },
        }),
        { status: 401 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await new ApiClient().searchAuctions("test");

    expect(result.status).toBe("gateRequired");
  });
});

describe("category scoping (FR-021) end-to-end", () => {
  it("inferred category is forwarded to searchAuctions as a query param", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const term = "سيارة تويوتا";
    const inferred = inferCategory(term);
    expect(inferred).toBe("vehicle");

    await new ApiClient().searchAuctions(term, inferred);

    const url = getFetchUrl(fetchMock);
    expect(url).toContain("category=vehicle");
  });

  it("no inferred category produces no category param (unscoped)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success", data: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const term = ".random term xyz";
    const inferred = inferCategory(term);
    expect(inferred).toBeUndefined();

    await new ApiClient().searchAuctions(term, inferred);

    const url = getFetchUrl(fetchMock);
    expect(url).not.toContain("category=");
  });
});

describe("category inference (FR-021)", () => {
  it("infers vehicle category from Arabic car terms", () => {
    expect(inferCategory("سيارة تويوتا")).toBe("vehicle");
  });

  it("infers vehicle category from English car terms", () => {
    expect(inferCategory("toyota car")).toBe("vehicle");
  });

  it("infers realEstate category from Arabic property terms", () => {
    expect(inferCategory("فيلا للبيع")).toBe("realEstate");
  });

  it("infers realEstate category from English property terms", () => {
    expect(inferCategory("luxury villa")).toBe("realEstate");
  });

  it("infers licensePlate category from Arabic plate terms", () => {
    expect(inferCategory("لوحة مميزة")).toBe("licensePlate");
  });

  it("infers licensePlate category from English plate terms", () => {
    expect(inferCategory("vanity plate")).toBe("licensePlate");
  });

  it("returns undefined for unmatched terms (unscoped results)", () => {
    expect(inferCategory(".random term xyz")).toBeUndefined();
  });

  it("returns undefined for empty input", () => {
    expect(inferCategory("")).toBeUndefined();
  });

  it("is case-insensitive for English terms", () => {
    expect(inferCategory("TOYOTA")).toBe("vehicle");
    expect(inferCategory("VILLA")).toBe("realEstate");
  });

  it("covers all three auction categories in the mapping", () => {
    expect(Object.keys(categoryInferenceTerms).sort()).toEqual([
      "licensePlate",
      "realEstate",
      "vehicle",
    ]);
  });

  it("has at least one keyword per category", () => {
    for (const keywords of Object.values(categoryInferenceTerms)) {
      expect(keywords.length).toBeGreaterThan(0);
    }
  });
});

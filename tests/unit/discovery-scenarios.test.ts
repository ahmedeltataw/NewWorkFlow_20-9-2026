/**
 * T027 Focused tests proving guest discovery scenarios are individually
 * selectable and return the correct response shapes.
 *
 * Each scenario is activated via server.use() through the shared test helper,
 * which adds scenario-specific handlers that override the base handlers
 * for matching paths.
 *
 * IMPORTANT: MSW in this vitest+jsdom setup intercepts requests to
 * http://localhost:3000 (matching the jsdom URL), NOT http://localhost (port 80).
 * All fetch calls MUST use the :3000 port.
 */

import { describe, expect, it } from "vitest";
import { addMswHandlers } from "../msw";
import { discoveryScenarioHandlers } from "../../src/mocks/handlers/discovery";

const BASE = "http://localhost:3000";

function activate(
  ...scenarioNames: Array<Parameters<typeof discoveryScenarioHandlers>[0]>
) {
  for (const name of scenarioNames) {
    addMswHandlers(...discoveryScenarioHandlers(name));
  }
}

describe("T027 guest discovery scenarios", () => {
  describe("home-active-only", () => {
    it("no ended auction ids in payload", async () => {
      activate("guest-discovery/home-active-only");

      const res = await fetch(`${BASE}/api/home-feed`);
      const body = (await res.json()) as {
        status: string;
        data: readonly { id: string; status: string }[];
      };

      expect(body.status).toBe("success");
      expect(body.data.length).toBeGreaterThan(0);
      for (const auction of body.data) {
        expect(auction.status).not.toBe("ended");
      }
    });
  });

  describe("marketplace-empty", () => {
    it("returns an empty collection", async () => {
      activate("guest-discovery/marketplace-empty");

      const res = await fetch(`${BASE}/api/auctions`);
      const body = (await res.json()) as {
        status: string;
        data: readonly unknown[];
      };

      expect(body.status).toBe("success");
      expect(body.data).toEqual([]);
    });
  });

  describe("error-retryable", () => {
    it("retryEligible is true on home-feed", async () => {
      activate("guest-discovery/error-retryable");

      const res = await fetch(`${BASE}/api/home-feed`);
      const body = (await res.json()) as {
        status: string;
        retryEligible: boolean;
      };

      expect(res.status).toBe(500);
      expect(body.status).toBe("error");
      expect(body.retryEligible).toBe(true);
    });

    it("retryEligible is true on auctions", async () => {
      activate("guest-discovery/error-retryable");

      const res = await fetch(`${BASE}/api/auctions`);
      const body = (await res.json()) as {
        status: string;
        retryEligible: boolean;
      };

      expect(res.status).toBe(500);
      expect(body.status).toBe("error");
      expect(body.retryEligible).toBe(true);
    });
  });

  describe("error-not-retryable", () => {
    it("retryEligible is false on home-feed", async () => {
      activate("guest-discovery/error-not-retryable");

      const res = await fetch(`${BASE}/api/home-feed`);
      const body = (await res.json()) as {
        status: string;
        retryEligible: boolean;
      };

      expect(res.status).toBe(500);
      expect(body.status).toBe("error");
      expect(body.retryEligible).toBe(false);
    });
  });

  describe("search-no-results", () => {
    it("returns empty collection for any query", async () => {
      activate("guest-discovery/search-no-results");

      const res = await fetch(`${BASE}/api/search?q=xyznonexistent`);
      const body = (await res.json()) as {
        status: string;
        data: readonly unknown[];
      };

      expect(body.status).toBe("success");
      expect(body.data).toEqual([]);
    });
  });

  describe("company-sellers", () => {
    it("every result has a company seller", async () => {
      activate("guest-discovery/company-sellers");

      const res = await fetch(`${BASE}/api/auctions?sellerKind=company`);
      const body = (await res.json()) as {
        status: string;
        data: readonly { seller: { kind: string } }[];
      };

      expect(body.status).toBe("success");
      expect(body.data.length).toBeGreaterThan(0);
      for (const auction of body.data) {
        expect(auction.seller.kind).toBe("company");
      }
    });
  });

  describe("active-ended-filter", () => {
    it("status=live returns only live auctions", async () => {
      activate("guest-discovery/active-ended-filter");

      const res = await fetch(`${BASE}/api/auctions?status=live`);
      const body = (await res.json()) as {
        status: string;
        data: readonly { status: string }[];
      };

      expect(body.status).toBe("success");
      expect(body.data.length).toBeGreaterThan(0);
      for (const auction of body.data) {
        expect(auction.status).toBe("live");
      }
    });

    it("status=ended returns only ended auctions", async () => {
      activate("guest-discovery/active-ended-filter");

      const res = await fetch(`${BASE}/api/auctions?status=ended`);
      const body = (await res.json()) as {
        status: string;
        data: readonly { status: string }[];
      };

      expect(body.status).toBe("success");
      expect(body.data.length).toBeGreaterThan(0);
      for (const auction of body.data) {
        expect(auction.status).toBe("ended");
      }
    });
  });

  describe("category-vehicle", () => {
    it("filters by category=vehicle", async () => {
      activate("guest-discovery/category-vehicle");

      const res = await fetch(`${BASE}/api/auctions?category=vehicle`);
      const body = (await res.json()) as {
        status: string;
        data: readonly { category: string }[];
      };

      expect(body.status).toBe("success");
      for (const auction of body.data) {
        expect(auction.category).toBe("vehicle");
      }
    });
  });

  describe("categories", () => {
    it("returns all three auction categories", async () => {
      activate("guest-discovery/categories");

      const res = await fetch(`${BASE}/api/categories`);
      const body = (await res.json()) as {
        status: string;
        data: readonly string[];
      };

      expect(body.status).toBe("success");
      expect(body.data).toEqual(["vehicle", "realEstate", "licensePlate"]);
    });
  });

  describe("search-suggestions", () => {
    it("returns popular terms for empty input", async () => {
      activate("guest-discovery/search-suggestions");

      const res = await fetch(`${BASE}/api/search/suggestions?q=`);
      const body = (await res.json()) as {
        status: string;
        data: readonly string[];
      };

      expect(body.status).toBe("success");
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  describe("home-empty", () => {
    it("returns empty home feed", async () => {
      activate("guest-discovery/home-empty");

      const res = await fetch(`${BASE}/api/home-feed`);
      const body = (await res.json()) as {
        status: string;
        data: readonly unknown[];
      };

      expect(body.status).toBe("success");
      expect(body.data).toEqual([]);
    });
  });

  describe("auction-detail", () => {
    it("returns a known auction", async () => {
      activate("guest-discovery/auction-detail");

      const res = await fetch(`${BASE}/api/auctions/fx-guest-live-vehicle`);
      const body = (await res.json()) as {
        status: string;
        data: { id: string; status: string };
      };

      expect(body.status).toBe("success");
      expect(body.data.id).toBe("fx-guest-live-vehicle");
      expect(body.data.status).toBe("live");
    });

    it("returns 404 for unknown auction", async () => {
      activate("guest-discovery/auction-detail");

      const res = await fetch(`${BASE}/api/auctions/no-such-auction`);
      const body = (await res.json()) as {
        status: string;
        kind: string;
        retryEligible: boolean;
      };

      expect(res.status).toBe(404);
      expect(body.status).toBe("error");
      expect(body.kind).toBe("notFound");
      expect(body.retryEligible).toBe(false);
    });
  });
});

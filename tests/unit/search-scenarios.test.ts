/**
 * T033 Tests for search MSW scenarios: search results, no results, and
 * suggestions. Activates individual scenarios via server.use().
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

describe("T033 search scenarios", () => {
  describe("search-results", () => {
    it("returns auctions matching the query", async () => {
      activate("guest-discovery/search-results");

      const res = await fetch(
        `${BASE}/api/search?q=${encodeURIComponent("تويوتا")}`,
      );
      const body = (await res.json()) as {
        status: string;
        data: readonly { id: string; title: string }[];
      };

      expect(body.status).toBe("success");
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("returns empty array for non-matching query", async () => {
      activate("guest-discovery/search-results");

      const res = await fetch(`${BASE}/api/search?q=zzznonexistent`);
      const body = (await res.json()) as {
        status: string;
        data: readonly unknown[];
      };

      expect(body.status).toBe("success");
      expect(body.data).toEqual([]);
    });
  });

  describe("search-no-results", () => {
    it("returns empty array for any query", async () => {
      activate("guest-discovery/search-no-results");

      const res = await fetch(`${BASE}/api/search?q=anything`);
      const body = (await res.json()) as {
        status: string;
        data: readonly unknown[];
      };

      expect(body.status).toBe("success");
      expect(body.data).toEqual([]);
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

    it("returns filtered suggestions for partial input", async () => {
      activate("guest-discovery/search-suggestions");

      const res = await fetch(`${BASE}/api/search/suggestions?q=toy`);
      const body = (await res.json()) as {
        status: string;
        data: readonly string[];
      };

      expect(body.status).toBe("success");
      for (const suggestion of body.data) {
        expect(suggestion.toLowerCase()).toContain("toy");
      }
    });

    it("returns empty array for non-matching input", async () => {
      activate("guest-discovery/search-suggestions");

      const res = await fetch(
        `${BASE}/api/search/suggestions?q=zzznonexistent`,
      );
      const body = (await res.json()) as {
        status: string;
        data: readonly string[];
      };

      expect(body.status).toBe("success");
      expect(body.data).toEqual([]);
    });
  });
});

/**
 * T027 Guest discovery MSW scenarios for active/ended filtering, categories,
 * search, company sellers, and empty/error responses.
 *
 * Every response is built exclusively from T020 factories/presets. No
 * randomness, no `Date.now()` / `new Date()` wall-clock reads.
 *
 * Scenarios are NOT spread into the default handler array. Each is mutually
 * exclusive (MSW first-match-wins means duplicate paths would shadow each
 * other). Tests activate a single scenario via `server.use()`:
 *
 *   import { discoveryScenarioHandlers } from ".../handlers/discovery";
 *   server.use(...discoveryScenarioHandlers("guest-discovery/home-active-only"));
 *
 * This module imports neither `msw/node` nor `msw/browser`.
 */

import {
  createCompanySeller,
  createDirectSaleAuction,
  createEndedAuction,
  createLiveAuction,
  createUpcomingAuction,
  fixtureValueLists,
  moneyFromMajor,
} from "../factories";
import type { Auction, AuctionCategory } from "../../lib/api/types";
import { apiRoutes, success } from "./shared";
import { http, HttpResponse } from "msw";
import type { HttpHandler } from "msw";

/* -------------------------------------------------------------------------- */
/* Guest discovery scenario fixture catalogue                                  */
/* -------------------------------------------------------------------------- */

/** Only active (non-ended) auctions — the home-feed rule (FR-019). */
const activeAuctions: readonly Auction[] = [
  createLiveAuction({
    id: "fx-guest-live-vehicle",
    category: "vehicle",
    saleType: "bySale",
    seller: createCompanySeller(),
    currentPrice: moneyFromMajor(62000),
  }),
  createLiveAuction({
    id: "fx-guest-live-real-estate",
    category: "realEstate",
    saleType: "bySale",
  }),
  createLiveAuction({
    id: "fx-guest-live-license-plate",
    category: "licensePlate",
    saleType: "sellerOption",
  }),
  createUpcomingAuction({
    id: "fx-guest-upcoming-vehicle",
    category: "vehicle",
    saleType: "bySale",
  }),
  createUpcomingAuction({
    id: "fx-guest-upcoming-real-estate",
    category: "realEstate",
    saleType: "sellerOption",
  }),
  createDirectSaleAuction({
    id: "fx-guest-direct-vehicle",
    category: "vehicle",
    seller: createCompanySeller(),
  }),
];

/** End-to-end catalogue including ended auctions for marketplace filtering. */
const fullCatalog: readonly Auction[] = [
  ...activeAuctions,
  createEndedAuction({
    id: "fx-guest-ended-vehicle",
    category: "vehicle",
    saleType: "bySale",
  }),
  createEndedAuction({
    id: "fx-guest-ended-real-estate",
    category: "realEstate",
    saleType: "bySale",
  }),
];

/** Company-seller auctions for the company-filter scenarios. */
const companySellerAuctions: readonly Auction[] = [
  createLiveAuction({
    id: "fx-guest-company-live-vehicle",
    category: "vehicle",
    saleType: "bySale",
    seller: createCompanySeller({
      name: "شركة المزادات الدولية",
    }),
  }),
  createUpcomingAuction({
    id: "fx-guest-company-upcoming-real-estate",
    category: "realEstate",
    saleType: "sellerOption",
    seller: createCompanySeller({
      name: "مُلك وإعمار للتطوير العقاري",
    }),
  }),
  createDirectSaleAuction({
    id: "fx-guest-company-direct-license-plate",
    category: "licensePlate",
    seller: createCompanySeller({
      name: "شركة المزادات الدولية",
    }),
  }),
];

const catalogWithCompany: readonly Auction[] = [
  ...fullCatalog,
  ...companySellerAuctions,
];

/* -------------------------------------------------------------------------- */
/* Scenario definitions                                                        */
/* -------------------------------------------------------------------------- */

export interface DiscoveryScenario {
  readonly name: string;
  readonly description: string;
  readonly handlers: readonly HttpHandler[];
}

/**
 * Home feed with active auctions only — ended auctions never appear (FR-019).
 */
const guestDiscoveryHomeActiveOnly: DiscoveryScenario = {
  name: "guest-discovery/home-active-only",
  description:
    "Home feed excludes ended auctions; only live, upcoming, and direct-sale appear",
  handlers: [
    http.get(apiRoutes.homeFeed, () => {
      return success<readonly Auction[]>(activeAuctions);
    }),
  ],
};

/**
 * Marketplace query with status filter proving ended auctions are excludable.
 */
const guestDiscoveryActiveEndedFilter: DiscoveryScenario = {
  name: "guest-discovery/active-ended-filter",
  description:
    "Marketplace query with status=live returns only live auctions; status=ended returns only ended; no status returns all",
  handlers: [
    http.get(apiRoutes.auctions, ({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      const category = url.searchParams.get("category");
      const sellerKind = url.searchParams.get("sellerKind");
      const companyName = url.searchParams.get("companyName");
      const query = url.searchParams.get("query");

      let results = [...catalogWithCompany];

      if (status) {
        results = results.filter((a) => a.status === status);
      }
      if (category) {
        results = results.filter(
          (a) => a.category === (category as AuctionCategory),
        );
      }
      if (sellerKind) {
        results = results.filter((a) => a.seller.kind === sellerKind);
      }
      if (companyName) {
        results = results.filter(
          (a) =>
            a.seller.kind === "company" && a.seller.name.includes(companyName),
        );
      }
      if (query) {
        const needle = query.toLowerCase();
        results = results.filter((a) => a.title.toLowerCase().includes(needle));
      }

      return success<readonly Auction[]>(results);
    }),
  ],
};

/**
 * Category filtering across every AuctionCategory in the type union.
 */
const guestDiscoveryCategoryVehicle: DiscoveryScenario = {
  name: "guest-discovery/category-vehicle",
  description: "Category filter for vehicle auctions",
  handlers: [
    http.get(apiRoutes.auctions, ({ request }) => {
      const url = new URL(request.url);
      const category = url.searchParams.get("category");
      const results = fullCatalog.filter(
        (a) => !category || a.category === category,
      );
      return success<readonly Auction[]>(results);
    }),
  ],
};

const guestDiscoveryCategoryRealEstate: DiscoveryScenario = {
  name: "guest-discovery/category-realEstate",
  description: "Category filter for realEstate auctions",
  handlers: [
    http.get(apiRoutes.auctions, ({ request }) => {
      const url = new URL(request.url);
      const category = url.searchParams.get("category");
      const results = fullCatalog.filter(
        (a) => !category || a.category === category,
      );
      return success<readonly Auction[]>(results);
    }),
  ],
};

const guestDiscoveryCategoryLicensePlate: DiscoveryScenario = {
  name: "guest-discovery/category-licensePlate",
  description: "Category filter for licensePlate auctions",
  handlers: [
    http.get(apiRoutes.auctions, ({ request }) => {
      const url = new URL(request.url);
      const category = url.searchParams.get("category");
      const results = fullCatalog.filter(
        (a) => !category || a.category === category,
      );
      return success<readonly Auction[]>(results);
    }),
  ],
};

/**
 * Categories endpoint returning the full AuctionCategory union.
 */
const guestDiscoveryCategories: DiscoveryScenario = {
  name: "guest-discovery/categories",
  description: "Returns all auction categories from the type union",
  handlers: [
    http.get(apiRoutes.categories, () => {
      return success<readonly AuctionCategory[]>(
        fixtureValueLists.auctionCategories,
      );
    }),
  ],
};

/**
 * Search yielding results matching the query term.
 */
const guestDiscoverySearchResults: DiscoveryScenario = {
  name: "guest-discovery/search-results",
  description: "Search returns auctions whose title matches the query",
  handlers: [
    http.get(apiRoutes.search, ({ request }) => {
      const url = new URL(request.url);
      const input = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
      if (!input) return success<readonly Auction[]>([]);
      const results = fullCatalog.filter((a) =>
        a.title.toLowerCase().includes(input),
      );
      return success<readonly Auction[]>(results);
    }),
  ],
};

/**
 * Search query that yields zero results.
 */
const guestDiscoverySearchNoResults: DiscoveryScenario = {
  name: "guest-discovery/search-no-results",
  description: "Search for a term that matches no auctions returns empty array",
  handlers: [
    http.get(apiRoutes.search, () => {
      return success<readonly Auction[]>([]);
    }),
  ],
};

/**
 * Search suggestions returned for a popular term.
 */
const guestDiscoverySearchSuggestions: DiscoveryScenario = {
  name: "guest-discovery/search-suggestions",
  description: "Search suggestions endpoint returns matching popular terms",
  handlers: [
    http.get(apiRoutes.searchSuggestions, ({ request }) => {
      const url = new URL(request.url);
      const input = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
      const popularTerms = [
        "تويوتا",
        "Toyota",
        "لاند كروزر",
        "Land Cruiser",
        "فيلا",
        "Villa",
      ];
      if (!input) return success<readonly string[]>(popularTerms);
      return success<readonly string[]>(
        popularTerms.filter((t) => t.toLowerCase().includes(input)),
      );
    }),
  ],
};

/**
 * Company-seller results: sellerKind=company filter and companyName filtering.
 */
const guestDiscoveryCompanySellers: DiscoveryScenario = {
  name: "guest-discovery/company-sellers",
  description:
    "Marketplace filtered by sellerKind=company returns only company-seller auctions; companyName further narrows results",
  handlers: [
    http.get(apiRoutes.auctions, ({ request }) => {
      const url = new URL(request.url);
      const sellerKind = url.searchParams.get("sellerKind");
      const companyName = url.searchParams.get("companyName");
      let results = [...catalogWithCompany];

      if (sellerKind) {
        results = results.filter((a) => a.seller.kind === sellerKind);
      }
      if (companyName) {
        results = results.filter(
          (a) =>
            a.seller.kind === "company" && a.seller.name.includes(companyName),
        );
      }

      return success<readonly Auction[]>(results);
    }),
  ],
};

/**
 * Company-seller previous auctions path for a specific seller.
 */
const guestDiscoveryCompanyPreviousAuctions: DiscoveryScenario = {
  name: "guest-discovery/company-previous-auctions",
  description:
    "Company seller's previous auctions linked via seller.previousAuctionsPath",
  handlers: [
    http.get(apiRoutes.auctions, ({ request }) => {
      const url = new URL(request.url);
      const sellerKind = url.searchParams.get("sellerKind");
      let results = [...companySellerAuctions];
      if (sellerKind) {
        results = results.filter((a) => a.seller.kind === sellerKind);
      }
      return success<readonly Auction[]>(results);
    }),
  ],
};

/**
 * Home feed returns an empty array (empty scenario).
 */
const guestDiscoveryHomeEmpty: DiscoveryScenario = {
  name: "guest-discovery/home-empty",
  description: "Home feed returns empty auction list",
  handlers: [
    http.get(apiRoutes.homeFeed, () => {
      return success<readonly Auction[]>([]);
    }),
  ],
};

/**
 * Marketplace returns an empty array (empty scenario).
 */
const guestDiscoveryMarketplaceEmpty: DiscoveryScenario = {
  name: "guest-discovery/marketplace-empty",
  description: "Marketplace query returns empty auction list",
  handlers: [
    http.get(apiRoutes.auctions, () => {
      return success<readonly Auction[]>([]);
    }),
  ],
};

/**
 * Server error with retryEligible = true.
 */
const guestDiscoveryErrorRetryable: DiscoveryScenario = {
  name: "guest-discovery/error-retryable",
  description: "Server error with retryEligible=true",
  handlers: [
    http.get(apiRoutes.homeFeed, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "server",
          message: "mock server unavailable",
          retryEligible: true,
        },
        { status: 500 },
      );
    }),
    http.get(apiRoutes.auctions, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "server",
          message: "mock server unavailable",
          retryEligible: true,
        },
        { status: 500 },
      );
    }),
    http.get(apiRoutes.search, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "server",
          message: "mock server unavailable",
          retryEligible: true,
        },
        { status: 500 },
      );
    }),
    http.get(apiRoutes.searchSuggestions, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "server",
          message: "mock server unavailable",
          retryEligible: true,
        },
        { status: 500 },
      );
    }),
    http.get(apiRoutes.categories, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "server",
          message: "mock server unavailable",
          retryEligible: true,
        },
        { status: 500 },
      );
    }),
  ],
};

/**
 * Server error with retryEligible = false (unrecoverable).
 */
const guestDiscoveryErrorNotRetryable: DiscoveryScenario = {
  name: "guest-discovery/error-not-retryable",
  description: "Server error with retryEligible=false (unrecoverable)",
  handlers: [
    http.get(apiRoutes.homeFeed, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "unrecoverable",
          message: "service permanently unavailable",
          retryEligible: false,
        },
        { status: 500 },
      );
    }),
    http.get(apiRoutes.auctions, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "unrecoverable",
          message: "service permanently unavailable",
          retryEligible: false,
        },
        { status: 500 },
      );
    }),
    http.get(apiRoutes.search, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "unrecoverable",
          message: "service permanently unavailable",
          retryEligible: false,
        },
        { status: 500 },
      );
    }),
    http.get(apiRoutes.searchSuggestions, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "unrecoverable",
          message: "service permanently unavailable",
          retryEligible: false,
        },
        { status: 500 },
      );
    }),
    http.get(apiRoutes.categories, () => {
      return HttpResponse.json(
        {
          status: "error",
          kind: "unrecoverable",
          message: "service permanently unavailable",
          retryEligible: false,
        },
        { status: 500 },
      );
    }),
  ],
};

/**
 * Auction detail for a single guest-accessible auction.
 */
const guestDiscoveryAuctionDetail: DiscoveryScenario = {
  name: "guest-discovery/auction-detail",
  description: "Auction detail for a guest-accessible live auction",
  handlers: [
    http.get(apiRoutes.auctionById, ({ params }) => {
      const id =
        typeof params.auctionId === "string"
          ? params.auctionId
          : Array.isArray(params.auctionId)
            ? params.auctionId[0]
            : "";
      const auction = fullCatalog.find((a) => a.id === id);
      if (!auction) {
        return HttpResponse.json(
          {
            status: "error",
            kind: "notFound",
            message: "auction-not-found",
            retryEligible: false,
          },
          { status: 404 },
        );
      }
      return success<Auction>(auction);
    }),
  ],
};

/* -------------------------------------------------------------------------- */
/* Public scenario catalogue                                                    */
/* -------------------------------------------------------------------------- */

const allScenarios = [
  guestDiscoveryHomeActiveOnly,
  guestDiscoveryActiveEndedFilter,
  guestDiscoveryCategoryVehicle,
  guestDiscoveryCategoryRealEstate,
  guestDiscoveryCategoryLicensePlate,
  guestDiscoveryCategories,
  guestDiscoverySearchResults,
  guestDiscoverySearchNoResults,
  guestDiscoverySearchSuggestions,
  guestDiscoveryCompanySellers,
  guestDiscoveryCompanyPreviousAuctions,
  guestDiscoveryHomeEmpty,
  guestDiscoveryMarketplaceEmpty,
  guestDiscoveryErrorRetryable,
  guestDiscoveryErrorNotRetryable,
  guestDiscoveryAuctionDetail,
] as const;

/** Type-safe union of all valid discovery scenario names. */
export type DiscoveryScenarioName = (typeof allScenarios)[number]["name"];

/** Lookup by name; returns the matching scenario's handlers. */
export function discoveryScenarioHandlers(
  name: DiscoveryScenarioName,
): readonly HttpHandler[] {
  const scenario = allScenarios.find((s) => s.name === name);
  if (!scenario) {
    throw new Error(`Unknown discovery scenario: ${name}`);
  }
  return scenario.handlers;
}

/** Full catalogue for enumeration / documentation. */
export const guestDiscoveryScenarios: readonly DiscoveryScenario[] =
  allScenarios as readonly DiscoveryScenario[];

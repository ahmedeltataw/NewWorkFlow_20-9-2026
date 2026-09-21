/**
 * Public mock-data resolver shared by MSW and Next route handlers.
 *
 * It deliberately contains no MSW imports so it can serve server components
 * in a Next runtime while retaining the same committed fixture catalogue.
 */

import {
  createAuctionCoverageMatrix,
  createBidderIdentity,
  createBidHistory,
  createCompanySeller,
  createDirectSaleAuction,
  createEndedAuction,
  createIndividualSeller,
  createLiveAuction,
  createUpcomingAuction,
  fixtureValueLists,
  moneyFromMajor,
} from "./factories";
import type { MarketplaceQuery } from "../lib/api/client";
import type {
  Auction,
  AuctionCategory,
  AuctionStatus,
  Seller,
} from "../lib/api/types";
import { apiRoutes, notFound, serverError, success } from "./handlers/shared";

export type PublicMockScenario = "default" | "empty" | "error";

const featuredAuctions: readonly Auction[] = [
  createLiveAuction({
    id: "fx-live-vehicle-company",
    category: "vehicle",
    saleType: "bySale",
    seller: createCompanySeller(),
    currentPrice: moneyFromMajor(61500),
    highestBidder: createBidderIdentity({
      maskedName: "مزايد 3",
      isCurrentUser: true,
    }),
    bidHistory: createBidHistory({
      auctionId: "fx-live-vehicle-company",
      count: 3,
    }),
  }),
  createLiveAuction({
    id: "fx-live-vehicle-individual",
    category: "vehicle",
    saleType: "bySale",
    seller: createIndividualSeller(),
  }),
  createLiveAuction({
    id: "fx-live-real-estate",
    category: "realEstate",
    saleType: "bySale",
  }),
  createLiveAuction({
    id: "fx-live-license-plate",
    category: "licensePlate",
    saleType: "sellerOption",
  }),
  createUpcomingAuction({
    id: "fx-upcoming-vehicle",
    category: "vehicle",
    saleType: "bySale",
  }),
  createUpcomingAuction({
    id: "fx-upcoming-real-estate",
    category: "realEstate",
    saleType: "sellerOption",
    seller: createCompanySeller(),
  }),
  createDirectSaleAuction({
    id: "fx-direct-vehicle",
    category: "vehicle",
    seller: createCompanySeller(),
  }),
  createDirectSaleAuction({
    id: "fx-direct-license-plate",
    category: "licensePlate",
    transferStatus: "pendingConfirmation",
  }),
  createEndedAuction({
    id: "fx-ended-vehicle",
    category: "vehicle",
    saleType: "bySale",
  }),
  createEndedAuction({
    id: "fx-ended-real-estate-below-reserve",
    category: "realEstate",
    saleType: "bySale",
  }),
];

export const auctionCatalog: readonly Auction[] = [
  ...featuredAuctions,
  ...createAuctionCoverageMatrix(),
];

export function findAuctionById(auctionId: string): Auction | undefined {
  return auctionCatalog.find((auction) => auction.id === auctionId);
}

export function homeFeedAuctions(): readonly Auction[] {
  return auctionCatalog.filter((auction) => auction.status !== "ended");
}

function isAuctionCategory(value: string): value is AuctionCategory {
  return (
    value === "vehicle" || value === "realEstate" || value === "licensePlate"
  );
}

function isAuctionStatus(value: string): value is AuctionStatus {
  return (
    value === "upcoming" ||
    value === "live" ||
    value === "ended" ||
    value === "directSale"
  );
}

function isSellerKind(value: string): value is Seller["kind"] {
  return value === "individual" || value === "company";
}

function readMarketplaceQuery(url: URL): MarketplaceQuery {
  const raw = (name: string) => url.searchParams.get(name);
  const category = raw("category");
  const status = raw("status");
  const sellerKind = raw("sellerKind");
  const saleType = raw("saleType");
  return {
    ...(raw("query") ? { query: raw("query")! } : {}),
    ...(category && isAuctionCategory(category) ? { category } : {}),
    ...(saleType === "bySale" || saleType === "sellerOption"
      ? { saleType }
      : {}),
    ...(status && isAuctionStatus(status) ? { status } : {}),
    ...(sellerKind && isSellerKind(sellerKind) ? { sellerKind } : {}),
    ...(raw("companyName") ? { companyName: raw("companyName")! } : {}),
  };
}

export function marketplaceAuctions(
  query: MarketplaceQuery,
): readonly Auction[] {
  const needle = query.query?.toLowerCase();
  return auctionCatalog.filter((auction) => {
    if (needle && !auction.title.toLowerCase().includes(needle)) return false;
    if (query.category && auction.category !== query.category) return false;
    if (
      query.saleType &&
      (!("saleType" in auction) || auction.saleType !== query.saleType)
    )
      return false;
    if (query.status && auction.status !== query.status) return false;
    if (query.sellerKind && auction.seller.kind !== query.sellerKind)
      return false;
    if (
      query.companyName &&
      (auction.seller.kind !== "company" ||
        !auction.seller.name.includes(query.companyName))
    )
      return false;
    return true;
  });
}

const popularSearchTerms = [
  "تويوتا",
  "Toyota",
  "لاند كروزر",
  "Land Cruiser",
  "فيلا",
  "Villa",
  "لوحة مميزة",
  "Special plate",
] as const;

function searchAuctions(url: URL): readonly Auction[] {
  const needle = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const category = url.searchParams.get("category");
  const scoped = category
    ? auctionCatalog.filter((auction) => auction.category === category)
    : auctionCatalog;
  const matches = scoped.filter((auction) =>
    auction.title.toLowerCase().includes(needle),
  );

  // The server page sends the inferred category for category-name searches.
  // Fixtures are intentionally Arabic-first, so retain that useful scoped
  // discovery result when an English inference term has no title literal.
  return matches.length || !category ? matches : scoped;
}

/** Resolves every public discovery endpoint with the canonical envelopes. */
export function resolvePublicMockRequest(
  request: Request,
  scenario: PublicMockScenario = "default",
): Response {
  const url = new URL(request.url);
  if (scenario === "error") return serverError();

  if (url.pathname === apiRoutes.homeFeed) {
    return success<readonly Auction[]>(
      scenario === "empty" ? [] : homeFeedAuctions(),
    );
  }
  if (url.pathname === apiRoutes.categories) {
    return success<readonly AuctionCategory[]>(
      scenario === "empty" ? [] : fixtureValueLists.auctionCategories,
    );
  }
  if (url.pathname === apiRoutes.auctions) {
    return success<readonly Auction[]>(
      scenario === "empty"
        ? []
        : marketplaceAuctions(readMarketplaceQuery(url)),
    );
  }
  if (url.pathname === apiRoutes.searchSuggestions) {
    const input = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
    return success<readonly string[]>(
      scenario === "empty"
        ? []
        : input
          ? popularSearchTerms.filter((term) =>
              term.toLowerCase().includes(input),
            )
          : popularSearchTerms,
    );
  }
  if (url.pathname === apiRoutes.search) {
    return success<readonly Auction[]>(
      scenario === "empty" ? [] : searchAuctions(url),
    );
  }
  const detailMatch = /^\/api\/auctions\/([^/]+)$/.exec(url.pathname);
  if (detailMatch) {
    const auction = findAuctionById(decodeURIComponent(detailMatch[1]!));
    return auction ? success<Auction>(auction) : notFound("auction-not-found");
  }
  return notFound("mock-api-route-not-found");
}

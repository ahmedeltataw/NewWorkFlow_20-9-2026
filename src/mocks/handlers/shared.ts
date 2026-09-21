/**
 * T021/T027 Shared MSW constants and envelope helpers.
 *
 * Extracted to break the circular import between handlers.ts and
 * discovery.ts. Both modules import `apiRoutes` and `success` from here
 * without importing each other.
 *
 * This module imports neither `msw/node` nor `msw/browser`.
 */

import type {
  ErrorResult,
  GateRequiredResult,
  SuccessResult,
  ValidationFailureResult,
} from "../../lib/api/result";
import type { GatedIntent } from "../../lib/api/result";
import { HttpResponse } from "msw";

/** Canonical REST paths a data-client implementation must match. */
export const apiRoutes = {
  homeFeed: "/api/home-feed",
  categories: "/api/categories",
  auctions: "/api/auctions",
  auctionById: "/api/auctions/:auctionId",
  searchSuggestions: "/api/search/suggestions",
  search: "/api/search",
  session: "/api/session",
  authOtp: "/api/auth/otp",
  registerIndividual: "/api/auth/register/individual",
  registerCompany: "/api/auth/register/company",
  verificationReturn: "/api/auth/verification/return",
  outcomeByAuction: "/api/auctions/:auctionId/outcome",
  relistOffer: "/api/auctions/:auctionId/relist-offer",
  settlementByOutcome: "/api/outcomes/:outcomeId/settlement",
  sellerOption: "/api/auctions/:auctionId/seller-option",
  depositByAuction: "/api/auctions/:auctionId/deposit",
  bids: "/api/auctions/:auctionId/bids",
  autoBid: "/api/auctions/:auctionId/auto-bid",
  withdraw: "/api/auctions/:auctionId/withdraw",
  buyNow: "/api/auctions/:auctionId/buy-now",
  wallet: "/api/wallet",
  transactionById: "/api/wallet/transactions/:transactionId",
  withdrawals: "/api/wallet/withdrawals",
  favorites: "/api/favorites",
  favoriteByAuction: "/api/auctions/:auctionId/favorite",
  myAuctions: "/api/my-auctions",
  profile: "/api/profile",
} as const;

/* -------------------------------------------------------------------------- */
/* Response envelope helpers (matches src/lib/api/result.ts)                    */
/* -------------------------------------------------------------------------- */

export function success<D>(data: D): Response {
  return HttpResponse.json<SuccessResult<D>>({ status: "success", data });
}

export function gateRequired(request: Request, intent: GatedIntent): Response {
  const url = new URL(request.url);
  return HttpResponse.json<GateRequiredResult>(
    {
      status: "gateRequired",
      intent: { intent, returnTo: `${url.pathname}${url.search}` },
    },
    { status: 401 },
  );
}

export function validationFailure(
  fieldErrors: Readonly<Record<string, string>>,
): Response {
  return HttpResponse.json<ValidationFailureResult>(
    { status: "validationFailure", fieldErrors },
    { status: 400 },
  );
}

export function serverError(message = "mock server unavailable"): Response {
  return HttpResponse.json<ErrorResult>(
    { status: "error", kind: "server", message, retryEligible: true },
    { status: 500 },
  );
}

export function notFound(message: string): Response {
  return HttpResponse.json<ErrorResult>(
    { status: "error", kind: "notFound", message, retryEligible: false },
    { status: 404 },
  );
}

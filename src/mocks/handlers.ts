/**
 * T021 MSW request handlers and scenario layer for the auction marketplace.
 *
 * This module is the single mock network boundary (spec: "one mock-data
 * boundary"). It implements every operation the typed UI data client exposes
 * (`AuctionMarketplaceClient` in `src/lib/api/client.ts`) over MSW v2
 * (`http`, `HttpResponse`, `delay`), building every response exclusively from
 * the deterministic T020 factories/presets plus the dashboard configuration.
 * No randomness and no wall-clock reads.
 *
 * Response envelope contract (matches `src/lib/api/result.ts`):
 * - success          -> 200 `{ status: "success", data }`
 * - validationFailure -> 400 `{ status: "validationFailure", fieldErrors }`
 * - gateRequired     -> 401 `{ status: "gateRequired", intent }`
 * - error            -> 500 `{ status: "error", kind, message, retryEligible }`
 * - notFound         -> 404 `{ status: "error", kind: "notFound", ... }`
 *
 * The HTTP paths are exported as `apiRoutes` and are the canonical contract a
 * client implementation must match. This module imports neither `msw/node` nor
 * `msw/browser`, so it is safe to share between the node test server
 * (`server.ts`) and the browser worker (`browser.ts`).
 *
 * Scenario layer: a switchable, deterministic set of behaviours covering
 * default, loading (delayed), empty, error, guest (unauthenticated), and
 * role-based (per authenticated role) variants. Gated endpoints return a
 * `gateRequired` result in the guest scenario; personal endpoints (session,
 * profile, wallet, favorites, my-auctions) resolve against the active role in
 * the default and role scenarios.
 */

import {
  createAuctionCoverageMatrix,
  createAutoBidState,
  createBelowReserveOutcome,
  createBid,
  createBidderIdentity,
  createBidHistory,
  createBySaleNonWinningOutcome,
  createBySaleWinOutcome,
  createCompanyAccount,
  createCompanySeller,
  createDeposit,
  createDirectSaleAuction,
  createEndedAuction,
  createIndividualAccount,
  createIndividualSeller,
  createLiveAuction,
  createParticipant,
  createParticipantCoverageList,
  createRelistOffer,
  createSellerOptionApprovedOutcome,
  createSellerOptionRejectedOutcome,
  createSettlement,
  createTransaction,
  createTransactionCoverageList,
  createUpcomingAuction,
  createWallet,
  createWithdrawalRequest,
  moneyFromMajor,
} from "./factories";
import type {
  Account,
  Auction,
  AutoBidState,
  Deposit,
  DirectSaleRelistOffer,
  LiveAuction,
  Outcome,
  Participant,
  Settlement,
  Transaction,
  Wallet,
  WithdrawalRequest,
} from "../lib/api/types";
import type {
  AutoBidRequest,
  AuctionPerspective,
  BidRequest,
  PayDepositRequest,
  SellerDecision,
  WithdrawalRequestInput,
} from "../lib/api/client";
import { banks, paymentMethodDefaults } from "../config/marketplace";
import { delay, http } from "msw";
import type { HttpHandler, PathParams } from "msw";
import {
  apiRoutes,
  success,
  gateRequired,
  validationFailure,
  serverError,
  notFound,
} from "./handlers/shared";
import { resolvePublicMockRequest } from "./runtime-public";
import {
  createAuthHandlers,
  accountScenarios,
  otpScenarios,
  nationalIdCalendarScenarios,
  yakeenReturnScenarios,
  companyReviewScenarios,
  authScenarioHandlers,
  authScenarioList,
  mockScenarios,
  mockRoles,
  DEFAULT_MOCK_DELAY_MS,
  type MockScenario,
  type MockRole,
} from "./handlers/auth";

export { apiRoutes, mockScenarios, mockRoles, DEFAULT_MOCK_DELAY_MS };
export {
  accountScenarios,
  otpScenarios,
  nationalIdCalendarScenarios,
  yakeenReturnScenarios,
  companyReviewScenarios,
  authScenarioHandlers,
  authScenarioList,
};

interface MockState {
  scenario: MockScenario;
  role: MockRole;
  delayMs: number;
  favorites: Set<string>;
}

const defaultFavorites: readonly string[] = [
  "fx-live-vehicle-company",
  "fx-upcoming-vehicle",
  "fx-direct-vehicle",
];

const state: MockState = {
  scenario: "default",
  role: "individualSaudi",
  delayMs: DEFAULT_MOCK_DELAY_MS,
  favorites: new Set(defaultFavorites),
};

export function getMockScenario(): MockScenario {
  return state.scenario;
}

export function setMockScenario(scenario: MockScenario): void {
  state.scenario = scenario;
}

export function getMockRole(): MockRole {
  return state.role;
}

export function setMockRole(role: MockRole): void {
  state.role = role;
}

export function getMockDelay(): number {
  return state.delayMs;
}

export function setMockDelay(delayMs: number): void {
  state.delayMs = delayMs;
}

export function resetMockState(): void {
  state.scenario = "default";
  state.role = "individualSaudi";
  state.delayMs = DEFAULT_MOCK_DELAY_MS;
  state.favorites = new Set(defaultFavorites);
}

/* ------------------------------------------------------------------------- */
/* Deterministic fixture catalogue                                            */
/* ------------------------------------------------------------------------- */

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

const auctionCatalog: readonly Auction[] = [
  ...featuredAuctions,
  ...createAuctionCoverageMatrix(),
];

function findAuctionById(auctionId: string): Auction | undefined {
  return auctionCatalog.find((auction) => auction.id === auctionId);
}

const outcomeByAuctionId: Readonly<Record<string, Outcome>> = {
  "fx-ended-vehicle": createBySaleWinOutcome({
    auctionId: "fx-ended-vehicle",
  }),
  "fx-matrix-vehicle-ended-bySale-company": createBySaleWinOutcome({
    auctionId: "fx-matrix-vehicle-ended-bySale-company",
  }),
  "fx-matrix-realEstate-ended-bySale-company": createBySaleNonWinningOutcome({
    auctionId: "fx-matrix-realEstate-ended-bySale-company",
  }),
  "fx-matrix-realEstate-ended-sellerOption-company":
    createSellerOptionApprovedOutcome({
      auctionId: "fx-matrix-realEstate-ended-sellerOption-company",
    }),
  "fx-matrix-licensePlate-ended-bySale-company": createBelowReserveOutcome({
    perspective: "buyer",
    auctionId: "fx-matrix-licensePlate-ended-bySale-company",
  }),
  "fx-matrix-licensePlate-ended-sellerOption-company":
    createSellerOptionRejectedOutcome({
      auctionId: "fx-matrix-licensePlate-ended-sellerOption-company",
    }),
};

function outcomeForAuction(auctionId: string): Outcome {
  const known = outcomeByAuctionId[auctionId];
  return known ?? createBySaleWinOutcome({ auctionId });
}

function depositForAuction(auctionId: string): Deposit {
  const auction = findAuctionById(auctionId);
  if (auction?.status === "upcoming") {
    return createDeposit({ status: "required" });
  }
  return createDeposit({ status: "paid" });
}

/* ------------------------------------------------------------------------- */
/* Role identity and role-scoped personal data                                */
/* ------------------------------------------------------------------------- */

function accountForRole(role: MockRole): Account {
  switch (role) {
    case "individualSaudi":
      return createIndividualAccount();
    case "individualNonSaudi":
      return createIndividualAccount({ nationality: "nonSaudi" });
    case "companySubmitted":
      return createCompanyAccount({ review: "submitted" });
    case "companyUnderReview":
      return createCompanyAccount({ review: "underReview" });
    case "companyActivated":
      return createCompanyAccount({ review: "activated" });
  }
}

function currentAccount(): Account {
  return accountForRole(state.role);
}

function walletForRole(role: MockRole, accountId: string): Wallet {
  const base = createWallet({ accountId });
  if (role === "companyUnderReview") {
    return {
      ...base,
      withdrawals: [createWithdrawalRequest({ status: "pending" })],
    };
  }
  return base;
}

/** Selling: company-led auctions; participating: the participant matrix. */
function myAuctionsForPerspective(
  perspective: AuctionPerspective,
): readonly Auction[] {
  if (perspective === "selling") {
    return auctionCatalog.filter(
      (auction) => auction.seller.kind === "company",
    );
  }
  const participatingIds = new Set(
    createParticipantCoverageList().map((participant) => participant.auctionId),
  );
  return auctionCatalog.filter((auction) => participatingIds.has(auction.id));
}

function favoritedAuctions(): readonly Auction[] {
  return [...state.favorites]
    .map((auctionId) => findAuctionById(auctionId))
    .filter((auction): auction is Auction => auction !== undefined);
}

/* ------------------------------------------------------------------------- */
/* Response envelope helpers (matches src/lib/api/result.ts)                  */
/* Re-exported from handlers/shared.ts to break circular imports.            */
/* ------------------------------------------------------------------------- */

async function waitForScenarioDelay(): Promise<void> {
  if (state.scenario === "loading") {
    await delay(state.delayMs);
  }
}

function isGated(scenario: MockScenario): boolean {
  return scenario === "guest";
}

function publicScenario(): "default" | "empty" | "error" {
  return state.scenario === "empty" || state.scenario === "error"
    ? state.scenario
    : "default";
}

function urlOf(request: Request): URL {
  return new URL(request.url);
}

function pathParam(params: PathParams, key: string): string {
  const value = params[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

/* ------------------------------------------------------------------------- */
/* Handlers                                                                   */
/* ------------------------------------------------------------------------- */

const handlers: readonly HttpHandler[] = [
  /* -------- Discovery: public, guest-accessible ------------------------- */
  http.get(apiRoutes.homeFeed, async ({ request }) => {
    await waitForScenarioDelay();
    return resolvePublicMockRequest(request, publicScenario());
  }),

  http.get(apiRoutes.categories, async ({ request }) => {
    await waitForScenarioDelay();
    return resolvePublicMockRequest(request, publicScenario());
  }),

  http.get(apiRoutes.auctions, async ({ request }) => {
    await waitForScenarioDelay();
    return resolvePublicMockRequest(request, publicScenario());
  }),

  http.get(apiRoutes.searchSuggestions, async ({ request }) => {
    await waitForScenarioDelay();
    return resolvePublicMockRequest(request, publicScenario());
  }),

  http.get(apiRoutes.search, async ({ request }) => {
    await waitForScenarioDelay();
    return resolvePublicMockRequest(request, publicScenario());
  }),

  http.get(apiRoutes.auctionById, async ({ request }) => {
    await waitForScenarioDelay();
    return resolvePublicMockRequest(request, publicScenario());
  }),

  /* -------- Session and auth -------------------------------------------- */
  ...createAuthHandlers(state),

  /* -------- Deposits and bidding (gated for guests) ---------------------- */
  http.get(apiRoutes.depositByAuction, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "deposit");
    if (state.scenario === "error") return serverError();
    return success<Deposit>(depositForAuction(pathParam(params, "auctionId")));
  }),

  http.post(apiRoutes.depositByAuction, async ({ request }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "deposit");
    if (state.scenario === "error") return serverError();
    const body = (await request.json()) as PayDepositRequest;
    if (
      !paymentMethodDefaults.some((method) => method === body.paymentMethodId)
    ) {
      return validationFailure({ paymentMethodId: "payment-method-unknown" });
    }
    return success<Deposit>(
      createDeposit({ status: "paid", paymentReference: "PAY-0001-2026" }),
    );
  }),

  http.post(apiRoutes.bids, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "bid");
    if (state.scenario === "error") return serverError();
    const auctionId = pathParam(params, "auctionId");
    const body = (await request.json()) as BidRequest;
    const auction = findAuctionById(auctionId);
    if (!auction) return notFound("auction-not-found");
    if (auction.status === "live") {
      if (body.amount.amountMinor <= auction.currentPrice.amountMinor) {
        return validationFailure({ amount: "bid-must-exceed-current-price" });
      }
      const updatedLive: LiveAuction = {
        ...auction,
        currentPrice: body.amount,
        highestBidder: createBidderIdentity({ isCurrentUser: true }),
        bidHistory: [
          ...auction.bidHistory,
          createBid({
            id: `bid-${body.amount.amountMinor}-${body.source}`,
            auctionId,
            amount: body.amount,
            source: body.source,
            bidder: createBidderIdentity({ isCurrentUser: true }),
          }),
        ],
      };
      return success<Auction>(updatedLive);
    }
    return success<Auction>(auction);
  }),

  http.put(apiRoutes.autoBid, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "bid");
    if (state.scenario === "error") return serverError();
    const auctionId = pathParam(params, "auctionId");
    const body = (await request.json()) as AutoBidRequest;
    const auction = findAuctionById(auctionId);
    if (
      auction?.status === "live" &&
      body.maximum.amountMinor <= auction.currentPrice.amountMinor
    ) {
      return validationFailure({
        maximum: "maximum-must-exceed-current-price",
      });
    }
    return success<AutoBidState>(
      createAutoBidState({
        state: "active",
        maximum: body.maximum,
        increment: body.increment,
      }),
    );
  }),

  http.delete(apiRoutes.autoBid, async ({ request }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "bid");
    if (state.scenario === "error") return serverError();
    return success<AutoBidState>(createAutoBidState({ state: "cancelled" }));
  }),

  http.post(apiRoutes.withdraw, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "bid");
    if (state.scenario === "error") return serverError();
    const auctionId = pathParam(params, "auctionId");
    return success<Participant>(
      createParticipant({
        accountId: currentAccount().id,
        auctionId,
        deposit: createDeposit({ status: "refunded" }),
        highestBidder: false,
        withdrawal: "requested",
        autoBid: null,
      }),
    );
  }),

  http.post(apiRoutes.buyNow, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "buy-now");
    if (state.scenario === "error") return serverError();
    const auctionId = pathParam(params, "auctionId");
    if (!findAuctionById(auctionId)) return notFound("auction-not-found");
    return success<Outcome>(createBySaleWinOutcome({ auctionId }));
  }),

  /* -------- Outcomes and settlement (gated for guests) ------------------- */
  http.get(apiRoutes.outcomeByAuction, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) {
      return gateRequired(request, "personal-area");
    }
    if (state.scenario === "error") return serverError();
    return success<Outcome>(outcomeForAuction(pathParam(params, "auctionId")));
  }),

  http.get(apiRoutes.relistOffer, async ({ request }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) {
      return gateRequired(request, "personal-area");
    }
    if (state.scenario === "error") return serverError();
    return success<DirectSaleRelistOffer>(createRelistOffer());
  }),

  http.get(apiRoutes.settlementByOutcome, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) {
      return gateRequired(request, "personal-area");
    }
    if (state.scenario === "error") return serverError();
    return success<Settlement>(
      createSettlement({ outcomeId: pathParam(params, "outcomeId") }),
    );
  }),

  http.post(apiRoutes.sellerOption, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) {
      return gateRequired(request, "personal-area");
    }
    if (state.scenario === "error") return serverError();
    const auctionId = pathParam(params, "auctionId");
    const body = (await request.json()) as {
      readonly decision?: SellerDecision;
    };
    if (body.decision !== "approve" && body.decision !== "reject") {
      return validationFailure({ decision: "seller-decision-required" });
    }
    const outcome =
      body.decision === "approve"
        ? createSellerOptionApprovedOutcome({ auctionId })
        : createSellerOptionRejectedOutcome({ auctionId });
    return success<Outcome>(outcome);
  }),

  /* -------- Wallet (gated for guests) ------------------------------------ */
  http.get(apiRoutes.wallet, async ({ request }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) {
      return gateRequired(request, "personal-area");
    }
    if (state.scenario === "error") return serverError();
    const accountId = urlOf(request).searchParams.get("accountId");
    return success<Wallet>(
      walletForRole(state.role, accountId ?? currentAccount().id),
    );
  }),

  http.get(apiRoutes.transactionById, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) {
      return gateRequired(request, "personal-area");
    }
    if (state.scenario === "error") return serverError();
    const transactionId = pathParam(params, "transactionId");
    const known = createTransactionCoverageList().find(
      (transaction) => transaction.id === transactionId,
    );
    return success<Transaction>(
      known ?? createTransaction({ id: transactionId }),
    );
  }),

  http.post(apiRoutes.withdrawals, async ({ request }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) {
      return gateRequired(request, "personal-area");
    }
    if (state.scenario === "error") return serverError();
    const body = (await request.json()) as WithdrawalRequestInput;
    const wallet = walletForRole(state.role, body.accountId);
    if (
      wallet.withdrawals.some((withdrawal) => withdrawal.status === "pending")
    ) {
      return validationFailure({ amount: "pending-request-exists" });
    }
    if (body.amount.amountMinor > wallet.availableBalance.amountMinor) {
      return validationFailure({ amount: "amount-exceeds-balance" });
    }
    const destination = body.destination;
    if (
      destination.kind === "configuredBank" &&
      !banks.some((bank) => bank.id === destination.bankId)
    ) {
      return validationFailure({ destination: "bank-unknown" });
    }
    return success<WithdrawalRequest>(
      createWithdrawalRequest({
        amount: body.amount,
        destination: body.destination,
        status: "pending",
      }),
    );
  }),

  /* -------- Favorites, my-auctions (gated for guests) ----------- */
  http.get(apiRoutes.favorites, async ({ request }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "favorite");
    if (state.scenario === "error") return serverError();
    if (state.scenario === "empty") return success<readonly Auction[]>([]);
    return success<readonly Auction[]>(favoritedAuctions());
  }),

  http.put(apiRoutes.favoriteByAuction, async ({ request, params }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) return gateRequired(request, "favorite");
    if (state.scenario === "error") return serverError();
    const auctionId = pathParam(params, "auctionId");
    const body = (await request.json()) as { readonly favorited: boolean };
    if (body.favorited) {
      state.favorites.add(auctionId);
    } else {
      state.favorites.delete(auctionId);
    }
    const auction = findAuctionById(auctionId);
    return auction ? success<Auction>(auction) : notFound("auction-not-found");
  }),

  http.get(apiRoutes.myAuctions, async ({ request }) => {
    await waitForScenarioDelay();
    if (isGated(state.scenario)) {
      return gateRequired(request, "personal-area");
    }
    if (state.scenario === "error") return serverError();
    if (state.scenario === "empty") return success<readonly Auction[]>([]);
    const perspective = urlOf(request).searchParams.get("perspective");
    return success<readonly Auction[]>(
      myAuctionsForPerspective(
        perspective === "selling" ? "selling" : "participating",
      ),
    );
  }),
];

export { handlers };

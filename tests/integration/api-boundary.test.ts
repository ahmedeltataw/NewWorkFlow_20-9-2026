/**
 * T022 Data-client / MSW scenario contract tests.
 *
 * These tests pin the UI data-boundary contract (contracts/ui-data-boundary.md)
 * at the network seam: every method of the typed `AuctionMarketplaceClient`
 * interface (src/lib/api/client.ts) is driven against the single MSW node
 * server (src/mocks/server.ts -> src/mocks/handlers.ts), and every response
 * envelope is asserted against the discriminated result contract
 * (src/lib/api/result.ts).
 *
 * The client under test is a reference implementation built here from the
 * canonical paths, mirroring exactly how a real data client must speak to the
 * handlers. It is NOT a second production client: it is the contract fixture
 * that proves the handlers respond on the routes the interface declares and
 * with the envelopes the interface returns. If a route or envelope drifts,
 * either the shape assertions or the global unhandled-request guard fails.
 *
 * The global MSW lifecycle (tests/setup.ts -> tests/msw.ts) already starts
 * the single `setupServer` with `onUnhandledRequest: "error"` and resets the
 * scenario/role state after every test, so each test sets only what it needs
 * and no custom lifecycle is created here.
 */

import { describe, expect, it } from "vitest";

import { banks, paymentMethodDefaults } from "../../src/config/marketplace";
import type { HttpMethod } from "../../src/lib/api/client";
import type {
  AuctionMarketplaceClient,
  MarketplaceQuery,
} from "../../src/lib/api/client";
import type { Result } from "../../src/lib/api/result";
import type {
  Account,
  Auction,
  AuctionCategory,
  AutoBidState,
  Deposit,
  DirectSaleRelistOffer,
  Outcome,
  Participant,
  PhoneNumber,
  Settlement,
  Transaction,
  Wallet,
  WithdrawalRequest,
} from "../../src/lib/api/types";
import {
  DEFAULT_MOCK_DELAY_MS,
  mockRoles,
  mockScenarios,
  setMockDelay,
  setMockRole,
  setMockScenario,
} from "../../src/mocks/handlers";
import { createPhoneNumber, moneyFromMajor } from "../../src/mocks/factories";

const BASE_URL = "http://localhost:3000";

const LIVE_AUCTION_ID = "fx-live-vehicle-company";
const ACCOUNT_ID = "account-individual-saudi-001";

/**
 * Reference data client. Hardcodes the canonical paths a client must match so
 * the test, not shared constants, owns the route contract. Every method
 * resolves with the typed result envelope; handled failures arrive as results
 * and only unhandled/network failures reject.
 */
function createReferenceClient(): AuctionMarketplaceClient {
  return {
    getHomeFeed: () => request<readonly Auction[]>("GET", "/api/home-feed"),
    getCategories: () =>
      request<readonly AuctionCategory[]>("GET", "/api/categories"),
    queryMarketplace: (query: MarketplaceQuery) =>
      request<readonly Auction[]>(
        "GET",
        `/api/auctions${toQueryString({
          query: query.query,
          category: query.category,
          saleType: query.saleType,
          status: query.status,
          sellerKind: query.sellerKind,
          companyName: query.companyName,
        })}`,
      ),
    getSearchSuggestions: (input: string) =>
      request<readonly string[]>(
        "GET",
        `/api/search/suggestions?q=${encodeURIComponent(input)}`,
      ),
    searchAuctions: (input: string) =>
      request<readonly Auction[]>(
        "GET",
        `/api/search?q=${encodeURIComponent(input)}`,
      ),
    getAuctionDetail: (auctionId: string) =>
      request<Auction>("GET", `/api/auctions/${encodeURIComponent(auctionId)}`),

    getSession: () => request<Account | null>("GET", "/api/session"),
    requestOtpCode: (phone: PhoneNumber) =>
      request<PhoneNumber>("POST", "/api/auth/otp", phone),
    verifyOtpCode: (code: string) =>
      request<Account>("POST", "/api/auth/otp/verify", { code }),
    getNationalIdCalendar: (nationalId: string) =>
      request<{
        readonly calendar: "hijri" | "gregorian";
        readonly nationalId: string;
      }>(
        "GET",
        `/api/auth/national-id/calendar?nationalId=${encodeURIComponent(nationalId)}`,
      ),
    registerIndividual: (input) =>
      request<Account>("POST", "/api/auth/register/individual", input),
    registerCompany: (input) =>
      request<Account>("POST", "/api/auth/register/company", input),
    completeIdentityVerification: (input) =>
      request<Account>("POST", "/api/auth/verification/return", input),
    getCompanyReview: () => request<Account>("GET", "/api/auth/company-review"),

    getDeposit: (auctionId: string) =>
      request<Deposit>(
        "GET",
        `/api/auctions/${encodeURIComponent(auctionId)}/deposit`,
      ),
    payDeposit: (input) =>
      request<Deposit>(
        "POST",
        `/api/auctions/${encodeURIComponent(input.auctionId)}/deposit`,
        input,
      ),
    placeBid: (input) =>
      request<Auction>(
        "POST",
        `/api/auctions/${encodeURIComponent(input.auctionId)}/bids`,
        input,
      ),
    saveAutoBid: (input) =>
      request<AutoBidState>(
        "PUT",
        `/api/auctions/${encodeURIComponent(input.auctionId)}/auto-bid`,
        input,
      ),
    cancelAutoBid: (auctionId: string) =>
      request<AutoBidState>(
        "DELETE",
        `/api/auctions/${encodeURIComponent(auctionId)}/auto-bid`,
      ),
    withdrawFromAuction: (auctionId: string) =>
      request<Participant>(
        "POST",
        `/api/auctions/${encodeURIComponent(auctionId)}/withdraw`,
      ),
    buyNow: (auctionId: string) =>
      request<Outcome>(
        "POST",
        `/api/auctions/${encodeURIComponent(auctionId)}/buy-now`,
      ),

    getOutcome: (auctionId: string) =>
      request<Outcome>(
        "GET",
        `/api/auctions/${encodeURIComponent(auctionId)}/outcome`,
      ),
    getRelistOffer: (auctionId: string) =>
      request<DirectSaleRelistOffer>(
        "GET",
        `/api/auctions/${encodeURIComponent(auctionId)}/relist-offer`,
      ),
    getSettlement: (outcomeId: string) =>
      request<Settlement>(
        "GET",
        `/api/outcomes/${encodeURIComponent(outcomeId)}/settlement`,
      ),
    decideSellerOption: (auctionId, decision) =>
      request<Outcome>(
        "POST",
        `/api/auctions/${encodeURIComponent(auctionId)}/seller-option`,
        { decision },
      ),

    getWallet: (accountId: string) =>
      request<Wallet>(
        "GET",
        `/api/wallet?accountId=${encodeURIComponent(accountId)}`,
      ),
    getTransaction: (transactionId: string) =>
      request<Transaction>(
        "GET",
        `/api/wallet/transactions/${encodeURIComponent(transactionId)}`,
      ),
    requestWithdrawal: (input) =>
      request<WithdrawalRequest>("POST", "/api/wallet/withdrawals", input),

    getFavorites: () => request<readonly Auction[]>("GET", "/api/favorites"),
    setFavorite: (auctionId, favorited) =>
      request<Auction>(
        "PUT",
        `/api/auctions/${encodeURIComponent(auctionId)}/favorite`,
        { favorited },
      ),
    getMyAuctions: (_accountId, perspective) =>
      request<readonly Auction[]>(
        "GET",
        `/api/my-auctions?perspective=${perspective}`,
      ),
    getProfile: () => request<Account>("GET", "/api/profile"),
  };
}

async function request<D>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<Result<D>> {
  const response = await fetch(new URL(path, BASE_URL), {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await response.json()) as Result<D>;
}

function toQueryString(
  query: Readonly<Record<string, string | undefined>>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, value);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function dataOf<D>(result: Result<D>): D {
  if (result.status !== "success") {
    throw new Error(`expected success result, got "${result.status}"`);
  }
  return result.data;
}

describe("T022 data-client / MSW contract", () => {
  it("exposes the full T021 scenario and role catalogue", () => {
    expect(mockScenarios).toEqual([
      "default",
      "loading",
      "empty",
      "error",
      "guest",
      "role",
    ]);
    expect(mockRoles).toEqual([
      "individualSaudi",
      "individualNonSaudi",
      "companySubmitted",
      "companyUnderReview",
      "companyActivated",
    ]);
    expect(DEFAULT_MOCK_DELAY_MS).toBe(400);
  });

  describe("success contract", () => {
    it("resolves discovery methods with the success envelope", async () => {
      const client = createReferenceClient();

      const feed = dataOf(await client.getHomeFeed());
      expect(feed.length).toBeGreaterThan(0);
      expect(feed.every((auction) => auction.status !== "ended")).toBe(true);

      const categories = dataOf(await client.getCategories());
      expect(categories).toEqual(["vehicle", "realEstate", "licensePlate"]);

      const live = dataOf(await client.queryMarketplace({ status: "live" }));
      expect(live.length).toBeGreaterThan(0);
      expect(live.every((auction) => auction.status === "live")).toBe(true);

      const companies = dataOf(
        await client.queryMarketplace({
          sellerKind: "company",
          companyName: "شركة",
        }),
      );
      expect(companies.length).toBeGreaterThan(0);
      for (const auction of companies) {
        expect(auction.seller.kind).toBe("company");
      }

      const suggestions = dataOf(await client.getSearchSuggestions(""));
      expect(suggestions.length).toBeGreaterThan(0);

      const search = dataOf(await client.searchAuctions("تويوتا"));
      expect(search.length).toBeGreaterThan(0);

      const detail = dataOf(await client.getAuctionDetail(LIVE_AUCTION_ID));
      expect(detail.id).toBe(LIVE_AUCTION_ID);
      expect(detail.status).toBe("live");
    });

    it("resolves session and auth methods with the success envelope", async () => {
      const client = createReferenceClient();

      const session = dataOf(await client.getSession());
      expect(session).not.toBeNull();
      expect(session?.type).toBe("individual");

      const phone = dataOf(await client.requestOtpCode(createPhoneNumber()));
      expect(phone).toEqual(createPhoneNumber());

      const individual = dataOf(
        await client.registerIndividual({
          phone: createPhoneNumber(),
          nationality: "saudi",
          nationalId: "1012345678",
          dateCalendar: "hijri",
          dateOfBirth: { day: 15, month: 6, year: 1415 },
        }),
      );
      expect(individual).toMatchObject({
        type: "individual",
        nationality: "saudi",
        dateCalendar: "hijri",
      });

      const company = dataOf(
        await client.registerCompany({
          phone: createPhoneNumber(),
          companyName: "شركة المزادات الدولية",
        }),
      );
      expect(company).toMatchObject({ type: "company", review: "submitted" });

      const verified = dataOf(
        await client.completeIdentityVerification({ status: "success" }),
      );
      expect(verified.type).toBe("individual");
    });

    it("resolves deposit, bidding, and buy-now methods with the success envelope", async () => {
      const client = createReferenceClient();

      const deposit = dataOf(
        await client.getDeposit(LIVE_AUCTION_ID, ACCOUNT_ID),
      );
      expect(deposit.status).toBe("paid");

      const paid = dataOf(
        await client.payDeposit({
          auctionId: LIVE_AUCTION_ID,
          accountId: ACCOUNT_ID,
          paymentMethodId: paymentMethodDefaults[0],
        }),
      );
      expect(paid.status).toBe("paid");
      expect(paid.paymentReference).toBeDefined();

      const bidAmount = moneyFromMajor(61600);
      const bid = dataOf(
        await client.placeBid({
          auctionId: LIVE_AUCTION_ID,
          amount: bidAmount,
          source: "manual",
        }),
      );
      expect(bid.status).toBe("live");
      if (bid.status === "live") {
        expect(bid.currentPrice.amountMinor).toBe(bidAmount.amountMinor);
      }

      const autoBid = dataOf(
        await client.saveAutoBid({
          auctionId: LIVE_AUCTION_ID,
          maximum: moneyFromMajor(70000),
          increment: moneyFromMajor(500),
        }),
      );
      expect(autoBid.state).toBe("active");

      const cancelled = dataOf(await client.cancelAutoBid(LIVE_AUCTION_ID));
      expect(cancelled.state).toBe("cancelled");

      const participant = dataOf(
        await client.withdrawFromAuction(LIVE_AUCTION_ID),
      );
      expect(participant.highestBidder).toBe(false);
      expect(participant.withdrawal).toBe("requested");

      const outcome = dataOf(await client.buyNow(LIVE_AUCTION_ID, ACCOUNT_ID));
      expect(outcome.type).toBe("won");
    });

    it("resolves outcome, settlement, and seller-option methods with the success envelope", async () => {
      const client = createReferenceClient();
      const auctionId = "fx-ended-vehicle";

      const outcome = dataOf(await client.getOutcome(auctionId));
      expect(outcome.type).toBe("won");

      const relist = dataOf(await client.getRelistOffer(auctionId));
      expect(relist.editableBuyNowPrice.amountMinor).toBeGreaterThan(0);

      const settlement = dataOf(await client.getSettlement("fx-outcome-001"));
      expect(settlement.status).toBe("inProgress");

      const approved = dataOf(
        await client.decideSellerOption(auctionId, "approve"),
      );
      expect(approved.type).toBe("sellerApproved");

      const rejected = dataOf(
        await client.decideSellerOption(auctionId, "reject"),
      );
      expect(rejected.type).toBe("sellerRejected");
    });

    it("resolves wallet methods with the success envelope", async () => {
      const client = createReferenceClient();

      const wallet = dataOf(await client.getWallet(ACCOUNT_ID));
      expect(wallet.accountId).toBe(ACCOUNT_ID);
      expect(wallet.transactions.length).toBeGreaterThan(0);

      const transaction = dataOf(
        await client.getTransaction("txn-deposit-completed-001"),
      );
      expect(transaction).toMatchObject({
        type: "deposit",
        status: "completed",
      });

      const bankWithdrawal = dataOf(
        await client.requestWithdrawal({
          accountId: ACCOUNT_ID,
          amount: moneyFromMajor(1000),
          destination: { kind: "configuredBank", bankId: banks[0].id },
        }),
      );
      expect(bankWithdrawal.status).toBe("pending");

      const international = dataOf(
        await client.requestWithdrawal({
          accountId: ACCOUNT_ID,
          amount: moneyFromMajor(500),
          destination: { kind: "international" },
        }),
      );
      expect(international.destination).toEqual({ kind: "international" });
    });

    it("resolves favorites, my-auctions, and profile methods with the success envelope", async () => {
      const client = createReferenceClient();

      const favorites = dataOf(await client.getFavorites(ACCOUNT_ID));
      expect(favorites.length).toBeGreaterThan(0);

      const favorited = dataOf(
        await client.setFavorite("fx-upcoming-vehicle", true),
      );
      expect(favorited.id).toBe("fx-upcoming-vehicle");

      const selling = dataOf(await client.getMyAuctions(ACCOUNT_ID, "selling"));
      expect(selling.length).toBeGreaterThan(0);
      for (const auction of selling) {
        expect(auction.seller.kind).toBe("company");
      }

      const participating = dataOf(
        await client.getMyAuctions(ACCOUNT_ID, "participating"),
      );
      expect(participating.length).toBeGreaterThan(0);

      const profile = dataOf(await client.getProfile(ACCOUNT_ID));
      expect(profile.type).toBe("individual");
    });
  });

  describe("error contract", () => {
    it("returns the notFound error envelope instead of throwing", async () => {
      const client = createReferenceClient();

      const detail = await client.getAuctionDetail("no-such-auction");
      expect(detail).toEqual({
        status: "error",
        kind: "notFound",
        message: "auction-not-found",
        retryEligible: false,
      });

      const buyNow = await client.buyNow("no-such-auction", ACCOUNT_ID);
      expect(buyNow.status).toBe("error");
      if (buyNow.status === "error") {
        expect(buyNow.kind).toBe("notFound");
        expect(buyNow.retryEligible).toBe(false);
      }
    });

    it("returns the validationFailure envelope with typed field errors", async () => {
      const client = createReferenceClient();

      const otp = await client.requestOtpCode({
        countryCode: "+966",
        nationalNumber: "",
      });
      expect(otp).toEqual({
        status: "validationFailure",
        fieldErrors: { phone: "phone-number-required" },
      });

      const lowBid = await client.placeBid({
        auctionId: LIVE_AUCTION_ID,
        amount: moneyFromMajor(100),
        source: "manual",
      });
      expect(lowBid.status).toBe("validationFailure");
      if (lowBid.status === "validationFailure") {
        expect(lowBid.fieldErrors.amount).toBe("bid-must-exceed-current-price");
      }

      const overBalance = await client.requestWithdrawal({
        accountId: ACCOUNT_ID,
        amount: moneyFromMajor(10000000),
        destination: { kind: "configuredBank", bankId: banks[0].id },
      });
      expect(overBalance.status).toBe("validationFailure");
      if (overBalance.status === "validationFailure") {
        expect(overBalance.fieldErrors.amount).toBe("amount-exceeds-balance");
      }
    });

    it("returns handled errors through the result contract instead of throwing", async () => {
      setMockScenario("error");
      const client = createReferenceClient();

      const probes: ReadonlyArray<Promise<Result<unknown>>> = [
        client.getHomeFeed(),
        client.getCategories(),
        client.queryMarketplace({ status: "live" }),
        client.getSearchSuggestions(""),
        client.searchAuctions("تويوتا"),
        client.getAuctionDetail(LIVE_AUCTION_ID),
        client.getSession(),
        client.requestOtpCode(createPhoneNumber()),
        client.getDeposit(LIVE_AUCTION_ID, ACCOUNT_ID),
        client.payDeposit({
          auctionId: LIVE_AUCTION_ID,
          accountId: ACCOUNT_ID,
          paymentMethodId: paymentMethodDefaults[0],
        }),
        client.placeBid({
          auctionId: LIVE_AUCTION_ID,
          amount: moneyFromMajor(61600),
          source: "manual",
        }),
        client.getOutcome("fx-ended-vehicle"),
        client.getWallet(ACCOUNT_ID),
        client.getFavorites(ACCOUNT_ID),
        client.getProfile(ACCOUNT_ID),
      ];

      const settled = await Promise.allSettled(probes);
      for (const outcome of settled) {
        expect(outcome.status).toBe("fulfilled");
        if (outcome.status === "fulfilled") {
          expect(outcome.value).toEqual({
            status: "error",
            kind: "server",
            message: "mock server unavailable",
            retryEligible: true,
          });
        }
      }
    });
  });

  describe("gate contract", () => {
    it("returns the gateRequired envelope with preserved intent for guests", async () => {
      setMockScenario("guest");
      const client = createReferenceClient();

      const session = await client.getSession();
      expect(session).toEqual({ status: "success", data: null });

      const deposit = await client.getDeposit(LIVE_AUCTION_ID, ACCOUNT_ID);
      expect(deposit.status).toBe("gateRequired");
      if (deposit.status === "gateRequired") {
        expect(deposit.intent).toEqual({
          intent: "deposit",
          returnTo: `/api/auctions/${LIVE_AUCTION_ID}/deposit`,
        });
      }

      const bid = await client.placeBid({
        auctionId: LIVE_AUCTION_ID,
        amount: moneyFromMajor(61600),
        source: "manual",
      });
      expect(bid.status).toBe("gateRequired");
      if (bid.status === "gateRequired") {
        expect(bid.intent.intent).toBe("bid");
      }

      const buyNow = await client.buyNow(LIVE_AUCTION_ID, ACCOUNT_ID);
      expect(buyNow.status).toBe("gateRequired");
      if (buyNow.status === "gateRequired") {
        expect(buyNow.intent.intent).toBe("buy-now");
      }

      const favorite = await client.setFavorite(LIVE_AUCTION_ID, true);
      expect(favorite.status).toBe("gateRequired");
      if (favorite.status === "gateRequired") {
        expect(favorite.intent.intent).toBe("favorite");
      }

      const wallet = await client.getWallet(ACCOUNT_ID);
      expect(wallet.status).toBe("gateRequired");
      if (wallet.status === "gateRequired") {
        expect(wallet.intent).toEqual({
          intent: "personal-area",
          returnTo: `/api/wallet?accountId=${ACCOUNT_ID}`,
        });
      }
    });
  });

  describe("scenario coverage", () => {
    it("keeps the delayed loading scenario contract intact", async () => {
      setMockScenario("loading");
      setMockDelay(30);
      const client = createReferenceClient();

      const startedAt = Date.now();
      const result = await client.getHomeFeed();
      const elapsed = Date.now() - startedAt;

      expect(result.status).toBe("success");
      expect(dataOf(result).length).toBeGreaterThan(0);
      expect(elapsed).toBeGreaterThanOrEqual(20);
    });

    it("returns empty success collections instead of errors in the empty scenario", async () => {
      setMockScenario("empty");
      const client = createReferenceClient();

      expect(await client.getHomeFeed()).toEqual({
        status: "success",
        data: [],
      });
      expect(await client.getCategories()).toEqual({
        status: "success",
        data: [],
      });
      expect(await client.getFavorites(ACCOUNT_ID)).toEqual({
        status: "success",
        data: [],
      });
      expect(await client.getMyAuctions(ACCOUNT_ID, "participating")).toEqual({
        status: "success",
        data: [],
      });
    });

    it("resolves the role scenario per authenticated role", async () => {
      setMockScenario("role");
      const client = createReferenceClient();

      for (const role of mockRoles) {
        setMockRole(role);

        const session = dataOf(await client.getSession());
        const profile = dataOf(await client.getProfile(ACCOUNT_ID));
        if (session === null) {
          throw new Error(
            "expected an authenticated session in the role scenario",
          );
        }

        if (role.startsWith("company")) {
          expect(session.type).toBe("company");
          if (session.type === "company") {
            expect(session.review).toBe(
              role === "companySubmitted"
                ? "submitted"
                : role === "companyUnderReview"
                  ? "underReview"
                  : "activated",
            );
          }
          expect(profile.type).toBe("company");
        } else {
          expect(session.type).toBe("individual");
          if (session.type === "individual") {
            expect(session.nationality).toBe(
              role === "individualSaudi" ? "saudi" : "nonSaudi",
            );
          }
          expect(profile.type).toBe("individual");
          if (profile.type === "individual") {
            expect(profile.nationality).toBe(
              role === "individualSaudi" ? "saudi" : "nonSaudi",
            );
          }
        }

        const wallet = dataOf(await client.getWallet(ACCOUNT_ID));
        if (role === "companyUnderReview") {
          expect(wallet.withdrawals.length).toBeGreaterThan(0);
          expect(wallet.withdrawals[0]?.status).toBe("pending");
        } else {
          expect(wallet.withdrawals.length).toBe(0);
        }
      }
    });
  });

  describe("unhandled-request guard", () => {
    it("fails a request that has no matching handler", async () => {
      await expect(
        fetch(new URL("/api/no-such-route", BASE_URL)),
      ).rejects.toThrow();
    });
  });
});

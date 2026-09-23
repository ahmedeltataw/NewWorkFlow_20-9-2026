/**
 * Concrete AuctionMarketplaceClient using fetch() with absolute URLs.
 *
 * Relative URLs fail in Node (TypeError: Failed to parse URL from /path).
 * The base URL is sourced from NEXT_PUBLIC_API_BASE_URL or defaults to
 * http://localhost:3000 so MSW intercepts in tests.
 */

import type { AuctionMarketplaceClient, MarketplaceQuery } from "./client";
import type { CollectionResult, ErrorResult, Result } from "./result";
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
} from "./types";
import {
  type IdentityVerificationReturn,
  type IndividualRegistration,
  type CompanyRegistration,
  type PayDepositRequest,
  type BidRequest,
  type AutoBidRequest,
  type WithdrawalRequestInput,
  type SellerDecision,
  type AuctionPerspective,
} from "./client";
import { marketplaceConfig } from "../../config/marketplace";
import { startBrowserMockWorker } from "../../mocks/browser-runtime";

const BASE = marketplaceConfig.apiBaseUrl;

async function workerStartupError(): Promise<ErrorResult | null> {
  try {
    await startBrowserMockWorker();
    return null;
  } catch {
    return {
      status: "error",
      kind: "network",
      message: "Mock service worker could not start",
      retryEligible: true,
    };
  }
}

async function requestCollection<T>(
  path: string,
): Promise<CollectionResult<T>> {
  const startupError = await workerStartupError();
  if (startupError) return startupError;
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) throw new Error(`API ${response.status}: ${path}`);
  const envelope = (await response.json()) as {
    readonly data: readonly T[];
  };
  return { status: "success", data: envelope.data };
}

async function requestResult<D>(
  path: string,
  init?: RequestInit,
): Promise<Result<D>> {
  const startupError = await workerStartupError();
  if (startupError) return startupError;
  const response = init
    ? await fetch(`${BASE}${path}`, {
        headers: { "content-type": "application/json", ...init.headers },
        ...init,
      })
    : await fetch(`${BASE}${path}`);
  return (await response.json()) as Result<D>;
}

export class ApiClient implements AuctionMarketplaceClient {
  async getHomeFeed(): Promise<CollectionResult<Auction>> {
    return requestCollection<Auction>("/api/home-feed");
  }

  async getCategories(): Promise<Result<readonly AuctionCategory[]>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async queryMarketplace(
    query: MarketplaceQuery,
  ): Promise<CollectionResult<Auction>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, value);
    }
    const search = params.toString();
    return requestCollection<Auction>(
      `/api/auctions${search ? `?${search}` : ""}`,
    );
  }

  async getSearchSuggestions(
    input: string,
  ): Promise<Result<readonly string[]>> {
    const params = new URLSearchParams();
    if (input.trim()) params.set("q", input.trim());
    const search = params.toString();
    const result = await requestResult<readonly string[]>(
      `/api/search/suggestions${search ? `?${search}` : ""}`,
    );
    return result.status === "success"
      ? { status: "success", data: result.data ?? [] }
      : result;
  }

  async searchAuctions(
    input: string,
    category?: AuctionCategory,
  ): Promise<CollectionResult<Auction>> {
    const params = new URLSearchParams();
    if (input.trim()) params.set("q", input.trim());
    if (category) params.set("category", category);
    const search = params.toString();
    return requestResult<readonly Auction[]>(
      `/api/search${search ? `?${search}` : ""}`,
    );
  }

  async getAuctionDetail(auctionId: string): Promise<Result<Auction>> {
    return requestResult<Auction>(
      `/api/auctions/${encodeURIComponent(auctionId)}`,
    );
  }

  async getSession(): Promise<Result<Account | null>> {
    return requestResult<Account | null>("/api/session");
  }

  async requestOtpCode(phone: PhoneNumber): Promise<Result<PhoneNumber>> {
    return requestResult<PhoneNumber>("/api/auth/otp", {
      method: "POST",
      body: JSON.stringify(phone),
    });
  }

  async verifyOtpCode(code: string): Promise<Result<Account>> {
    return requestResult<Account>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  async getNationalIdCalendar(nationalId: string): Promise<
    Result<{
      readonly calendar: import("./types").NationalIdCalendar;
      readonly nationalId: string;
    }>
  > {
    return requestResult(
      `/api/auth/national-id/calendar?nationalId=${encodeURIComponent(nationalId)}`,
    );
  }

  async registerIndividual(
    input: IndividualRegistration,
  ): Promise<Result<Account>> {
    return requestResult<Account>("/api/auth/register/individual", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async registerCompany(input: CompanyRegistration): Promise<Result<Account>> {
    return requestResult<Account>("/api/auth/register/company", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async completeIdentityVerification(
    input: IdentityVerificationReturn,
  ): Promise<Result<Account>> {
    return requestResult<Account>("/api/auth/yakeen/return", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getCompanyReview(): Promise<Result<Account>> {
    return requestResult<Account>("/api/auth/company-review");
  }

  async getDeposit(
    _auctionId: string,
    _accountId: string,
  ): Promise<Result<Deposit>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async payDeposit(_input: PayDepositRequest): Promise<Result<Deposit>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async placeBid(_input: BidRequest): Promise<Result<Auction>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async saveAutoBid(_input: AutoBidRequest): Promise<Result<AutoBidState>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async cancelAutoBid(_auctionId: string): Promise<Result<AutoBidState>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async withdrawFromAuction(_auctionId: string): Promise<Result<Participant>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async buyNow(
    _auctionId: string,
    _accountId: string,
  ): Promise<Result<Outcome>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getOutcome(_auctionId: string): Promise<Result<Outcome>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getRelistOffer(
    _auctionId: string,
  ): Promise<Result<DirectSaleRelistOffer>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getSettlement(_outcomeId: string): Promise<Result<Settlement>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async decideSellerOption(
    _auctionId: string,
    _decision: SellerDecision,
  ): Promise<Result<Outcome>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getWallet(_accountId: string): Promise<Result<Wallet>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getTransaction(_transactionId: string): Promise<Result<Transaction>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async requestWithdrawal(
    _input: WithdrawalRequestInput,
  ): Promise<Result<WithdrawalRequest>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getFavorites(_accountId: string): Promise<CollectionResult<Auction>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async setFavorite(
    _auctionId: string,
    _favorited: boolean,
  ): Promise<Result<Auction>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getMyAuctions(
    _accountId: string,
    _perspective: AuctionPerspective,
  ): Promise<CollectionResult<Auction>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getProfile(_accountId: string): Promise<Result<Account>> {
    throw new Error("Not implemented in ApiClient stub");
  }
}

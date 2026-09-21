/**
 * Concrete AuctionMarketplaceClient using fetch() with absolute URLs.
 *
 * Relative URLs fail in Node (TypeError: Failed to parse URL from /path).
 * The base URL is sourced from NEXT_PUBLIC_API_BASE_URL or defaults to
 * http://localhost:3000 so MSW intercepts in tests.
 */

import type {
  AuctionMarketplaceClient,
  MarketplaceQuery,
} from "./client";
import type { CollectionResult, Result } from "./result";
import type {
  Account,
  Auction,
  AuctionCategory,
  AutoBidState,
  Deposit,
  DirectSaleRelistOffer,
  Locale,
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

const BASE = marketplaceConfig.apiBaseUrl;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

function unwrap<D>(envelope: { readonly status: string; readonly data: D }): D {
  return envelope.data;
}

export class ApiClient implements AuctionMarketplaceClient {
  async getHomeFeed(): Promise<CollectionResult<Auction>> {
    const envelope = await fetchJson<{
      readonly status: string;
      readonly data: readonly Auction[];
    }>("/api/home-feed");
    return { status: "success", data: unwrap(envelope) };
  }

  async getCategories(): Promise<Result<readonly AuctionCategory[]>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async queryMarketplace(
    _query: MarketplaceQuery,
  ): Promise<CollectionResult<Auction>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getSearchSuggestions(
    _input: string,
  ): Promise<Result<readonly string[]>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async searchAuctions(_input: string): Promise<CollectionResult<Auction>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getAuctionDetail(_auctionId: string): Promise<Result<Auction>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async getSession(): Promise<Result<Account | null>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async requestOtpCode(_phone: PhoneNumber): Promise<Result<PhoneNumber>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async registerIndividual(
    _input: IndividualRegistration,
  ): Promise<Result<Account>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async registerCompany(_input: CompanyRegistration): Promise<Result<Account>> {
    throw new Error("Not implemented in ApiClient stub");
  }

  async completeIdentityVerification(
    _input: IdentityVerificationReturn,
  ): Promise<Result<Account>> {
    throw new Error("Not implemented in ApiClient stub");
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

  async withdrawFromAuction(
    _auctionId: string,
  ): Promise<Result<Participant>> {
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

  async getRelistOffer(_auctionId: string): Promise<Result<DirectSaleRelistOffer>> {
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

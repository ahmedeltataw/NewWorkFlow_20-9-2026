import type {
  Account,
  Auction,
  AuctionCategory,
  AuctionStatus,
  AutoBidState,
  BidSource,
  Deposit,
  DirectSaleRelistOffer,
  IdentityVerification,
  Money,
  NationalIdCalendar,
  Outcome,
  Participant,
  PhoneNumber,
  SaleType,
  Seller,
  Settlement,
  Transaction,
  Wallet,
  WithdrawalDestination,
  WithdrawalRequest,
} from "./types";
import type { CollectionResult, Result } from "./result";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequest {
  readonly method: HttpMethod;
  readonly path: string;
  readonly query?: Readonly<
    Record<string, string | readonly string[] | undefined>
  >;
  readonly body?: unknown;
}

export interface MarketplaceQuery {
  readonly query?: string;
  readonly category?: AuctionCategory;
  readonly saleType?: SaleType;
  readonly status?: AuctionStatus;
  readonly sellerKind?: Seller["kind"];
  readonly companyName?: string;
}

export interface PayDepositRequest {
  readonly auctionId: string;
  readonly accountId: string;
  readonly paymentMethodId: string;
}

export interface BidRequest {
  readonly auctionId: string;
  readonly amount: Money;
  readonly source: BidSource;
}

export interface AutoBidRequest {
  readonly auctionId: string;
  readonly maximum: Money;
  readonly increment: Money;
}

export interface WithdrawalRequestInput {
  readonly accountId: string;
  readonly amount: Money;
  readonly destination: WithdrawalDestination;
}

export interface IndividualRegistration {
  readonly phone: PhoneNumber;
  readonly nationality: "saudi" | "nonSaudi";
  readonly nationalId: string;
  readonly dateCalendar: NationalIdCalendar;
}

export interface CompanyRegistration {
  readonly phone: PhoneNumber;
  readonly companyName: string;
}

export interface IdentityVerificationReturn {
  readonly status: Extract<
    IdentityVerification,
    { readonly route: "saudiNationalVerification" }
  >["status"];
}

export type SellerDecision = "approve" | "reject";

export type AuctionPerspective = "selling" | "participating";

export interface AuctionMarketplaceClient {
  getHomeFeed(): Promise<CollectionResult<Auction>>;
  getCategories(): Promise<Result<readonly AuctionCategory[]>>;
  queryMarketplace(query: MarketplaceQuery): Promise<CollectionResult<Auction>>;
  getSearchSuggestions(input: string): Promise<Result<readonly string[]>>;
  searchAuctions(
    input: string,
    category?: AuctionCategory,
  ): Promise<CollectionResult<Auction>>;
  getAuctionDetail(auctionId: string): Promise<Result<Auction>>;

  getSession(): Promise<Result<Account | null>>;
  requestOtpCode(phone: PhoneNumber): Promise<Result<PhoneNumber>>;
  registerIndividual(input: IndividualRegistration): Promise<Result<Account>>;
  registerCompany(input: CompanyRegistration): Promise<Result<Account>>;
  completeIdentityVerification(
    input: IdentityVerificationReturn,
  ): Promise<Result<Account>>;

  getDeposit(auctionId: string, accountId: string): Promise<Result<Deposit>>;
  payDeposit(input: PayDepositRequest): Promise<Result<Deposit>>;
  placeBid(input: BidRequest): Promise<Result<Auction>>;
  saveAutoBid(input: AutoBidRequest): Promise<Result<AutoBidState>>;
  cancelAutoBid(auctionId: string): Promise<Result<AutoBidState>>;
  withdrawFromAuction(auctionId: string): Promise<Result<Participant>>;
  buyNow(auctionId: string, accountId: string): Promise<Result<Outcome>>;

  getOutcome(auctionId: string): Promise<Result<Outcome>>;
  getRelistOffer(auctionId: string): Promise<Result<DirectSaleRelistOffer>>;
  getSettlement(outcomeId: string): Promise<Result<Settlement>>;
  decideSellerOption(
    auctionId: string,
    decision: SellerDecision,
  ): Promise<Result<Outcome>>;

  getWallet(accountId: string): Promise<Result<Wallet>>;
  getTransaction(transactionId: string): Promise<Result<Transaction>>;
  requestWithdrawal(
    input: WithdrawalRequestInput,
  ): Promise<Result<WithdrawalRequest>>;

  getFavorites(accountId: string): Promise<CollectionResult<Auction>>;
  setFavorite(auctionId: string, favorited: boolean): Promise<Result<Auction>>;
  getMyAuctions(
    accountId: string,
    perspective: AuctionPerspective,
  ): Promise<CollectionResult<Auction>>;
  getProfile(accountId: string): Promise<Result<Account>>;
}

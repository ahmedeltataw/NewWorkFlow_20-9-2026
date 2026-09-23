export type IsoDateTime = string;

export type Locale = "ar" | "en";

export type CurrencyCode = "SAR" | "BHD";

export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

export type ScreenState =
  | { readonly state: "loading" }
  | { readonly state: "ready" }
  | { readonly state: "empty" }
  | { readonly state: "error"; readonly retryEligible: boolean };

export type MediaKind = "image" | "video";

export interface MediaAsset {
  readonly id: string;
  readonly kind: MediaKind;
  readonly url: string;
  readonly alt: string;
  readonly caption?: string;
  readonly sortOrder: number;
  readonly accessibilityDescription: string;
}

export type MediaGallery = readonly MediaAsset[];

export interface Specification {
  readonly label: string;
  readonly value: string;
}

export interface Feature {
  readonly text: string;
}

export interface InspectionReport {
  readonly provider: string;
  readonly grade: string;
  readonly summary: string;
  readonly assessedAt: IsoDateTime;
}

export type AuctionDetails =
  | {
      readonly category: "vehicle";
      readonly specifications: readonly Specification[];
      readonly features: readonly Feature[];
      readonly inspection: InspectionReport;
    }
  | {
      readonly category: "realEstate";
      readonly specifications: readonly Specification[];
      readonly features: readonly Feature[];
    }
  | {
      readonly category: "licensePlate";
      readonly specifications: readonly Specification[];
      readonly features: readonly Feature[];
    };

export type Seller =
  | {
      readonly id: string;
      readonly kind: "individual";
      readonly displayAsPrivateOwner: boolean;
      readonly photoUrl?: string;
    }
  | {
      readonly id: string;
      readonly kind: "company";
      readonly name: string;
      readonly logoUrl: string;
      readonly previousAuctionsPath: string;
    };

export interface AuctionLocation {
  readonly label: string;
  readonly googleMapsUrl: string;
}

export type AuctionSchedule =
  | { readonly phase: "scheduled"; readonly startsAt: IsoDateTime }
  | {
      readonly phase: "running";
      readonly startsAt: IsoDateTime;
      readonly endsAt: IsoDateTime;
    }
  | {
      readonly phase: "closed";
      readonly startsAt: IsoDateTime;
      readonly endsAt: IsoDateTime;
    };

export type DepositStatus =
  "required" | "paid" | "held" | "refunded" | "released";

export interface Deposit {
  readonly amount: Money;
  readonly status: DepositStatus;
  readonly paymentReference?: string;
}

export type BidSource = "manual" | "preset" | "automatic";

export interface BidderIdentity {
  readonly maskedName: string;
  readonly isCurrentUser: boolean;
}

export interface Bid {
  readonly id: string;
  readonly auctionId: string;
  readonly bidder: BidderIdentity;
  readonly amount: Money;
  readonly source: BidSource;
  readonly placedAt: IsoDateTime;
}

export type BidHistory = readonly Bid[];

export type AutoBidState =
  | {
      readonly state: "active";
      readonly maximum: Money;
      readonly increment: Money;
    }
  | {
      readonly state: "maximumReached";
      readonly maximum: Money;
      readonly increment: Money;
      readonly leading: boolean;
    }
  | { readonly state: "cancelled" };

export type WithdrawalEligibility = "available" | "requested" | "notEligible";

export interface Participant {
  readonly accountId: string;
  readonly auctionId: string;
  readonly deposit: Deposit;
  readonly highestBidder: boolean;
  readonly withdrawal: WithdrawalEligibility;
  readonly autoBid: AutoBidState | null;
  readonly outcome: Outcome | null;
}

export type AuctionStatus = "upcoming" | "live" | "ended" | "directSale";

export type SaleType = "bySale" | "sellerOption";

export type AuctionCategory = "vehicle" | "realEstate" | "licensePlate";

export interface AuctionBase {
  readonly id: string;
  readonly title: string;
  readonly category: AuctionCategory;
  readonly openingPrice: Money;
  readonly reservePrice?: Money;
  readonly buyNowPrice?: Money;
  readonly gallery: MediaGallery;
  readonly location: AuctionLocation;
  readonly seller: Seller;
  readonly details: AuctionDetails;
  readonly createdAt: IsoDateTime;
}

export interface UpcomingAuction extends AuctionBase {
  readonly status: "upcoming";
  readonly saleType: SaleType;
  readonly bidderDeposit: Money;
  readonly schedule: Extract<AuctionSchedule, { readonly phase: "scheduled" }>;
}

export interface LiveAuction extends AuctionBase {
  readonly status: "live";
  readonly saleType: SaleType;
  readonly bidderDeposit: Money;
  readonly schedule: Extract<AuctionSchedule, { readonly phase: "running" }>;
  readonly currentPrice: Money;
  readonly highestBidder: BidderIdentity | null;
  readonly bidHistory: BidHistory;
}

export interface EndedAuction extends AuctionBase {
  readonly status: "ended";
  readonly saleType: SaleType;
  readonly bidderDeposit: Money;
  readonly schedule: Extract<AuctionSchedule, { readonly phase: "closed" }>;
  readonly finalPrice: Money;
  readonly outcome: Outcome | null;
}

export type DirectSaleTransferStatus = "pendingConfirmation" | "confirmed";

export interface DirectSaleAuction extends AuctionBase {
  readonly status: "directSale";
  readonly buyNowPrice: Money;
  readonly transferStatus: DirectSaleTransferStatus;
}

export type Auction =
  UpcomingAuction | LiveAuction | EndedAuction | DirectSaleAuction;

export interface PhoneNumber {
  readonly countryCode: string;
  readonly nationalNumber: string;
}

export type NationalIdCalendar = "hijri" | "gregorian";

export interface DateOfBirth {
  readonly day: number;
  readonly month: number;
  readonly year: number;
}

export type IdentityVerification =
  | {
      readonly route: "saudiNationalVerification";
      readonly status:
        "pending" | "redirected" | "success" | "failure" | "abandoned";
    }
  | { readonly route: "manual"; readonly status: "verified" };

export interface AccountBase {
  readonly id: string;
  readonly phone: PhoneNumber;
}

export interface IndividualAccount extends AccountBase {
  readonly type: "individual";
  readonly nationality: "saudi" | "nonSaudi";
  readonly nationalId?: string;
  readonly dateCalendar: NationalIdCalendar;
  readonly dateOfBirth?: DateOfBirth;
  readonly verification: IdentityVerification;
}

export type CompanyReviewState = "submitted" | "underReview" | "activated";

export interface CompanyAccount extends AccountBase {
  readonly type: "company";
  readonly companyName: string;
  readonly review: CompanyReviewState;
}

export type Account = IndividualAccount | CompanyAccount;

export type DepositTreatment = "held" | "refunded" | "released" | "credited";

export type OutcomePerspective = "buyer" | "seller";

interface OutcomeBase {
  readonly auctionId: string;
  readonly endedAt: IsoDateTime;
}

export interface BySaleWinOutcome extends OutcomeBase {
  readonly saleType: "bySale";
  readonly type: "won";
  readonly perspective: "buyer";
  readonly amountOwed: Money;
  readonly commission: Money;
  readonly paymentDeadline: IsoDateTime;
  readonly deposit: DepositTreatment;
}

export interface BySaleNonWinningOutcome extends OutcomeBase {
  readonly saleType: "bySale";
  readonly type: "ended";
  readonly perspective: "buyer";
  readonly deposit: "refunded";
}

export interface BelowReserveOutcome extends OutcomeBase {
  readonly saleType: "bySale";
  readonly type: "belowReserve";
  readonly perspective: "buyer" | "seller";
  readonly leadingBidAmount?: Money;
  readonly deposit: DepositTreatment;
}

export interface DirectSaleRelistOffer {
  readonly editableBuyNowPrice: Money;
  readonly validUntil: IsoDateTime;
}

export interface UnpaidWinnerRelistOutcome extends OutcomeBase {
  readonly saleType: "bySale";
  readonly type: "unpaidRelistOffer";
  readonly perspective: "seller";
  readonly relist: DirectSaleRelistOffer;
}

export interface SellerOptionPendingOutcome extends OutcomeBase {
  readonly saleType: "sellerOption";
  readonly type: "awaitingSellerDecision";
  readonly perspective: "buyer";
}

export interface SellerOptionApprovedOutcome extends OutcomeBase {
  readonly saleType: "sellerOption";
  readonly type: "sellerApproved";
  readonly perspective: "buyer";
  readonly amountOwed: Money;
  readonly commission: Money;
  readonly vat: Money;
  readonly paymentDeadline: IsoDateTime;
  readonly deposit: DepositTreatment;
}

export interface SellerOptionRejectedOutcome extends OutcomeBase {
  readonly saleType: "sellerOption";
  readonly type: "sellerRejected";
  readonly perspective: "buyer";
  readonly commission: Money;
  readonly deposit: "refunded";
}

export type Outcome =
  | BySaleWinOutcome
  | BySaleNonWinningOutcome
  | BelowReserveOutcome
  | UnpaidWinnerRelistOutcome
  | SellerOptionPendingOutcome
  | SellerOptionApprovedOutcome
  | SellerOptionRejectedOutcome;

export interface TransferEntry {
  readonly id: string;
  readonly amount: Money;
  readonly paidAt: IsoDateTime;
}

export type SettlementStatus =
  "inProgress" | "pendingConfirmation" | "fullySettled";

export interface Settlement {
  readonly outcomeId: string;
  readonly amountPaid: Money;
  readonly amountOutstanding: Money;
  readonly transfers: readonly TransferEntry[];
  readonly status: SettlementStatus;
}

export type BalanceVisibility = "masked" | "revealed";

export type TransactionStatus = "pending" | "completed" | "failed";

export type TransactionType =
  | "deposit"
  | "depositRefund"
  | "depositRelease"
  | "settlement"
  | "withdrawal"
  | "commission"
  | "vat";

export interface Transaction {
  readonly id: string;
  readonly type: TransactionType;
  readonly amount: Money;
  readonly reference: string;
  readonly date: IsoDateTime;
  readonly status: TransactionStatus;
}

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export type WithdrawalDestination =
  | { readonly kind: "configuredBank"; readonly bankId: string }
  | { readonly kind: "international" };

export interface WithdrawalRequest {
  readonly id: string;
  readonly destination: WithdrawalDestination;
  readonly amount: Money;
  readonly status: WithdrawalStatus;
  readonly requestedAt: IsoDateTime;
}

export interface Wallet {
  readonly accountId: string;
  readonly availableBalance: Money;
  readonly balanceVisibility: BalanceVisibility;
  readonly transactions: readonly Transaction[];
  readonly withdrawals: readonly WithdrawalRequest[];
}

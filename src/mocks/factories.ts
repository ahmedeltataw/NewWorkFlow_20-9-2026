/**
 * T020 deterministic fixture factories for the auction marketplace data model.
 *
 * Pure data only: no MSW, no network access, no React. Every factory returns a
 * canonical object typed by `src/lib/api/types` and produces identical values
 * on every call unless an explicit per-call override is supplied, so tests are
 * reproducible and no random values can leak into assertions. Arabic is the
 * primary ordinal locale; pass `{ locale: "en" }` to a copy-bearing factory for
 * the matching English display text.
 *
 * Coverage intent (data-model.md fixture-coverage matrix):
 * - all four auction statuses x all three categories x individual/company seller
 * - both sale types on every non-direct-sale status
 * - participant deposit/withdrawal/auto-bid/highest-bidder/outcome states
 * - every account verification and company-review state
 * - every outcome variant and settlement transfer state
 * - transaction type x status, withdrawal destination x status, wallet states
 */

import type {
  Account,
  Auction,
  AuctionBase,
  AuctionCategory,
  AuctionDetails,
  AuctionLocation,
  AuctionStatus,
  AutoBidState,
  BalanceVisibility,
  BelowReserveOutcome,
  Bid,
  BidderIdentity,
  BidHistory,
  BidSource,
  BySaleNonWinningOutcome,
  BySaleWinOutcome,
  CompanyAccount,
  CurrencyCode,
  Deposit,
  DepositStatus,
  DepositTreatment,
  DirectSaleAuction,
  DirectSaleRelistOffer,
  DirectSaleTransferStatus,
  EndedAuction,
  Feature,
  IdentityVerification,
  IndividualAccount,
  InspectionReport,
  IsoDateTime,
  LiveAuction,
  Locale,
  MediaAsset,
  MediaGallery,
  MediaKind,
  Money,
  NationalIdCalendar,
  Outcome,
  OutcomePerspective,
  Participant,
  PhoneNumber,
  SaleType,
  ScreenState,
  Seller,
  SellerOptionApprovedOutcome,
  SellerOptionPendingOutcome,
  SellerOptionRejectedOutcome,
  Settlement,
  SettlementStatus,
  Specification,
  Transaction,
  TransactionStatus,
  TransactionType,
  TransferEntry,
  UnpaidWinnerRelistOutcome,
  UpcomingAuction,
  Wallet,
  WithdrawalDestination,
  WithdrawalEligibility,
  WithdrawalRequest,
  WithdrawalStatus,
} from "../lib/api/types";
import {
  banks,
  feeDefaults,
  paymentWindowHours,
  relistDefaults,
} from "../config/marketplace";

export const DEFAULT_LOCALE: Locale = "ar";

/** Fixed wall-clock anchors so every factory default is deterministic. */
export const fixtureTimes = {
  now: "2026-09-20T08:00:00.000Z",
  upcomingStartsAt: "2026-09-24T09:00:00.000Z",
  liveStartsAt: "2026-09-20T07:00:00.000Z",
  liveEndsAt: "2026-09-20T12:00:00.000Z",
  endedStartsAt: "2026-09-18T07:00:00.000Z",
  endedEndsAt: "2026-09-18T12:00:00.000Z",
} as const;

/** Deterministic date arithmetic over ISO strings; `offsetMinutes` may be negative. */
export function addMinutes(
  iso: IsoDateTime,
  offsetMinutes: number,
): IsoDateTime {
  const millis = offsetMinutes * 60 * 1000;
  return new Date(new Date(iso).getTime() + millis).toISOString();
}

export function addHours(iso: IsoDateTime, hours: number): IsoDateTime {
  return addMinutes(iso, hours * 60);
}

export function addDays(iso: IsoDateTime, days: number): IsoDateTime {
  return addMinutes(iso, days * 24 * 60);
}

/** Orderable value-space lists consumed by the coverage matrices. */
export const auctionStatuses: readonly AuctionStatus[] = [
  "upcoming",
  "live",
  "ended",
  "directSale",
];

export const saleTypes: readonly SaleType[] = ["bySale", "sellerOption"];

export const auctionCategories: readonly AuctionCategory[] = [
  "vehicle",
  "realEstate",
  "licensePlate",
];

const depositStatuses: readonly DepositStatus[] = [
  "required",
  "paid",
  "held",
  "refunded",
  "released",
];

const transactionTypes: readonly TransactionType[] = [
  "deposit",
  "depositRefund",
  "depositRelease",
  "settlement",
  "withdrawal",
  "commission",
  "vat",
];

const transactionStatuses: readonly TransactionStatus[] = [
  "pending",
  "completed",
  "failed",
];

const withdrawalStatuses: readonly WithdrawalStatus[] = [
  "pending",
  "approved",
  "rejected",
];

const auctionOutcomeTypes: readonly Outcome["type"][] = [
  "won",
  "ended",
  "belowReserve",
  "unpaidRelistOffer",
  "awaitingSellerDecision",
  "sellerApproved",
  "sellerRejected",
];

const identityVerificationStatuses: readonly Extract<
  IdentityVerification,
  { readonly route: "saudiNationalVerification" }
>["status"][] = ["pending", "redirected", "success", "failure", "abandoned"];

type CopyPair = Readonly<{ ar: string; en: string }>;

const copy = (ar: string, en: string): CopyPair => ({ ar, en });

function localized(locale: Locale, pair: CopyPair): string {
  return pair[locale];
}

/** Category-scoped real-estate default spend, in whole units of currency. */
interface CategoryDefaults {
  readonly opening: number;
  readonly reserve: number;
  readonly buyNow: number;
  readonly final: number;
  readonly stepMinor: number;
}

const categoryDefaults: Readonly<Record<AuctionCategory, CategoryDefaults>> = {
  vehicle: {
    opening: 60000,
    reserve: 65000,
    buyNow: 72000,
    final: 66000,
    stepMinor: 50000,
  },
  realEstate: {
    opening: 650000,
    reserve: 680000,
    buyNow: 720000,
    final: 690000,
    stepMinor: 500000,
  },
  licensePlate: {
    opening: 200000,
    reserve: 220000,
    buyNow: 300000,
    final: 250000,
    stepMinor: 100000,
  },
};

const categoryCopy: Readonly<
  Record<AuctionCategory, Readonly<{ title: CopyPair; location: CopyPair }>>
> = {
  vehicle: {
    title: copy("تويوتا لاند كروزر GXR 2021", "Toyota Land Cruiser GXR 2021"),
    location: copy("الرياض، طريق الملك فهد", "Riyadh, King Fahd Road"),
  },
  realEstate: {
    title: copy("فيلا فاخرة في حي الياسمين", "Luxury Villa in Al Yasmin"),
    location: copy("الرياض، حي الياسمين", "Riyadh, Al Yasmin District"),
  },
  licensePlate: {
    title: copy("لوحة مميزة 1234", "Special Plate 1234"),
    location: copy("المملكة العربية السعودية", "Kingdom of Saudi Arabia"),
  },
};

const vehicleCopy = {
  specModel: copy("الموديل", "Model"),
  specYear: copy("سنة الصنع", "Year"),
  specMileage: copy("الممشى", "Mileage"),
  specTransmission: copy("ناقل الحركة", "Transmission"),
  specFuel: copy("الوقود", "Fuel"),
  value2021: copy("2021", "2021"),
  value85000Km: copy("85,000 كم", "85,000 km"),
  valueAutomatic: copy("أوتوماتيك", "Automatic"),
  valuePetrol: copy("بنزين", "Petrol"),
  featureCamera: copy("نظام كاميرات 360 درجة", "360-degree camera system"),
  featureSeats: copy("مقاعد جلدية مبردة", "Ventilated leather seats"),
  inspectionProvider: copy(
    "الشركة الوطنية لفحص المركبات",
    "National Vehicle Inspection Co.",
  ),
  inspectionGrade: copy("A+", "A+"),
  inspectionSummary: copy(
    "حالة ممتازة بدون حوادث سابقة",
    "Excellent condition, no accidents on record",
  ),
} as const;

const realEstateCopy = {
  specArea: copy("المساحة", "Area"),
  specBedrooms: copy("الغرف", "Bedrooms"),
  specFloors: copy("الطوابق", "Floors"),
  value450sqm: copy("450 م²", "450 m²"),
  value5: copy("5", "5"),
  value2: copy("2", "2"),
  featurePool: copy("مسبح خاص", "Private swimming pool"),
  featureSmartHome: copy("نظام المنزل الذكي", "Smart home system"),
} as const;

const licensePlateCopy = {
  specPlateType: copy("نوع اللوحة", "Plate type"),
  specPattern: copy("التنسيق", "Pattern"),
  valueSpecial: copy("مميزة", "Special"),
  value1234: copy("1234", "1234"),
  featureRenewal: copy("تجديد سنوي متضمن", "Annual renewal included"),
  featureTransfer: copy("تحويل ملكية فوري", "Instant ownership transfer"),
} as const;

const companyCopy = {
  primary: copy("شركة المزادات الدولية", "International Auction House Co."),
  realEstate: copy(
    "مُلك وإعمار للتطوير العقاري",
    "Umran Real Estate Development",
  ),
} as const;

const mediaImageAlt = (title: CopyPair, index: number): CopyPair =>
  copy(`صورة ${index} - ${title.ar}`, `Image ${index} - ${title.en}`);

const mediaVideoAlt = (title: CopyPair): CopyPair =>
  copy(`فيديو - ${title.ar}`, `Video - ${title.en}`);

const mediaAccessibility = (kind: MediaKind, title: CopyPair): CopyPair =>
  kind === "video"
    ? copy(`فيديو تعريفي لـ ${title.ar}`, `Overview video of ${title.en}`)
    : copy(`صورة لـ ${title.ar}`, `Photo of ${title.en}`);

const bidderMasked = (index: number): CopyPair =>
  copy(`مزايد ${index}`, `Bidder ${index}`);

function percentOfMinor(minor: number, percent: number): number {
  return Math.round((minor * percent) / 100);
}

/**
 * Money helpers — amounts are integer minor units (halala/fils) plus a
 * currency code, exactly as `Money` requires.
 */
export function createMoney(
  amountMinor: number,
  currency: CurrencyCode = "SAR",
): Money {
  return { amountMinor, currency };
}

export function moneyFromMajor(
  amountMajor: number,
  currency: CurrencyCode = "SAR",
): Money {
  return createMoney(Math.round(amountMajor * 100), currency);
}

export interface DepositOverrides {
  readonly amount?: Money;
  readonly status?: DepositStatus;
  readonly paymentReference?: string;
}

/** Deposit factory; payment references appear only once a deposit is in motion. */
export function createDeposit(overrides: DepositOverrides = {}): Deposit {
  const status = overrides.status ?? "paid";
  const reference =
    overrides.paymentReference !== undefined
      ? overrides.paymentReference
      : status === "required" || status === "refunded"
        ? undefined
        : "PAY-0001-2026";
  return {
    amount: overrides.amount ?? moneyFromMajor(2000),
    status,
    ...(reference ? { paymentReference: reference } : {}),
  };
}

export interface MediaAssetOverrides {
  readonly id?: string;
  readonly kind?: MediaKind;
  readonly url?: string;
  readonly alt?: string;
  readonly caption?: string;
  readonly sortOrder?: number;
  readonly accessibilityDescription?: string;
}

export function createMediaAsset(
  overrides: MediaAssetOverrides = {},
): MediaAsset {
  const kind = overrides.kind ?? "image";
  return {
    id: overrides.id ?? `media-${kind}-001`,
    kind,
    url: overrides.url ?? `/media/fixtures/${kind}-1.jpg`,
    alt: overrides.alt ?? "fixture media",
    caption: overrides.caption,
    sortOrder: overrides.sortOrder ?? 1,
    accessibilityDescription:
      overrides.accessibilityDescription ?? "fixture media",
  };
}

export interface MediaGalleryOptions {
  readonly locale?: Locale;
  readonly subject?: CopyPair;
  readonly imageCount?: number;
  readonly includeVideo?: boolean;
}

/** Gallery factory meeting the FR-031 rule: at least four images and one video. */
export function createMediaGallery(
  options: MediaGalleryOptions = {},
): MediaGallery {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const subject = options.subject ?? copy("السلعة", "the item");
  const imageCount = options.imageCount ?? 4;
  const videos = (options.includeVideo ?? true) ? 1 : 0;
  const assets: MediaAsset[] = [];
  for (let index = 0; index < imageCount; index += 1) {
    assets.push(
      createMediaAsset({
        id: `media-image-${index + 1}`,
        kind: "image",
        url: `/media/fixtures/gallery-${index + 1}.jpg`,
        sortOrder: index + 1,
        alt: localized(locale, mediaImageAlt(subject, index + 1)),
        caption: localized(locale, mediaImageAlt(subject, index + 1)),
        accessibilityDescription: localized(
          locale,
          mediaAccessibility("image", subject),
        ),
      }),
    );
  }
  for (let index = 0; index < videos; index += 1) {
    assets.push(
      createMediaAsset({
        id: `media-video-${index + 1}`,
        kind: "video",
        url: `/media/fixtures/gallery-video-${index + 1}.mp4`,
        sortOrder: imageCount + index + 1,
        alt: localized(locale, mediaVideoAlt(subject)),
        caption: localized(locale, mediaVideoAlt(subject)),
        accessibilityDescription: localized(
          locale,
          mediaAccessibility("video", subject),
        ),
      }),
    );
  }
  return assets;
}

export interface SpecificationOverrides {
  readonly label?: string;
  readonly value?: string;
}

export function createSpecification(
  overrides: SpecificationOverrides = {},
): Specification {
  return {
    label: overrides.label ?? "specification",
    value: overrides.value ?? "value",
  };
}

export interface FeatureOverrides {
  readonly text?: string;
}

export function createFeature(overrides: FeatureOverrides = {}): Feature {
  return { text: overrides.text ?? "feature" };
}

export interface InspectionReportOverrides {
  readonly provider?: string;
  readonly grade?: string;
  readonly summary?: string;
  readonly assessedAt?: IsoDateTime;
}

export function createInspectionReport(
  overrides: InspectionReportOverrides = {},
): InspectionReport {
  const locale = DEFAULT_LOCALE;
  return {
    provider:
      overrides.provider ?? localized(locale, vehicleCopy.inspectionProvider),
    grade: overrides.grade ?? localized(locale, vehicleCopy.inspectionGrade),
    summary:
      overrides.summary ?? localized(locale, vehicleCopy.inspectionSummary),
    assessedAt: overrides.assessedAt ?? fixtureTimes.now,
  };
}

export interface AuctionDetailsOverrides {
  readonly locale?: Locale;
  readonly specifications?: readonly Specification[];
  readonly features?: readonly Feature[];
  readonly inspection?: InspectionReport;
}

function createSpecs(
  entries: ReadonlyArray<Readonly<{ label: CopyPair; value: CopyPair }>>,
  locale: Locale,
): readonly Specification[] {
  return entries.map((entry) =>
    createSpecification({
      label: localized(locale, entry.label),
      value: localized(locale, entry.value),
    }),
  );
}

const vehicleSpecEntries: ReadonlyArray<{
  readonly label: CopyPair;
  readonly value: CopyPair;
}> = [
  { label: vehicleCopy.specModel, value: vehicleCopy.value2021 },
  { label: vehicleCopy.specYear, value: vehicleCopy.value2021 },
  { label: vehicleCopy.specMileage, value: vehicleCopy.value85000Km },
  {
    label: vehicleCopy.specTransmission,
    value: vehicleCopy.valueAutomatic,
  },
  { label: vehicleCopy.specFuel, value: vehicleCopy.valuePetrol },
];

const realEstateSpecEntries: ReadonlyArray<{
  readonly label: CopyPair;
  readonly value: CopyPair;
}> = [
  { label: realEstateCopy.specArea, value: realEstateCopy.value450sqm },
  { label: realEstateCopy.specBedrooms, value: realEstateCopy.value5 },
  { label: realEstateCopy.specFloors, value: realEstateCopy.value2 },
];

const licensePlateSpecEntries: ReadonlyArray<{
  readonly label: CopyPair;
  readonly value: CopyPair;
}> = [
  {
    label: licensePlateCopy.specPlateType,
    value: licensePlateCopy.valueSpecial,
  },
  {
    label: licensePlateCopy.specPattern,
    value: licensePlateCopy.value1234,
  },
];

/** Vehicle auctions carry an inspection report; other categories do not. */
export function createVehicleDetails(
  overrides: AuctionDetailsOverrides = {},
): Extract<AuctionDetails, { readonly category: "vehicle" }> {
  const locale = overrides.locale ?? DEFAULT_LOCALE;
  return {
    category: "vehicle",
    specifications:
      overrides.specifications ?? createSpecs(vehicleSpecEntries, locale),
    features: overrides.features ?? [
      createFeature({ text: localized(locale, vehicleCopy.featureCamera) }),
      createFeature({ text: localized(locale, vehicleCopy.featureSeats) }),
    ],
    inspection: overrides.inspection ?? createInspectionReport(),
  };
}

export function createRealEstateDetails(
  overrides: AuctionDetailsOverrides = {},
): Extract<AuctionDetails, { readonly category: "realEstate" }> {
  const locale = overrides.locale ?? DEFAULT_LOCALE;
  return {
    category: "realEstate",
    specifications:
      overrides.specifications ?? createSpecs(realEstateSpecEntries, locale),
    features: overrides.features ?? [
      createFeature({ text: localized(locale, realEstateCopy.featurePool) }),
      createFeature({
        text: localized(locale, realEstateCopy.featureSmartHome),
      }),
    ],
  };
}

export function createLicensePlateDetails(
  overrides: AuctionDetailsOverrides = {},
): Extract<AuctionDetails, { readonly category: "licensePlate" }> {
  const locale = overrides.locale ?? DEFAULT_LOCALE;
  return {
    category: "licensePlate",
    specifications:
      overrides.specifications ?? createSpecs(licensePlateSpecEntries, locale),
    features: overrides.features ?? [
      createFeature({
        text: localized(locale, licensePlateCopy.featureRenewal),
      }),
      createFeature({
        text: localized(locale, licensePlateCopy.featureTransfer),
      }),
    ],
  };
}

export function createAuctionDetails(
  category: AuctionCategory = "vehicle",
  overrides: AuctionDetailsOverrides = {},
): AuctionDetails {
  switch (category) {
    case "vehicle":
      return createVehicleDetails(overrides);
    case "realEstate":
      return createRealEstateDetails(overrides);
    case "licensePlate":
      return createLicensePlateDetails(overrides);
  }
}

export interface AuctionLocationOverrides {
  readonly locale?: Locale;
  readonly label?: string;
  readonly googleMapsUrl?: string;
}

export function createLocation(
  overrides: AuctionLocationOverrides = {},
): AuctionLocation {
  const locale = overrides.locale ?? DEFAULT_LOCALE;
  return {
    label: overrides.label ?? localized(locale, categoryCopy.vehicle.location),
    googleMapsUrl:
      overrides.googleMapsUrl ??
      "https://www.google.com/maps?q=24.7136,46.6753",
  };
}

export interface IndividualSellerOverrides {
  readonly locale?: Locale;
  readonly id?: string;
  readonly displayAsPrivateOwner?: boolean;
  readonly photoUrl?: string;
}

export function createIndividualSeller(
  overrides: IndividualSellerOverrides = {},
): Extract<Seller, { readonly kind: "individual" }> {
  return {
    id: overrides.id ?? "seller-individual-001",
    kind: "individual",
    displayAsPrivateOwner: overrides.displayAsPrivateOwner ?? true,
    ...(overrides.photoUrl !== undefined
      ? { photoUrl: overrides.photoUrl }
      : {}),
  };
}

export interface CompanySellerOverrides {
  readonly locale?: Locale;
  readonly id?: string;
  readonly name?: string;
  readonly logoUrl?: string;
  readonly previousAuctionsPath?: string;
}

export function createCompanySeller(
  overrides: CompanySellerOverrides = {},
): Extract<Seller, { readonly kind: "company" }> {
  const locale = overrides.locale ?? DEFAULT_LOCALE;
  return {
    id: overrides.id ?? "seller-company-001",
    kind: "company",
    name: overrides.name ?? localized(locale, companyCopy.primary),
    logoUrl: overrides.logoUrl ?? "/media/fixtures/logo-company-1.png",
    previousAuctionsPath:
      overrides.previousAuctionsPath ??
      "/auctions?type=vehicle&sellerType=companies",
  };
}

export function createSeller(
  kind: Seller["kind"],
  overrides: IndividualSellerOverrides | CompanySellerOverrides = {},
): Seller {
  return kind === "company"
    ? createCompanySeller(overrides as CompanySellerOverrides)
    : createIndividualSeller(overrides as IndividualSellerOverrides);
}

export interface BidderIdentityOverrides {
  readonly locale?: Locale;
  readonly maskedName?: string;
  readonly isCurrentUser?: boolean;
}

export function createBidderIdentity(
  overrides: BidderIdentityOverrides = {},
): BidderIdentity {
  const locale = overrides.locale ?? DEFAULT_LOCALE;
  return {
    maskedName: overrides.maskedName ?? localized(locale, bidderMasked(1)),
    isCurrentUser: overrides.isCurrentUser ?? false,
  };
}

export interface BidOverrides {
  readonly locale?: Locale;
  readonly id?: string;
  readonly auctionId?: string;
  readonly bidder?: BidderIdentity;
  readonly amount?: Money;
  readonly source?: BidSource;
  readonly placedAt?: IsoDateTime;
}

export function createBid(overrides: BidOverrides = {}): Bid {
  return {
    id: overrides.id ?? "bid-001",
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    bidder:
      overrides.bidder ?? createBidderIdentity({ locale: DEFAULT_LOCALE }),
    amount:
      overrides.amount ?? moneyFromMajor(categoryDefaults.vehicle.opening),
    source: overrides.source ?? "manual",
    placedAt: overrides.placedAt ?? fixtureTimes.liveStartsAt,
  };
}

export interface BidHistoryOptions {
  readonly locale?: Locale;
  readonly auctionId?: string;
  readonly count?: number;
  readonly basePriceMinor?: number;
  readonly stepMinor?: number;
}

/** Ascending, deterministic bid history; defaults keep the final bid highest. */
export function createBidHistory(options: BidHistoryOptions = {}): BidHistory {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const auctionId = options.auctionId ?? "fx-vehicle-auction-1";
  const count = options.count ?? 4;
  const baseMinor =
    options.basePriceMinor ??
    moneyFromMajor(categoryDefaults.vehicle.opening).amountMinor;
  const stepMinor = options.stepMinor ?? categoryDefaults.vehicle.stepMinor;
  const baseTime = fixtureTimes.liveEndsAt;
  return Array.from({ length: count }, (_, index) =>
    createBid({
      locale,
      auctionId,
      id: `bid-history-${index + 1}`,
      placedAt: addMinutes(baseTime, (index - count) * 3),
      amount: createMoney(baseMinor + (index + 1) * stepMinor, "SAR"),
      source: "manual",
      bidder: createBidderIdentity({
        locale,
        maskedName: localized(locale, bidderMasked(index + 2)),
        isCurrentUser: index === count - 1,
      }),
    }),
  );
}

export interface AutoBidOverrides {
  readonly state?: AutoBidState["state"];
  readonly maximum?: Money;
  readonly increment?: Money;
  readonly leading?: boolean;
}

export function createAutoBidState(
  overrides: AutoBidOverrides = {},
): AutoBidState {
  const maximum = overrides.maximum ?? moneyFromMajor(70000);
  const increment = overrides.increment ?? moneyFromMajor(500);
  switch (overrides.state ?? "active") {
    case "active":
      return { state: "active", maximum, increment };
    case "maximumReached":
      return {
        state: "maximumReached",
        maximum,
        increment,
        leading: overrides.leading ?? false,
      };
    case "cancelled":
      return { state: "cancelled" };
  }
}

export interface AuctionBaseOverrides {
  readonly locale?: Locale;
  readonly id?: string;
  readonly title?: string;
  readonly category?: AuctionCategory;
  readonly openingPrice?: Money;
  readonly reservePrice?: Money;
  readonly buyNowPrice?: Money;
  readonly gallery?: MediaGallery;
  readonly location?: AuctionLocation;
  readonly seller?: Seller;
  readonly details?: AuctionDetails;
  readonly createdAt?: IsoDateTime;
}

function createAuctionBase(overrides: AuctionBaseOverrides = {}): AuctionBase {
  const locale = overrides.locale ?? DEFAULT_LOCALE;
  const category = overrides.category ?? "vehicle";
  const subject = categoryCopy[category];
  const title = overrides.title ?? localized(locale, subject.title);
  const defaults = categoryDefaults[category];
  return {
    id: overrides.id ?? `fx-${category}-auction-1`,
    title,
    category,
    openingPrice: overrides.openingPrice ?? moneyFromMajor(defaults.opening),
    reservePrice: overrides.reservePrice ?? moneyFromMajor(defaults.reserve),
    buyNowPrice: overrides.buyNowPrice ?? moneyFromMajor(defaults.buyNow),
    gallery:
      overrides.gallery ??
      createMediaGallery({ locale, subject: subject.title }),
    location:
      overrides.location ??
      createLocation({
        locale,
        label: localized(locale, subject.location),
      }),
    seller: overrides.seller ?? createCompanySeller({ locale }),
    details: overrides.details ?? createAuctionDetails(category, { locale }),
    createdAt: overrides.createdAt ?? fixtureTimes.now,
  };
}

export interface UpcomingAuctionOverrides extends AuctionBaseOverrides {
  readonly saleType?: SaleType;
  readonly bidderDeposit?: Money;
  readonly schedule?: UpcomingAuction["schedule"];
}

export function createUpcomingAuction(
  overrides: UpcomingAuctionOverrides = {},
): UpcomingAuction {
  const { saleType, bidderDeposit, schedule, ...baseOverrides } = overrides;
  const base = createAuctionBase(baseOverrides);
  return {
    ...base,
    status: "upcoming",
    saleType: saleType ?? "bySale",
    bidderDeposit: bidderDeposit ?? moneyFromMajor(2000),
    schedule: schedule ?? {
      phase: "scheduled",
      startsAt: fixtureTimes.upcomingStartsAt,
    },
  };
}

export interface LiveAuctionOverrides extends AuctionBaseOverrides {
  readonly saleType?: SaleType;
  readonly bidderDeposit?: Money;
  readonly schedule?: LiveAuction["schedule"];
  readonly currentPrice?: Money;
  readonly highestBidder?: BidderIdentity | null;
  readonly bidHistory?: BidHistory;
}

export function createLiveAuction(
  overrides: LiveAuctionOverrides = {},
): LiveAuction {
  const {
    saleType,
    bidderDeposit,
    schedule,
    currentPrice,
    highestBidder,
    bidHistory,
    ...baseOverrides
  } = overrides;
  const base = createAuctionBase(baseOverrides);
  return {
    ...base,
    status: "live",
    saleType: saleType ?? "bySale",
    bidderDeposit: bidderDeposit ?? moneyFromMajor(2000),
    schedule: schedule ?? {
      phase: "running",
      startsAt: fixtureTimes.liveStartsAt,
      endsAt: fixtureTimes.liveEndsAt,
    },
    currentPrice: currentPrice ?? base.openingPrice,
    highestBidder: highestBidder ?? null,
    bidHistory: bidHistory ?? [],
  };
}

export interface EndedAuctionOverrides extends AuctionBaseOverrides {
  readonly saleType?: SaleType;
  readonly bidderDeposit?: Money;
  readonly schedule?: EndedAuction["schedule"];
  readonly finalPrice?: Money;
  readonly outcome?: Outcome | null;
}

export function createEndedAuction(
  overrides: EndedAuctionOverrides = {},
): EndedAuction {
  const {
    saleType,
    bidderDeposit,
    schedule,
    finalPrice,
    outcome,
    ...baseOverrides
  } = overrides;
  const base = createAuctionBase(baseOverrides);
  return {
    ...base,
    status: "ended",
    saleType: saleType ?? "bySale",
    bidderDeposit: bidderDeposit ?? moneyFromMajor(2000),
    schedule: schedule ?? {
      phase: "closed",
      startsAt: fixtureTimes.endedStartsAt,
      endsAt: fixtureTimes.endedEndsAt,
    },
    finalPrice:
      finalPrice ?? moneyFromMajor(categoryDefaults[base.category].final),
    outcome: outcome ?? null,
  };
}

export interface DirectSaleAuctionOverrides extends AuctionBaseOverrides {
  readonly buyNowPrice?: Money;
  readonly transferStatus?: DirectSaleTransferStatus;
}

export function createDirectSaleAuction(
  overrides: DirectSaleAuctionOverrides = {},
): DirectSaleAuction {
  const { buyNowPrice, transferStatus, ...baseOverrides } = overrides;
  const base = createAuctionBase(baseOverrides);
  return {
    ...base,
    status: "directSale",
    buyNowPrice: buyNowPrice ?? base.buyNowPrice ?? moneyFromMajor(72000),
    transferStatus: transferStatus ?? "pendingConfirmation",
  };
}

export type AuctionOverrides =
  | UpcomingAuctionOverrides
  | LiveAuctionOverrides
  | EndedAuctionOverrides
  | DirectSaleAuctionOverrides;

export function createAuction(
  status: AuctionStatus = "live",
  overrides: AuctionOverrides = {},
): Auction {
  switch (status) {
    case "upcoming":
      return createUpcomingAuction(overrides as UpcomingAuctionOverrides);
    case "live":
      return createLiveAuction(overrides as LiveAuctionOverrides);
    case "ended":
      return createEndedAuction(overrides as EndedAuctionOverrides);
    case "directSale":
      return createDirectSaleAuction(overrides as DirectSaleAuctionOverrides);
  }
}

export interface OutcomeOverrides {
  readonly auctionId?: string;
  readonly endedAt?: IsoDateTime;
  readonly saleType?: SaleType;
  readonly type?: Outcome["type"];
  readonly perspective?: OutcomePerspective;
  readonly amountOwed?: Money;
  readonly commission?: Money;
  readonly vat?: Money;
  readonly paymentDeadline?: IsoDateTime;
  readonly deposit?: DepositTreatment;
  readonly leadingBidAmount?: Money;
  readonly relist?: DirectSaleRelistOffer;
}

export function createBySaleWinOutcome(
  overrides: OutcomeOverrides = {},
): BySaleWinOutcome {
  const endedAt = overrides.endedAt ?? fixtureTimes.endedEndsAt;
  const amountOwed =
    overrides.amountOwed ?? moneyFromMajor(categoryDefaults.vehicle.final);
  const commission =
    overrides.commission ??
    createMoney(
      percentOfMinor(amountOwed.amountMinor, feeDefaults.commissionPercent),
      amountOwed.currency,
    );
  return {
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    endedAt,
    saleType: "bySale",
    type: "won",
    perspective: "buyer",
    amountOwed,
    commission,
    paymentDeadline:
      overrides.paymentDeadline ?? addHours(endedAt, paymentWindowHours),
    deposit: overrides.deposit ?? "credited",
  };
}

export function createBySaleNonWinningOutcome(
  overrides: OutcomeOverrides = {},
): BySaleNonWinningOutcome {
  return {
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    endedAt: overrides.endedAt ?? fixtureTimes.endedEndsAt,
    saleType: "bySale",
    type: "ended",
    perspective: "buyer",
    deposit: "refunded",
  };
}

export function createBelowReserveOutcome(
  overrides: OutcomeOverrides = {},
): BelowReserveOutcome {
  const perspective = overrides.perspective ?? "buyer";
  return {
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    endedAt: overrides.endedAt ?? fixtureTimes.endedEndsAt,
    saleType: "bySale",
    type: "belowReserve",
    perspective,
    leadingBidAmount:
      overrides.leadingBidAmount ??
      createMoney(percentOfMinor(categoryDefaults.vehicle.final, 95), "SAR"),
    deposit: overrides.deposit ?? "refunded",
  };
}

export function createUnpaidWinnerRelistOutcome(
  overrides: OutcomeOverrides = {},
): UnpaidWinnerRelistOutcome {
  return {
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    endedAt: overrides.endedAt ?? fixtureTimes.endedEndsAt,
    saleType: "bySale",
    type: "unpaidRelistOffer",
    perspective: "seller",
    relist: overrides.relist ?? createRelistOffer(),
  };
}

export function createSellerOptionPendingOutcome(
  overrides: OutcomeOverrides = {},
): SellerOptionPendingOutcome {
  return {
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    endedAt: overrides.endedAt ?? fixtureTimes.endedEndsAt,
    saleType: "sellerOption",
    type: "awaitingSellerDecision",
    perspective: "buyer",
  };
}

export function createSellerOptionApprovedOutcome(
  overrides: OutcomeOverrides = {},
): SellerOptionApprovedOutcome {
  const endedAt = overrides.endedAt ?? fixtureTimes.endedEndsAt;
  const amountOwed =
    overrides.amountOwed ?? moneyFromMajor(categoryDefaults.vehicle.final);
  const commission =
    overrides.commission ??
    createMoney(
      percentOfMinor(amountOwed.amountMinor, feeDefaults.commissionPercent),
      amountOwed.currency,
    );
  const vat =
    overrides.vat ??
    createMoney(
      percentOfMinor(commission.amountMinor, feeDefaults.vatPercent),
      commission.currency,
    );
  return {
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    endedAt,
    saleType: "sellerOption",
    type: "sellerApproved",
    perspective: "buyer",
    amountOwed,
    commission,
    vat,
    paymentDeadline:
      overrides.paymentDeadline ?? addHours(endedAt, paymentWindowHours),
    deposit: overrides.deposit ?? "credited",
  };
}

export function createSellerOptionRejectedOutcome(
  overrides: OutcomeOverrides = {},
): SellerOptionRejectedOutcome {
  const amountOwed =
    overrides.amountOwed ?? moneyFromMajor(categoryDefaults.vehicle.final);
  return {
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    endedAt: overrides.endedAt ?? fixtureTimes.endedEndsAt,
    saleType: "sellerOption",
    type: "sellerRejected",
    perspective: "buyer",
    commission:
      overrides.commission ??
      createMoney(
        percentOfMinor(amountOwed.amountMinor, feeDefaults.commissionPercent),
        amountOwed.currency,
      ),
    deposit: "refunded",
  };
}

export function createOutcome(overrides: OutcomeOverrides = {}): Outcome {
  if (overrides.saleType === "sellerOption") {
    if (overrides.type === "sellerApproved") {
      return createSellerOptionApprovedOutcome(overrides);
    }
    if (overrides.type === "sellerRejected") {
      return createSellerOptionRejectedOutcome(overrides);
    }
    return createSellerOptionPendingOutcome(overrides);
  }
  if (overrides.type === "belowReserve") {
    return createBelowReserveOutcome(overrides);
  }
  if (overrides.type === "unpaidRelistOffer") {
    return createUnpaidWinnerRelistOutcome(overrides);
  }
  if (overrides.type === "ended") {
    return createBySaleNonWinningOutcome(overrides);
  }
  return createBySaleWinOutcome(overrides);
}

export interface RelistOfferOverrides {
  readonly editableBuyNowPrice?: Money;
  readonly validUntil?: IsoDateTime;
}

export function createRelistOffer(
  overrides: RelistOfferOverrides = {},
): DirectSaleRelistOffer {
  return {
    editableBuyNowPrice:
      overrides.editableBuyNowPrice ??
      moneyFromMajor(categoryDefaults.vehicle.buyNow),
    validUntil:
      overrides.validUntil ??
      addDays(fixtureTimes.now, relistDefaults.offerValidityDays),
  };
}

export interface TransferEntryOverrides {
  readonly id?: string;
  readonly amount?: Money;
  readonly paidAt?: IsoDateTime;
}

export function createTransferEntry(
  overrides: TransferEntryOverrides = {},
): TransferEntry {
  return {
    id: overrides.id ?? "transfer-001",
    amount: overrides.amount ?? moneyFromMajor(20000),
    paidAt: overrides.paidAt ?? fixtureTimes.now,
  };
}

export interface SettlementOverrides {
  readonly outcomeId?: string;
  readonly amountPaid?: Money;
  readonly amountOutstanding?: Money;
  readonly transfers?: readonly TransferEntry[];
  readonly status?: SettlementStatus;
}

export function createSettlement(
  overrides: SettlementOverrides = {},
): Settlement {
  const status = overrides.status ?? "inProgress";
  const total = moneyFromMajor(categoryDefaults.vehicle.final);
  const paidTwentyPercent = createMoney(
    percentOfMinor(total.amountMinor, 20),
    total.currency,
  );
  const defaultTransfers: Readonly<
    Record<SettlementStatus, readonly TransferEntry[]>
  > = {
    inProgress: [
      createTransferEntry({
        id: "transfer-001",
        amount: paidTwentyPercent,
        paidAt: addHours(fixtureTimes.endedEndsAt, 6),
      }),
    ],
    pendingConfirmation: [
      createTransferEntry({
        id: "transfer-001",
        amount: total,
        paidAt: addHours(fixtureTimes.endedEndsAt, 6),
      }),
    ],
    fullySettled: [
      createTransferEntry({
        id: "transfer-001",
        amount: createMoney(twentyOf(total.amountMinor), total.currency),
        paidAt: addHours(fixtureTimes.endedEndsAt, 6),
      }),
      createTransferEntry({
        id: "transfer-002",
        amount: createMoney(
          total.amountMinor - twentyOf(total.amountMinor),
          total.currency,
        ),
        paidAt: addHours(fixtureTimes.endedEndsAt, 30),
      }),
    ],
  };
  const paid =
    overrides.amountPaid ??
    (status === "inProgress" ? paidTwentyPercent : total);
  const outstanding =
    overrides.amountOutstanding ??
    createMoney(total.amountMinor - paid.amountMinor, total.currency);
  return {
    outcomeId: overrides.outcomeId ?? "fx-outcome-001",
    amountPaid: paid,
    amountOutstanding: outstanding,
    transfers: overrides.transfers ?? defaultTransfers[status],
    status,
  };
}

function twentyOf(minor: number): number {
  return percentOfMinor(minor, 20);
}

export interface ParticipantOverrides {
  readonly accountId?: string;
  readonly auctionId?: string;
  readonly deposit?: Deposit;
  readonly highestBidder?: boolean;
  readonly withdrawal?: WithdrawalEligibility;
  readonly autoBid?: AutoBidState | null;
  readonly outcome?: Outcome | null;
}

export function createParticipant(
  overrides: ParticipantOverrides = {},
): Participant {
  const highestBidder = overrides.highestBidder ?? false;
  return {
    accountId: overrides.accountId ?? "account-individual-saudi-001",
    auctionId: overrides.auctionId ?? "fx-vehicle-auction-1",
    deposit: overrides.deposit ?? createDeposit(),
    highestBidder,
    withdrawal:
      overrides.withdrawal ?? (highestBidder ? "notEligible" : "available"),
    autoBid: overrides.autoBid ?? null,
    outcome: overrides.outcome ?? null,
  };
}

export interface PhoneNumberOverrides {
  readonly countryCode?: string;
  readonly nationalNumber?: string;
}

export function createPhoneNumber(
  overrides: PhoneNumberOverrides = {},
): PhoneNumber {
  return {
    countryCode: overrides.countryCode ?? "+966",
    nationalNumber: overrides.nationalNumber ?? "555123456",
  };
}

export function createSaudiVerification(
  status: Extract<
    IdentityVerification,
    { readonly route: "saudiNationalVerification" }
  >["status"] = "success",
): IdentityVerification {
  return { route: "saudiNationalVerification", status };
}

export function createManualVerification(): IdentityVerification {
  return { route: "manual", status: "verified" };
}

export interface IndividualAccountOverrides {
  readonly id?: string;
  readonly phone?: PhoneNumber;
  readonly nationality?: "saudi" | "nonSaudi";
  readonly nationalId?: string;
  readonly dateCalendar?: NationalIdCalendar;
  readonly dateOfBirth?: IndividualAccount["dateOfBirth"];
  readonly verification?: IdentityVerification;
}

export function createIndividualAccount(
  overrides: IndividualAccountOverrides = {},
): IndividualAccount {
  const nationality = overrides.nationality ?? "saudi";
  const isSaudi = nationality === "saudi";
  return {
    id: overrides.id ?? `account-individual-${nationality}-001`,
    phone: overrides.phone ?? createPhoneNumber(),
    type: "individual",
    nationality,
    ...(isSaudi || overrides.nationalId !== undefined
      ? { nationalId: overrides.nationalId ?? "1012345678" }
      : {}),
    dateCalendar: overrides.dateCalendar ?? (isSaudi ? "hijri" : "gregorian"),
    ...(overrides.dateOfBirth ? { dateOfBirth: overrides.dateOfBirth } : {}),
    verification:
      overrides.verification ??
      (isSaudi
        ? createSaudiVerification("success")
        : createManualVerification()),
  };
}

export interface CompanyAccountOverrides {
  readonly id?: string;
  readonly phone?: PhoneNumber;
  readonly companyName?: string;
  readonly review?: CompanyAccount["review"];
}

export function createCompanyAccount(
  overrides: CompanyAccountOverrides = {},
): CompanyAccount {
  return {
    id: overrides.id ?? "account-company-001",
    phone: overrides.phone ?? createPhoneNumber(),
    type: "company",
    companyName: overrides.companyName ?? companyCopy.primary.ar,
    review: overrides.review ?? "underReview",
  };
}

export function createAccount(
  type: Account["type"],
  overrides: IndividualAccountOverrides | CompanyAccountOverrides = {},
): Account {
  return type === "individual"
    ? createIndividualAccount(overrides as IndividualAccountOverrides)
    : createCompanyAccount(overrides as CompanyAccountOverrides);
}

export interface TransactionOverrides {
  readonly id?: string;
  readonly type?: TransactionType;
  readonly amount?: Money;
  readonly reference?: string;
  readonly date?: IsoDateTime;
  readonly status?: TransactionStatus;
}

export function createTransaction(
  overrides: TransactionOverrides = {},
): Transaction {
  const type = overrides.type ?? "deposit";
  return {
    id: overrides.id ?? `txn-${type}-001`,
    type,
    amount: overrides.amount ?? createMoney(200000, "SAR"),
    reference: overrides.reference ?? `REF-${type.toUpperCase()}-0001`,
    date: overrides.date ?? fixtureTimes.now,
    status: overrides.status ?? "completed",
  };
}

export interface WithdrawalRequestOverrides {
  readonly id?: string;
  readonly destination?: WithdrawalDestination;
  readonly amount?: Money;
  readonly status?: WithdrawalStatus;
  readonly requestedAt?: IsoDateTime;
}

export function createWithdrawalRequest(
  overrides: WithdrawalRequestOverrides = {},
): WithdrawalRequest {
  return {
    id: overrides.id ?? "withdrawal-001",
    destination: overrides.destination ?? {
      kind: "configuredBank",
      bankId: banks[0].id,
    },
    amount: overrides.amount ?? moneyFromMajor(2500),
    status: overrides.status ?? "pending",
    requestedAt: overrides.requestedAt ?? fixtureTimes.now,
  };
}

export interface WalletOverrides {
  readonly accountId?: string;
  readonly availableBalance?: Money;
  readonly balanceVisibility?: BalanceVisibility;
  readonly transactions?: readonly Transaction[];
  readonly withdrawals?: readonly WithdrawalRequest[];
}

export function createWallet(overrides: WalletOverrides = {}): Wallet {
  return {
    accountId: overrides.accountId ?? "account-individual-saudi-001",
    availableBalance: overrides.availableBalance ?? moneyFromMajor(12500),
    balanceVisibility: overrides.balanceVisibility ?? "revealed",
    transactions: overrides.transactions ?? [
      createTransaction({ id: "txn-deposit-001", type: "deposit" }),
      createTransaction({
        id: "txn-refund-001",
        type: "depositRefund",
      }),
    ],
    withdrawals: overrides.withdrawals ?? [],
  };
}

export interface ScreenStateOverrides {
  readonly state?: ScreenState["state"];
  readonly retryEligible?: boolean;
}

export function createScreenState(
  overrides: ScreenStateOverrides = {},
): ScreenState {
  switch (overrides.state ?? "ready") {
    case "loading":
      return { state: "loading" };
    case "empty":
      return { state: "empty" };
    case "error":
      return {
        state: "error",
        retryEligible: overrides.retryEligible ?? true,
      };
    case "ready":
      return { state: "ready" };
  }
}

/**
 * Full cross product of status x category x seller kind x sale type (where a
 * status supports sale types). Forty-two deterministic auctions, each with a
 * unique, derived id.
 */
export function createAuctionCoverageMatrix(): readonly Auction[] {
  const results: Auction[] = [];
  const sellers: Seller[] = [
    createIndividualSeller({ id: "seller-matrix-individual" }),
    createCompanySeller({ id: "seller-matrix-company" }),
  ];
  for (const status of auctionStatuses) {
    for (const category of auctionCategories) {
      for (const seller of sellers) {
        if (status === "directSale") {
          results.push(
            createDirectSaleAuction({
              id: `fx-matrix-${category}-directSale-${seller.kind}`,
              category,
              seller,
            }),
          );
          continue;
        }
        for (const saleType of saleTypes) {
          results.push(
            createAuction(status, {
              id: `fx-matrix-${category}-${status}-${saleType}-${seller.kind}`,
              category,
              saleType,
              seller,
            } as AuctionOverrides),
          );
        }
      }
    }
  }
  return results;
}

/** Every participant state combination that drives a visible rule. */
export function createParticipantCoverageList(): readonly Participant[] {
  return [
    createParticipant({
      accountId: "account-participant-001",
      auctionId: "fx-matrix-vehicle-upcoming-bySale-company",
      deposit: createDeposit({ status: "required" }),
      highestBidder: false,
      withdrawal: "notEligible",
    }),
    createParticipant({
      auctionId: "fx-matrix-vehicle-live-bySale-company",
      deposit: createDeposit({ status: "paid" }),
      highestBidder: false,
      withdrawal: "available",
      autoBid: createAutoBidState({ state: "active" }),
    }),
    createParticipant({
      auctionId: "fx-matrix-vehicle-live-sellerOption-company",
      deposit: createDeposit({ status: "paid" }),
      highestBidder: true,
      withdrawal: "notEligible",
      autoBid: createAutoBidState({
        state: "maximumReached",
        leading: true,
      }),
    }),
    createParticipant({
      auctionId: "fx-matrix-vehicle-ended-bySale-company",
      deposit: createDeposit({ status: "held" }),
      highestBidder: true,
      autoBid: null,
      outcome: createBySaleWinOutcome({
        auctionId: "fx-matrix-vehicle-ended-bySale-company",
      }),
    }),
    createParticipant({
      auctionId: "fx-matrix-realEstate-ended-bySale-company",
      deposit: createDeposit({ status: "refunded" }),
      highestBidder: false,
      withdrawal: "requested",
      outcome: createBySaleNonWinningOutcome({
        auctionId: "fx-matrix-realEstate-ended-bySale-company",
      }),
    }),
    createParticipant({
      auctionId: "fx-matrix-realEstate-ended-sellerOption-company",
      deposit: createDeposit({ status: "released" }),
      highestBidder: true,
      autoBid: createAutoBidState({ state: "cancelled" }),
      outcome: createSellerOptionApprovedOutcome({
        auctionId: "fx-matrix-realEstate-ended-sellerOption-company",
      }),
    }),
    createParticipant({
      auctionId: "fx-matrix-licensePlate-ended-bySale-company",
      deposit: createDeposit({ status: "refunded" }),
      highestBidder: false,
      outcome: createBelowReserveOutcome({
        perspective: "buyer",
        auctionId: "fx-matrix-licensePlate-ended-bySale-company",
      }),
    }),
    createParticipant({
      auctionId: "fx-matrix-licensePlate-ended-sellerOption-company",
      deposit: createDeposit({ status: "refunded" }),
      highestBidder: false,
      autoBid: null,
      outcome: createSellerOptionRejectedOutcome({
        auctionId: "fx-matrix-licensePlate-ended-sellerOption-company",
      }),
    }),
  ];
}

/** Every account, nationality, verification, and company-review state. */
export function createAccountCoverageList(): readonly Account[] {
  return [
    createIndividualAccount(),
    createIndividualAccount({
      nationalId: "2012345678",
      dateCalendar: "gregorian",
    }),
    createIndividualAccount({
      verification: createSaudiVerification("pending"),
    }),
    createIndividualAccount({
      verification: createSaudiVerification("redirected"),
    }),
    createIndividualAccount({
      verification: createSaudiVerification("success"),
    }),
    createIndividualAccount({
      verification: createSaudiVerification("failure"),
    }),
    createIndividualAccount({
      verification: createSaudiVerification("abandoned"),
    }),
    createIndividualAccount({ nationality: "nonSaudi" }),
    createCompanyAccount({ review: "submitted" }),
    createCompanyAccount({ review: "underReview" }),
    createCompanyAccount({ review: "activated" }),
  ];
}

/** Every terminal outcome variant, including buyer and seller below-reserve. */
export function createOutcomeCoverageList(): readonly Outcome[] {
  return [
    createBySaleWinOutcome(),
    createBySaleNonWinningOutcome(),
    createBelowReserveOutcome({ perspective: "buyer" }),
    createBelowReserveOutcome({ perspective: "seller" }),
    createUnpaidWinnerRelistOutcome(),
    createSellerOptionPendingOutcome(),
    createSellerOptionApprovedOutcome(),
    createSellerOptionRejectedOutcome(),
  ];
}

/** Transaction type x status, and withdrawal destination x status, coverage. */
export function createTransactionCoverageList(): readonly Transaction[] {
  const transactions: Transaction[] = [];
  for (const type of transactionTypes) {
    for (const status of transactionStatuses) {
      transactions.push(
        createTransaction({
          id: `txn-${type}-${status}-001`,
          type,
          status,
        }),
      );
    }
  }
  return transactions;
}

export function createWalletCoverageList(): readonly Wallet[] {
  return [
    createWallet(),
    createWallet({
      availableBalance: createMoney(0, "SAR"),
      transactions: [],
      withdrawals: [],
    }),
    createWallet({ balanceVisibility: "masked" }),
    createWallet({
      withdrawals: [
        createWithdrawalRequest({
          status: "pending",
          destination: { kind: "configuredBank", bankId: banks[0].id },
        }),
      ],
    }),
    createWallet({
      availableBalance: createMoney(3550, "BHD"),
      withdrawals: [
        createWithdrawalRequest({
          status: "approved",
          destination: { kind: "international" },
        }),
      ],
    }),
    createWallet({
      transactions: [
        createTransaction({ type: "settlement", status: "pending" }),
        createTransaction({ type: "commission", status: "completed" }),
        createTransaction({ type: "vat", status: "completed" }),
      ],
    }),
  ];
}

/**
 * Named preset fixtures for the notable combinations. Each entry is a thunk so
 * callers always receive a freshly constructed, isolated object.
 */
export const presets = {
  upcomingVehicleBySale: () =>
    createUpcomingAuction({ category: "vehicle", saleType: "bySale" }),
  upcomingVehicleSellerOptionCompany: () =>
    createUpcomingAuction({
      category: "vehicle",
      saleType: "sellerOption",
      seller: createCompanySeller(),
    }),
  liveVehicleBySaleIndividual: () =>
    createLiveAuction({
      category: "vehicle",
      saleType: "bySale",
      seller: createIndividualSeller(),
    }),
  liveVehicleBySaleCompany: () =>
    createLiveAuction({
      category: "vehicle",
      saleType: "bySale",
      seller: createCompanySeller(),
    }),
  liveRealEstateBySale: () =>
    createLiveAuction({ category: "realEstate", saleType: "bySale" }),
  liveLicensePlateSellerOption: () =>
    createLiveAuction({
      category: "licensePlate",
      saleType: "sellerOption",
    }),
  endedVehicleBySale: () =>
    createEndedAuction({ category: "vehicle", saleType: "bySale" }),
  endedVehicleSellerOption: () =>
    createEndedAuction({ category: "vehicle", saleType: "sellerOption" }),
  endedRealEstateBelowReserve: () =>
    createEndedAuction({
      category: "realEstate",
      saleType: "bySale",
      outcome: createBelowReserveOutcome({ perspective: "seller" }),
    }),
  directSaleVehicleCompany: () =>
    createDirectSaleAuction({
      category: "vehicle",
      seller: createCompanySeller(),
    }),
  directSaleLicensePlatePending: () =>
    createDirectSaleAuction({
      category: "licensePlate",
      transferStatus: "pendingConfirmation",
    }),
  directSaleVehicleConfirmed: () =>
    createDirectSaleAuction({
      category: "vehicle",
      transferStatus: "confirmed",
    }),
  participantReadyToBid: () => createParticipant({}),
  participantLeading: () => createParticipant({ highestBidder: true }),
  participantAutoBidActive: () =>
    createParticipant({
      autoBid: createAutoBidState({ state: "active" }),
    }),
  participantAutoBidAtMaximum: () =>
    createParticipant({
      highestBidder: false,
      autoBid: createAutoBidState({ state: "maximumReached", leading: false }),
    }),
  participantWonBySale: () =>
    createParticipant({ outcome: createBySaleWinOutcome() }),
  participantEndedNonWinner: () =>
    createParticipant({ outcome: createBySaleNonWinningOutcome() }),
  accountSaudiVerified: () => createIndividualAccount(),
  accountSaudiAwaitingVerification: () =>
    createIndividualAccount({
      verification: createSaudiVerification("pending"),
    }),
  accountSaudiVerificationRedirected: () =>
    createIndividualAccount({
      verification: createSaudiVerification("redirected"),
    }),
  accountSaudiVerificationFailed: () =>
    createIndividualAccount({
      verification: createSaudiVerification("failure"),
    }),
  accountSaudiVerificationAbandoned: () =>
    createIndividualAccount({
      verification: createSaudiVerification("abandoned"),
    }),
  accountNonSaudiManual: () =>
    createIndividualAccount({ nationality: "nonSaudi" }),
  accountCompanySubmitted: () => createCompanyAccount({ review: "submitted" }),
  accountCompanyUnderReview: () =>
    createCompanyAccount({ review: "underReview" }),
  accountCompanyActivated: () => createCompanyAccount({ review: "activated" }),
  walletBalanced: () => createWallet(),
  walletEmpty: () =>
    createWallet({
      availableBalance: createMoney(0, "SAR"),
      transactions: [],
      withdrawals: [],
    }),
  walletMasked: () => createWallet({ balanceVisibility: "masked" }),
  walletPendingWithdrawal: () =>
    createWallet({
      withdrawals: [createWithdrawalRequest({ status: "pending" })],
    }),
  walletApprovedWithdrawalBhd: () =>
    createWallet({
      availableBalance: createMoney(3550, "BHD"),
      withdrawals: [
        createWithdrawalRequest({
          status: "approved",
          destination: { kind: "international" },
        }),
      ],
    }),
  outcomeBySaleWon: () => createBySaleWinOutcome(),
  outcomeBySaleEnded: () => createBySaleNonWinningOutcome(),
  outcomeBelowReserveBuyer: () =>
    createBelowReserveOutcome({ perspective: "buyer" }),
  outcomeBelowReserveSeller: () =>
    createBelowReserveOutcome({ perspective: "seller" }),
  outcomeUnpaidRelist: () => createUnpaidWinnerRelistOutcome(),
  outcomeSellerAwaitingDecision: () => createSellerOptionPendingOutcome(),
  outcomeSellerApproved: () => createSellerOptionApprovedOutcome(),
  outcomeSellerRejected: () => createSellerOptionRejectedOutcome(),
} as const;

/**
 * Convenience value lists a test or MSW scenario can assert over without
 * importing literal unions. Kept at the bottom so the file reads as
 * factories -> presets -> coverage metadata.
 */
export const fixtureValueLists = {
  auctionStatuses,
  saleTypes,
  auctionCategories,
  depositStatuses,
  transactionTypes,
  transactionStatuses,
  withdrawalStatuses,
  auctionOutcomeTypes,
  identityVerificationStatuses,
} as const;

/**
 * Central dashboard configuration for the international auction marketplace.
 *
 * Single source for operator-tunable values (FR-076, FR-077, NFR-7) and for
 * unresolved-rule seams. Feature components consume named values only; no
 * eligible value may be inlined elsewhere. Values without a stated source are
 * documented defaults owned by the dashboard. See
 * specs/001-auction-marketplace-mvp/contracts/configuration.md.
 *
 * All user-facing copy is referenced by stable message keys (Arabic is the
 * primary locale; task T015 owns src/messages/ar.ts and src/messages/en.ts).
 * This module stays pure configuration: no i18n runtime, no translation
 * lookup. Components resolve `*Key` fields through the i18n catalogue.
 */

import type { AuctionCategory, AuctionStatus, Seller } from "../lib/api/types";
import type { MessageKey } from "../messages/ar";

export type { MessageKey };

export type SellerType = Seller["kind"];

export interface FilterOption<T extends string = string> {
  readonly labelKey: MessageKey;
  readonly value: T;
}

export interface FilterSelect<T extends string = string> {
  readonly type: "select";
  readonly id: string;
  readonly labelKey: MessageKey;
  readonly options: ReadonlyArray<FilterOption<T>>;
}

export interface FilterRange {
  readonly type: "range";
  readonly id: string;
  readonly labelKey: MessageKey;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit?: string;
}

export interface FilterText {
  readonly type: "text";
  readonly id: string;
  readonly labelKey: MessageKey;
  readonly placeholderKey: MessageKey;
}

export type AdvancedFilter = FilterSelect | FilterRange | FilterText;

export interface CompanyNameFilter extends FilterText {
  readonly id: "companyName";
  readonly revealedWhenSellerType: SellerType;
}

export interface FilterGroup {
  readonly id: string;
  readonly labelKey: MessageKey;
  readonly filters: ReadonlyArray<FilterSelect | CompanyNameFilter>;
}

/** Marketplace-visible auction states; a subset of the canonical AuctionStatus. */
export type StatusFilterValue = Extract<
  AuctionStatus,
  "upcoming" | "live" | "ended"
>;

/*
 * Message keys introduced below (population target for src/messages/*):
 *
 * filters.category                                filters.option.category.vehicle
 *                                                 filters.option.category.realEstate
 *                                                 filters.option.category.licensePlate
 * filters.sellerType                              filters.option.sellerType.individual
 *                                                 filters.option.sellerType.company
 * filters.auctionStatus                           filters.option.auctionStatus.upcoming
 *                                                 filters.option.auctionStatus.live
 *                                                 filters.option.auctionStatus.ended
 * filters.companyName                             filters.companyName.placeholder
 * filters.group.category                          filters.group.sellerType
 *                                                 filters.group.auctionStatus
 *
 * filters.vehicle.brand                           filters.option.brand.volkswagen
 *                                                 filters.option.brand.bmw
 *                                                 filters.option.brand.audi
 *                                                 filters.option.brand.mercedes-benz
 *                                                 filters.option.brand.toyota
 *                                                 filters.option.brand.ford
 *                                                 filters.option.brand.tesla
 *                                                 filters.option.brand.other
 * filters.vehicle.fuelType                        filters.option.fuelType.petrol
 *                                                 filters.option.fuelType.diesel
 *                                                 filters.option.fuelType.electric
 *                                                 filters.option.fuelType.hybrid
 *                                                 filters.option.fuelType.other
 * filters.vehicle.transmission                    filters.option.transmission.manual
 *                                                 filters.option.transmission.automatic
 * filters.vehicle.year
 * filters.vehicle.mileage
 *
 * filters.realEstate.propertyType                 filters.option.propertyType.house
 *                                                 filters.option.propertyType.apartment
 *                                                 filters.option.propertyType.commercial
 *                                                 filters.option.propertyType.land
 *                                                 filters.option.propertyType.other
 * filters.realEstate.location                     filters.realEstate.location.placeholder
 * filters.realEstate.price
 * filters.realEstate.livingArea
 *
 * filters.licensePlate.plateType                  filters.option.plateType.standard
 *                                                 filters.option.plateType.personalized
 *                                                 filters.option.plateType.vanity
 *                                                 filters.option.plateType.special
 * filters.licensePlate.pattern                    filters.licensePlate.pattern.placeholder
 * filters.licensePlate.priceLimit
 *
 * banks.alrajhi   banks.snb   banks.riyad   banks.alinma   banks.nbb   banks.bbk   banks.other
 */

export const categoryFilter: FilterSelect<AuctionCategory> = {
  type: "select",
  id: "category",
  labelKey: "filters.category",
  options: [
    { labelKey: "filters.option.category.vehicle", value: "vehicle" },
    { labelKey: "filters.option.category.realEstate", value: "realEstate" },
    { labelKey: "filters.option.category.licensePlate", value: "licensePlate" },
  ],
};

export const sellerTypeFilter: FilterSelect<SellerType> = {
  type: "select",
  id: "sellerType",
  labelKey: "filters.sellerType",
  options: [
    { labelKey: "filters.option.sellerType.individual", value: "individual" },
    { labelKey: "filters.option.sellerType.company", value: "company" },
  ],
};

export const auctionStatusFilter: FilterSelect<StatusFilterValue> = {
  type: "select",
  id: "auctionStatus",
  labelKey: "filters.auctionStatus",
  options: [
    { labelKey: "filters.option.auctionStatus.upcoming", value: "upcoming" },
    { labelKey: "filters.option.auctionStatus.live", value: "live" },
    { labelKey: "filters.option.auctionStatus.ended", value: "ended" },
  ],
};

export const companyNameFilter: CompanyNameFilter = {
  type: "text",
  id: "companyName",
  labelKey: "filters.companyName",
  placeholderKey: "filters.companyName.placeholder",
  revealedWhenSellerType: "company",
};

/** Ordered common filter groups rendered above the category-specific sets. */
export const filterGroups = [
  {
    id: "category",
    labelKey: "filters.group.category",
    filters: [categoryFilter],
  },
  {
    id: "sellerType",
    labelKey: "filters.group.sellerType",
    filters: [sellerTypeFilter, companyNameFilter],
  },
  {
    id: "auctionStatus",
    labelKey: "filters.group.auctionStatus",
    filters: [auctionStatusFilter],
  },
] as const satisfies ReadonlyArray<FilterGroup>;

/** Category-specific advanced filters (FR-025); option values are design-derived. */
export const advancedFilterSchemas: Readonly<
  Record<AuctionCategory, readonly AdvancedFilter[]>
> = {
  vehicle: [
    {
      type: "select",
      id: "brand",
      labelKey: "filters.vehicle.brand",
      options: [
        { labelKey: "filters.option.brand.volkswagen", value: "volkswagen" },
        { labelKey: "filters.option.brand.bmw", value: "bmw" },
        { labelKey: "filters.option.brand.audi", value: "audi" },
        {
          labelKey: "filters.option.brand.mercedes-benz",
          value: "mercedes-benz",
        },
        { labelKey: "filters.option.brand.toyota", value: "toyota" },
        { labelKey: "filters.option.brand.ford", value: "ford" },
        { labelKey: "filters.option.brand.tesla", value: "tesla" },
        { labelKey: "filters.option.brand.other", value: "other" },
      ],
    },
    {
      type: "select",
      id: "fuelType",
      labelKey: "filters.vehicle.fuelType",
      options: [
        { labelKey: "filters.option.fuelType.petrol", value: "petrol" },
        { labelKey: "filters.option.fuelType.diesel", value: "diesel" },
        { labelKey: "filters.option.fuelType.electric", value: "electric" },
        { labelKey: "filters.option.fuelType.hybrid", value: "hybrid" },
        { labelKey: "filters.option.fuelType.other", value: "other" },
      ],
    },
    {
      type: "select",
      id: "transmission",
      labelKey: "filters.vehicle.transmission",
      options: [
        { labelKey: "filters.option.transmission.manual", value: "manual" },
        {
          labelKey: "filters.option.transmission.automatic",
          value: "automatic",
        },
      ],
    },
    {
      type: "range",
      id: "year",
      labelKey: "filters.vehicle.year",
      min: 1900,
      max: 2026,
      step: 1,
    },
    {
      type: "range",
      id: "mileage",
      labelKey: "filters.vehicle.mileage",
      min: 0,
      max: 400000,
      step: 1000,
      unit: "km",
    },
  ],
  realEstate: [
    {
      type: "select",
      id: "propertyType",
      labelKey: "filters.realEstate.propertyType",
      options: [
        { labelKey: "filters.option.propertyType.house", value: "house" },
        {
          labelKey: "filters.option.propertyType.apartment",
          value: "apartment",
        },
        {
          labelKey: "filters.option.propertyType.commercial",
          value: "commercial",
        },
        { labelKey: "filters.option.propertyType.land", value: "land" },
        { labelKey: "filters.option.propertyType.other", value: "other" },
      ],
    },
    {
      type: "text",
      id: "location",
      labelKey: "filters.realEstate.location",
      placeholderKey: "filters.realEstate.location.placeholder",
    },
    {
      type: "range",
      id: "price",
      labelKey: "filters.realEstate.price",
      min: 0,
      max: 1000000,
      step: 10000,
    },
    {
      type: "range",
      id: "livingArea",
      labelKey: "filters.realEstate.livingArea",
      min: 0,
      max: 1000,
      step: 10,
      unit: "m²",
    },
  ],
  licensePlate: [
    {
      type: "select",
      id: "plateType",
      labelKey: "filters.licensePlate.plateType",
      options: [
        { labelKey: "filters.option.plateType.standard", value: "standard" },
        {
          labelKey: "filters.option.plateType.personalized",
          value: "personalized",
        },
        { labelKey: "filters.option.plateType.vanity", value: "vanity" },
        { labelKey: "filters.option.plateType.special", value: "special" },
      ],
    },
    {
      type: "text",
      id: "pattern",
      labelKey: "filters.licensePlate.pattern",
      placeholderKey: "filters.licensePlate.pattern.placeholder",
    },
    {
      type: "range",
      id: "priceLimit",
      labelKey: "filters.licensePlate.priceLimit",
      min: 0,
      max: 100000,
      step: 500,
    },
  ],
};

export const filterSchemas = {
  category: categoryFilter,
  sellerType: sellerTypeFilter,
  auctionStatus: auctionStatusFilter,
  companyName: companyNameFilter,
  groups: filterGroups,
  advanced: advancedFilterSchemas,
} as const;

/** Exactly three quick-increment presets, each a percentage of opening/reserve price (FR-044). */
export const quickBidPercentagePresets = [1, 2, 3] as const;

/** Auto-bid waits this long after being outbid before counter-bidding (FR-047). */
export const autoBidDelaySeconds = 5;

/** Payment window after winning; configurable (FR-053, FR-8.1). */
export const paymentWindowHours = 48;

/** Countdown takes its urgent appearance below this threshold (FR-033, FR-6.4). */
export const countdownUrgencyMinutes = 60;

/** Deposit payment methods (FR-042); server/online methods are dashboard-managed. */
export const paymentMethodDefaults = ["wallet", "online"] as const;
export type PaymentMethodId = (typeof paymentMethodDefaults)[number];

export interface Bank {
  readonly id: string;
  readonly nameKey: MessageKey;
  readonly country: string;
  readonly internationalTransfer?: boolean;
}

/** Withdrawal destinations (FR-066): configured banks plus an international "other". */
export const banks = [
  { id: "alrajhi", nameKey: "banks.alrajhi", country: "SA" },
  { id: "snb", nameKey: "banks.snb", country: "SA" },
  { id: "riyad", nameKey: "banks.riyad", country: "SA" },
  { id: "alinma", nameKey: "banks.alinma", country: "SA" },
  { id: "nbb", nameKey: "banks.nbb", country: "BH" },
  { id: "bbk", nameKey: "banks.bbk", country: "BH" },
  {
    id: "other",
    nameKey: "banks.other",
    country: "INTL",
    internationalTransfer: true,
  },
] as const satisfies readonly Bank[];

export interface FeeDefinition {
  readonly kind: "flat" | "percentage";
  readonly value: number;
}

export const feeDefaults = {
  /** Deposit is released only after 100% of the winning amount is settled (FR-056). */
  depositReleaseThresholdPercent: 100,
  /** Non-refundable publish fee; flat or percentage. Default unsourced (owner: dashboard). */
  listingFee: { kind: "flat", value: 0 },
  /** Refundable seller-seriousness deposit. Default unsourced (owner: dashboard). */
  sellerDeposit: { kind: "flat", value: 0 },
  /** App commission shown in outcomes (FR-051, FR-052). Default unsourced. */
  commissionPercent: 5,
  /** VAT where applicable (seller-option approval). Default unsourced; KSA 15%, BHD 10%. */
  vatPercent: 15,
} as const;

export const relistDefaults = {
  /** Unpaid-winner relist offer validity, "a limited period" (FR-059). Default unsourced. */
  offerValidityDays: 7,
} as const;

export const thresholdDefaults = {
  /** Classifies vehicles as used above this mileage (FR-010.7). Default unsourced. */
  vehicle: { mileageThresholdKm: 100000 },
  /** Classifies real estate as used above this age (FR-010.7). Default unsourced. */
  realEstate: { ageThresholdYears: 5 },
} as const;

export const capabilityDefaults = {
  /** Individual sellers render as "private owner" (FR-037); reversed via one change. */
  individualIdentityAsPrivateOwner: true,
  /** Live/broadcast auction creation is disabled in this MVP (FR-010.13). */
  canCreateLiveAuction: false,
  /** Deposit-release alternatives such as a 75% instalment threshold are disabled. */
  depositReleaseAlternatives: false,
} as const;

export interface BannerItem {
  readonly id: string;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly href: string;
  readonly imageUrl?: string;
}

export const homeCarouselDefaults = {
  autoAdvanceMs: 5000,
  pauseOnHover: true,
  pauseOnFocus: true,
} as const;

export const homeBanners: readonly BannerItem[] = [
  {
    id: "banner-discover",
    titleKey: "home.banner.slideTitle.1",
    descriptionKey: "home.banner.slideDescription.1",
    href: "/auctions",
  },
  {
    id: "banner-live",
    titleKey: "home.banner.slideTitle.2",
    descriptionKey: "home.banner.slideDescription.2",
    href: "/auctions",
  },
  {
    id: "banner-exclusive",
    titleKey: "home.banner.slideTitle.3",
    descriptionKey: "home.banner.slideDescription.3",
    href: "/auctions",
  },
] as const;

/**
 * Category inference mapping (FR-021). When a search term contains one of
 * these keywords, the results are scoped to the mapped category. When no
 * keyword matches, results are returned unscoped rather than empty (edge case).
 * Both Arabic and English terms are included; the operator controls this list.
 */
export const categoryInferenceTerms: Readonly<
  Record<AuctionCategory, readonly string[]>
> = {
  vehicle: [
    "سيارة",
    "سيارات",
    "car",
    "cars",
    "vehicle",
    "vehicles",
    "تايوتا",
    "تويوتا",
    "toyota",
    "هوندا",
    "honda",
    "فورد",
    "ford",
    "بي ام دبليو",
    "bmw",
    "مرسيدس",
    "mercedes",
    "أودي",
    "audi",
    "لاند كروزر",
    "land cruiser",
    "كامري",
    "camry",
  ],
  realEstate: [
    "عقار",
    "عقارات",
    "real estate",
    "property",
    "فيلا",
    "villa",
    "شقة",
    "apartment",
    "أرض",
    "land",
    "مكتب",
    "office",
    "محل",
    "shop",
    "منزل",
    "house",
    "بنتهاوس",
    "penthouse",
  ],
  licensePlate: [
    "لوحة",
    "لوحات",
    "plate",
    "plates",
    "رقمي",
    "رقمي",
    "vanity",
    "private",
    "مميزة",
    "خاصة",
    "عادية",
    "standard",
  ],
};

/**
 * Infer an auction category from a search term. Returns undefined when no
 * category keyword matches, which means results should be returned unscoped.
 */
export function inferCategory(term: string): AuctionCategory | undefined {
  const lower = term.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryInferenceTerms)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return category as AuctionCategory;
      }
    }
  }
  return undefined;
}

export const marketplaceConfig = {
  /** Absolute base URL for API fetch calls; avoids relative URL failures in Node. */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  home: {
    banners: homeBanners,
    carousel: homeCarouselDefaults,
  },
  filters: filterSchemas,
  bidding: {
    quickBidPercentagePresets,
    autoBidDelaySeconds,
  },
  timing: {
    paymentWindowHours,
    countdownUrgencyMinutes,
  },
  payments: {
    methods: paymentMethodDefaults,
    banks,
  },
  fees: feeDefaults,
  relist: relistDefaults,
  thresholds: thresholdDefaults,
  capabilities: capabilityDefaults,
  search: {
    categoryInferenceTerms,
  },
} as const;

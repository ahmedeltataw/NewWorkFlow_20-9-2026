import { describe, expect, it } from "vitest";

import {
  advancedFilterSchemas,
  auctionStatusFilter,
  autoBidDelaySeconds,
  banks,
  capabilityDefaults,
  categoryFilter,
  companyNameFilter,
  countdownUrgencyMinutes,
  feeDefaults,
  filterGroups,
  marketplaceConfig,
  paymentMethodDefaults,
  paymentWindowHours,
  quickBidPercentagePresets,
  relistDefaults,
  sellerTypeFilter,
  thresholdDefaults,
} from "../../src/config/marketplace";

interface KeyedByLabel {
  readonly labelKey: string;
}

const collectKeys = (
  ...keys: Array<string | ReadonlyArray<string> | undefined>
) => keys.flatMap((key) => (Array.isArray(key) ? key : key ? [key] : []));

const selectLabelKeys = (select: {
  readonly options: readonly KeyedByLabel[];
}) => select.options.map((option) => option.labelKey);

describe("T019 central marketplace configuration", () => {
  it("declares exactly the three sourced quick-increment percentages", () => {
    expect(quickBidPercentagePresets).toEqual([1, 2, 3]);
    expect(marketplaceConfig.bidding.quickBidPercentagePresets).toBe(
      quickBidPercentagePresets,
    );
  });

  it("declares the five-second auto-bid delay", () => {
    expect(autoBidDelaySeconds).toBe(5);
    expect(marketplaceConfig.bidding.autoBidDelaySeconds).toBe(5);
  });

  it("declares the 48-hour payment window", () => {
    expect(paymentWindowHours).toBe(48);
    expect(marketplaceConfig.timing.paymentWindowHours).toBe(48);
  });

  it("declares the 60-minute countdown urgency threshold", () => {
    expect(countdownUrgencyMinutes).toBe(60);
    expect(marketplaceConfig.timing.countdownUrgencyMinutes).toBe(60);
  });

  it("declares wallet and online payment methods", () => {
    expect(paymentMethodDefaults).toEqual(["wallet", "online"]);
    expect(marketplaceConfig.payments.methods).toBe(paymentMethodDefaults);
  });

  it("declares configured banks plus an international other option", () => {
    expect(banks.length).toBeGreaterThanOrEqual(2);
    const ids = new Set(banks.map((bank) => bank.id));
    expect(ids.size).toBe(banks.length);
    expect(
      banks.some((bank) => bank.id === "other"),
      "banks must offer the international 'other' option",
    ).toBe(true);
    expect(
      banks.some(
        (bank) => "internationalTransfer" in bank && bank.internationalTransfer,
      ),
    ).toBe(true);
  });

  it("declares the 100% deposit-release threshold and future-sell fee defaults", () => {
    expect(feeDefaults.depositReleaseThresholdPercent).toBe(100);
    expect(feeDefaults.listingFee).toEqual({ kind: "flat", value: 0 });
    expect(feeDefaults.sellerDeposit).toEqual({ kind: "flat", value: 0 });
  });

  it("declares the documented capability defaults", () => {
    expect(capabilityDefaults.individualIdentityAsPrivateOwner).toBe(true);
    expect(capabilityDefaults.canCreateLiveAuction).toBe(false);
    expect(capabilityDefaults.depositReleaseAlternatives).toBe(false);
  });

  it("orders the common filter groups category, seller type, auction status", () => {
    expect(filterGroups.map((group) => group.id)).toEqual([
      "category",
      "sellerType",
      "auctionStatus",
    ]);
  });

  it("reveals the company-name filter only behind seller type company", () => {
    expect(companyNameFilter.revealedWhenSellerType).toBe("company");
    const sellerTypeGroup = filterGroups.find(
      (group) => group.id === "sellerType",
    );
    expect(sellerTypeGroup?.filters).toContain(companyNameFilter);
  });

  it("keeps the status filter values inside the canonical auction statuses", () => {
    expect(
      auctionStatusFilter.options.map((option) => option.value).sort(),
    ).toEqual(["ended", "live", "upcoming"]);
  });

  it("keeps the seller-type filter values on the canonical seller kinds", () => {
    expect(
      sellerTypeFilter.options.map((option) => option.value).sort(),
    ).toEqual(["company", "individual"]);
  });

  it("covers every category with an advanced filter set", () => {
    expect(Object.keys(advancedFilterSchemas).sort()).toEqual([
      "licensePlate",
      "realEstate",
      "vehicle",
    ]);
  });

  it("declares the category thresholds and relist validity", () => {
    expect(thresholdDefaults.vehicle.mileageThresholdKm).toBeGreaterThan(0);
    expect(thresholdDefaults.realEstate.ageThresholdYears).toBeGreaterThan(0);
    expect(relistDefaults.offerValidityDays).toBeGreaterThan(0);
  });

  it("keeps every unit as the real rendered symbol, not an ASCII approximation", () => {
    const vehicleFilters = advancedFilterSchemas.vehicle;
    const realEstateFilters = advancedFilterSchemas.realEstate;
    const mileage = vehicleFilters.find((filter) => filter.id === "mileage");
    const livingArea = realEstateFilters.find(
      (filter) => filter.id === "livingArea",
    );
    expect(mileage && "unit" in mileage ? mileage.unit : undefined).toBe("km");
    expect(
      livingArea && "unit" in livingArea ? livingArea.unit : undefined,
    ).toBe("m²");
  });
});

describe("T019 marketplace message keys", () => {
  const allKeys = collectKeys(
    categoryFilter.labelKey,
    selectLabelKeys(categoryFilter),
    sellerTypeFilter.labelKey,
    selectLabelKeys(sellerTypeFilter),
    auctionStatusFilter.labelKey,
    selectLabelKeys(auctionStatusFilter),
    companyNameFilter.labelKey,
    companyNameFilter.placeholderKey,
    ...filterGroups.map((group) => group.labelKey),
    ...(
      Object.values(advancedFilterSchemas).flat() as Array<{
        readonly labelKey: string;
        readonly placeholderKey?: string;
        readonly options?: readonly KeyedByLabel[];
      }>
    ).flatMap((filter) =>
      collectKeys(
        filter.labelKey,
        filter.placeholderKey,
        filter.options?.map((o) => o.labelKey),
      ),
    ),
    ...banks.map((bank) => bank.nameKey),
  );

  it("exposes non-empty, namespaced translation keys on every option, filter, and bank", () => {
    expect(allKeys.length).toBeGreaterThan(0);
    for (const key of allKeys) {
      expect(key.trim().length).toBeGreaterThan(0);
      expect(key).toMatch(/^(filters|banks)\.[a-z][a-zA-Z0-9.-]*$/);
    }
  });

  it("uses exactly one unique key per message (no duplicates, no raw English copy)", () => {
    const unique = new Set(allKeys);
    expect(unique.size).toBe(allKeys.length);
  });

  it("assigns every bank a bank-namespaced, non-empty nameKey", () => {
    expect(banks.length).toBeGreaterThan(0);
    for (const bank of banks) {
      expect(bank.nameKey.trim().length).toBeGreaterThan(0);
      expect(bank.nameKey).toMatch(/^banks\.[a-z][a-zA-Z0-9.-]*$/);
    }
  });

  it("keeps structural filter fields on translation keys, not raw labels", () => {
    for (const filter of [
      categoryFilter,
      sellerTypeFilter,
      auctionStatusFilter,
    ]) {
      expect(Object.keys(filter)).not.toContain("label");
      expect(Object.keys(filter)).not.toContain("placeholder");
      expect(filter.labelKey.trim().length).toBeGreaterThan(0);
      filter.options.forEach((option) => {
        expect(Object.keys(option)).not.toContain("label");
        expect(option.labelKey.trim().length).toBeGreaterThan(0);
      });
    }
    expect(Object.keys(companyNameFilter)).not.toContain("label");
    expect(Object.keys(companyNameFilter)).not.toContain("placeholder");
    expect(Object.keys(companyNameFilter)).not.toContain("options");
    expect(companyNameFilter.labelKey.trim().length).toBeGreaterThan(0);
    expect(companyNameFilter.placeholderKey.trim().length).toBeGreaterThan(0);
  });
});

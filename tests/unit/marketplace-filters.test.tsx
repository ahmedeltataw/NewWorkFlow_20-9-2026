import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MarketplaceFilters } from "../../src/features/marketplace/Filters";
import { marketplaceConfig } from "../../src/config/marketplace";
import { translate } from "../../src/lib/i18n";

describe("MarketplaceFilters", () => {
  it("reveals the configured company-name field only after its configured seller value is selected", async () => {
    const user = userEvent.setup();
    const locale = "en" as const;
    render(
      <MarketplaceFilters
        groups={marketplaceConfig.filters.groups}
        advancedFilters={[]}
        values={{}}
        locale={locale}
        action="/auctions"
        labels={{
          title: translate(locale, "marketplace.filters"),
          open: translate(locale, "marketplace.openFilters"),
          apply: translate(locale, "marketplace.applyFilters"),
        }}
      />,
    );

    expect(
      screen.queryByRole("searchbox", {
        name: translate(locale, "filters.companyName"),
      }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: translate(locale, "marketplace.openFilters"),
      }),
    );
    const drawer = await screen.findByRole("dialog");
    const sellerTypeId = marketplaceConfig.filters.sellerType.id;
    const sellerType = drawer.querySelector<HTMLSelectElement>(
      `select[name="${sellerTypeId}"]`,
    );
    expect(sellerType).not.toBeNull();
    if (!sellerType) throw new Error("Missing configured seller-type control");
    await user.selectOptions(
      sellerType,
      marketplaceConfig.filters.companyName.revealedWhenSellerType,
    );

    expect(
      within(drawer).getByRole("searchbox", {
        name: translate(locale, "filters.companyName"),
      }),
    ).toBeInTheDocument();

    const nonCompanyValue = marketplaceConfig.filters.sellerType.options.find(
      (option) =>
        option.value !==
        marketplaceConfig.filters.companyName.revealedWhenSellerType,
    )?.value;
    expect(nonCompanyValue).toBeDefined();
    await user.selectOptions(sellerType, nonCompanyValue!);
    expect(
      within(drawer).queryByRole("searchbox", {
        name: translate(locale, "filters.companyName"),
      }),
    ).not.toBeInTheDocument();
  });
});

import type {
  Auction,
  AuctionCategory,
  AuctionStatus,
  SaleType,
  Seller,
} from "../../lib/api/types";
import type { MarketplaceQuery } from "../../lib/api/client";
import type { MessageKey } from "../../messages/ar";
import type { FilterGroup, FilterSelect } from "../../config/marketplace";
import { marketplaceConfig } from "../../config/marketplace";
import { ListingGrid } from "../../components/domain/ListingGrid";
import { Container } from "../../components/shell/ResponsiveLayout";
import { ApiClient } from "../../lib/api/api-client";
import { getRequestLocale } from "../../lib/i18n/server";
import { translate } from "../../lib/i18n";
import { MarketplaceFilters } from "../../features/marketplace/Filters";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function selectedOption(
  id: string,
  value: string | undefined,
): string | undefined {
  const groups = marketplaceConfig.filters.groups as readonly FilterGroup[];
  const filter = groups
    .flatMap((group) => group.filters)
    .find(
      (candidate): candidate is FilterSelect =>
        candidate.id === id && candidate.type === "select",
    );
  return filter?.options.some((option) => option.value === value)
    ? value
    : undefined;
}

function marketplaceQuery(params: SearchParams): MarketplaceQuery {
  const category = selectedOption("category", firstValue(params.category));
  const sellerKind = selectedOption(
    "sellerType",
    firstValue(params.sellerType),
  );
  const status = selectedOption(
    "auctionStatus",
    firstValue(params.auctionStatus),
  );
  const companyFilter = marketplaceConfig.filters.companyName;
  const companyName =
    sellerKind === companyFilter.revealedWhenSellerType
      ? firstValue(params[companyFilter.id])
      : undefined;
  return {
    query: firstValue(params.query),
    category: category as AuctionCategory | undefined,
    saleType: firstValue(params.saleType) as SaleType | undefined,
    status: status as AuctionStatus | undefined,
    sellerKind: sellerKind as Seller["kind"] | undefined,
    companyName,
  };
}

function filterValues(
  params: SearchParams,
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, firstValue(value)]),
  );
}

export default async function AuctionsPage({
  searchParams,
}: {
  readonly searchParams: Promise<SearchParams>;
}) {
  const [locale, params] = await Promise.all([
    getRequestLocale(),
    searchParams,
  ]);
  const query = marketplaceQuery(params);
  let auctions: readonly Auction[] = [];
  let error: string | null = null;
  try {
    const result = await new ApiClient().queryMarketplace(query);
    if (result.status === "success") auctions = result.data;
  } catch {
    error = translate(locale, "common.error");
  }
  return (
    <main>
      <Container className="py-6">
        <h1 className="mb-6 text-h1 text-text-primary">
          {translate(locale, "marketplace.title")}
        </h1>
        <div className="flex flex-col gap-6 lg:flex-row">
          <MarketplaceFilters
            groups={marketplaceConfig.filters.groups}
            advancedFilters={
              query.category
                ? marketplaceConfig.filters.advanced[query.category]
                : []
            }
            values={filterValues(params)}
            locale={locale}
            action="/auctions"
            labels={{
              title: translate(locale, "marketplace.filters"),
              open: translate(locale, "marketplace.openFilters"),
              apply: translate(locale, "marketplace.applyFilters"),
            }}
          />
          <div
            aria-live="polite"
            aria-atomic="true"
            className="lg:min-w-0 lg:flex-1"
          >
            <ListingGrid
              auctions={auctions}
              error={error}
              locale={locale}
              ariaLabel={translate(locale, "marketplace.results.ariaLabel")}
              emptyTitleKey={"marketplace.empty.title" as MessageKey}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}

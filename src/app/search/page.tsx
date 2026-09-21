import type { Auction, AuctionCategory } from "../../lib/api/types";
import type { MessageKey } from "../../messages/ar";
import { ListingGrid } from "../../components/domain/ListingGrid";
import { ScreenState } from "../../components/shell/ScreenState";
import { Container } from "../../components/shell/ResponsiveLayout";
import { ApiClient } from "../../lib/api/api-client";
import { getRequestLocale } from "../../lib/i18n/server";
import { translate } from "../../lib/i18n";
import { inferCategory } from "../../config/marketplace";
import { SearchExperience } from "../../features/search/SearchExperience";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export default async function SearchPage({
  searchParams,
}: {
  readonly searchParams: Promise<SearchParams>;
}) {
  const [locale, params] = await Promise.all([
    getRequestLocale(),
    searchParams,
  ]);
  const query = firstValue(params.q) ?? "";
  const inferredCategory: AuctionCategory | undefined = query
    ? inferCategory(query)
    : undefined;

  let auctions: readonly Auction[] = [];
  let error: string | null = null;
  try {
    const client = new ApiClient();
    const result = await client.searchAuctions(query, inferredCategory);
    if (result.status === "success") {
      auctions = result.data;
    } else if (result.status === "error") {
      error = result.message;
    } else {
      error = translate(locale, "common.error");
    }
  } catch {
    error = translate(locale, "common.error");
  }

  const hasQuery = query.length > 0;
  const screenState = error
    ? { state: "error" as const, retryEligible: true }
    : hasQuery && auctions.length === 0
      ? { state: "empty" as const }
      : hasQuery
        ? { state: "ready" as const }
        : { state: "empty" as const };

  const categoryLabel = inferredCategory
    ? translate(locale, `category.${inferredCategory}` as MessageKey)
    : undefined;

  return (
    <main>
      <Container className="py-6">
        <h1 className="mb-6 text-h1 text-text-primary">
          {translate(locale, "search.title")}
        </h1>
        <SearchExperience locale={locale} initialQuery={query} />
        {inferredCategory && (
          <p className="mt-3 text-body-sm text-text-sub-text">
            {translate(locale, "search.inferredCategory").replace(
              "{0}",
              categoryLabel ?? "",
            )}
          </p>
        )}
        <div className="mt-6" aria-live="polite" aria-atomic="true">
          <ScreenState
            state={screenState}
            loadingLabel={translate(locale, "common.loading")}
            emptyLabel={translate(locale, "search.noResults.title")}
            errorLabel={error ?? translate(locale, "common.error")}
            retryLabel={translate(locale, "common.retry")}
          >
            <ListingGrid
              auctions={auctions}
              error={error}
              locale={locale}
              ariaLabel={translate(locale, "search.results.ariaLabel")}
              emptyTitleKey={"search.noResults.title" as MessageKey}
            />
          </ScreenState>
        </div>
      </Container>
    </main>
  );
}

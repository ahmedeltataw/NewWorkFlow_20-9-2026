/**
 * T031 — Server-rendered home page (FR-008, FR-019).
 *
 * Server component: fetches home feed via AuctionMarketplaceClient,
 * enforces FR-019 (ended auctions never appear on home), renders
 * listing grid and category chips on the server. Only the banner
 * carousel is a client component (interactive slide state).
 *
 * Ended auctions are excluded in this file's data path, not by mock
 * behaviour alone.
 */

import type { Auction, AuctionCategory, Locale } from "../lib/api/types";
import type { MessageKey } from "../messages/ar";
import { getRequestLocale } from "../lib/i18n/server";
import { translate } from "../lib/i18n";
import { marketplaceConfig } from "../config/marketplace";
import { ApiClient } from "../lib/api/api-client";
import { excludeEndedAuctions } from "../lib/home-filter";
import { ListingGrid } from "../components/domain/ListingGrid";
import { CategoryChipsNav } from "../components/domain/CategoryChipsNav";
import { HomeClient } from "./home-client";

/* ------------------------------------------------------------------ */
/* Category definitions for chip navigation                             */
/* ------------------------------------------------------------------ */

const HOME_CATEGORIES: readonly {
  category: AuctionCategory;
  labelKey: MessageKey;
}[] = [
  { category: "vehicle", labelKey: "category.vehicle" },
  { category: "realEstate", labelKey: "category.realEstate" },
  { category: "licensePlate", labelKey: "category.licensePlate" },
];

/* ------------------------------------------------------------------ */
/* Page props                                                          */
/* ------------------------------------------------------------------ */

interface SearchParams {
  readonly category?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale: Locale = await getRequestLocale();
  const { category: categoryParam } = await searchParams;
  const selectedCategory = (categoryParam as AuctionCategory) ?? null;

  /* Fetch home feed via typed client (absolute URL from config). */
  const client = new ApiClient();
  let auctions: readonly Auction[] = [];
  let error = false;

  try {
    const result = await client.getHomeFeed();
    if (result.status === "success") {
      auctions = excludeEndedAuctions(result.data);
    } else {
      error = true;
    }
  } catch {
    error = true;
  }

  /* Client-side category filtering (server concern per brief). */
  if (selectedCategory && auctions.length > 0) {
    auctions = auctions.filter((a) => a.category === selectedCategory);
  }

  /* Resolve carousel labels on the server. */
  const carouselAriaLabel = translate(locale, "home.banner.ariaLabel");
  const slidePositionLabel = translate(locale, "home.banner.slidePosition");
  const nextLabel = translate(locale, "home.banner.nextSlide");
  const previousLabel = translate(locale, "home.banner.previousSlide");
  const categoryChipsLabel = translate(locale, "home.category.chipsLabel");
  const allCategoriesLabel = translate(locale, "home.category.allLabel");
  const listingsAriaLabel = translate(locale, "home.listings.ariaLabel");
  const emptyTitleKey = "home.empty.title" as MessageKey;

  return (
    <main>
      {/* Banner carousel — only interactive leaf is client-rendered */}
      <HomeClient
        locale={locale}
        banners={marketplaceConfig.home.banners}
        carouselAriaLabel={carouselAriaLabel}
        slidePositionLabel={slidePositionLabel}
        nextLabel={nextLabel}
        previousLabel={previousLabel}
      />

      {/* Category chips — server-rendered <a> links */}
      <CategoryChipsNav
        categories={HOME_CATEGORIES}
        selectedCategory={selectedCategory}
        allLabel={allCategoriesLabel}
        ariaLabel={categoryChipsLabel}
        locale={locale}
      />

      {/* Listing grid — server-rendered cards via ScreenState */}
      <ListingGrid
        auctions={auctions}
        isLoading={false}
        error={error ? translate(locale, "common.error") : null}
        locale={locale}
        ariaLabel={listingsAriaLabel}
        emptyTitleKey={emptyTitleKey}
      />
    </main>
  );
}

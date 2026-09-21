/**
 * Server-rendered home listing grid (T031).
 *
 * ListingCard instances are rendered here, on the server. ScreenState remains
 * a client component solely for its interactive state chrome, receiving these
 * server-rendered cards through its children slot.
 */

import type { Auction, Locale } from "../../lib/api/types";
import type { MessageKey } from "../../messages/ar";
import type { ScreenState as ScreenStateType } from "../../lib/api/types";
import { formatMoney, translate } from "../../lib/i18n";
import { ScreenState } from "../shell/ScreenState";
import { Container, ResponsiveGrid } from "../shell/ResponsiveLayout";
import { ListingCard } from "./ListingCard";

export interface ListingGridProps {
  readonly auctions: readonly Auction[];
  readonly isLoading?: boolean;
  readonly error?: string | null;
  readonly locale: Locale;
  readonly ariaLabel: string;
  readonly emptyTitleKey: MessageKey;
}

function resolveState(
  isLoading: boolean,
  error: string | null,
  hasData: boolean,
): ScreenStateType {
  if (isLoading) return { state: "loading" };
  if (error) return { state: "error", retryEligible: true };
  if (!hasData) return { state: "empty" };
  return { state: "ready" };
}

function auctionPrice(auction: Auction, locale: Locale): string {
  if (auction.status === "live") {
    return formatMoney(locale, auction.currentPrice);
  }
  if (auction.status === "ended") {
    return formatMoney(locale, auction.finalPrice);
  }
  if (auction.status === "directSale") {
    return formatMoney(locale, auction.buyNowPrice);
  }
  return formatMoney(locale, auction.openingPrice);
}

function auctionThumbnail(auction: Auction): string {
  const first = auction.gallery[0];
  return first?.url ?? "/images/placeholder-auction.jpg";
}

function auctionThumbnailAlt(auction: Auction): string {
  const first = auction.gallery[0];
  return first?.alt ?? auction.title;
}

export function ListingGrid({
  auctions,
  isLoading = false,
  error = null,
  locale,
  ariaLabel,
  emptyTitleKey,
}: ListingGridProps) {
  const screenState = resolveState(isLoading, error, auctions.length > 0);

  return (
    <ScreenState
      state={screenState}
      loadingLabel={translate(locale, "common.loading")}
      emptyLabel={translate(locale, emptyTitleKey)}
      errorLabel={error ?? translate(locale, "common.error")}
      retryLabel={translate(locale, "common.retry")}
    >
      <Container>
        <section aria-label={ariaLabel}>
          <ResponsiveGrid>
            {auctions.map((auction) => (
              <ListingCard
                key={auction.id}
                id={auction.id}
                title={auction.title}
                status={auction.status}
                statusLabelKey={`status.${auction.status}` as MessageKey}
                priceFormatted={auctionPrice(auction, locale)}
                thumbnailUrl={auctionThumbnail(auction)}
                thumbnailAlt={auctionThumbnailAlt(auction)}
                seller={auction.seller}
                locale={locale}
              />
            ))}
          </ResponsiveGrid>
        </section>
      </Container>
    </ScreenState>
  );
}

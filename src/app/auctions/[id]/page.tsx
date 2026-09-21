/* eslint-disable @next/next/no-img-element */
import type { Auction } from "../../../lib/api/types";
import { ApiClient } from "../../../lib/api/api-client";
import { formatMoney, translate } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n/server";
import { hasRequiredAuctionMedia } from "../../../lib/media";
import { googleMapsUrl } from "../../../config/marketplace";
import { DetailsTabs } from "../../../components/domain/DetailsTabs";
import { MediaGallery } from "../../../components/domain/MediaGallery";
import { StatusBadge } from "../../../components/domain/StatusBadge";
import {
  Breadcrumb,
  Container,
  TwoColumnLayout,
} from "../../../components/shell/ResponsiveLayout";
import { ScreenState } from "../../../components/shell/ScreenState";

function displayedPrice(auction: Auction) {
  if (auction.status === "live") return auction.currentPrice;
  if (auction.status === "ended") return auction.finalPrice;
  return auction.buyNowPrice ?? auction.openingPrice;
}

export default async function AuctionDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const [locale, { id }] = await Promise.all([getRequestLocale(), params]);
  let auction: Auction | null = null;
  let error = translate(locale, "common.error");
  let retryEligible = true;

  try {
    const result = await new ApiClient().getAuctionDetail(id);
    if (result.status === "success") {
      auction = result.data;
    } else if (result.status === "error") {
      error =
        result.kind === "notFound"
          ? translate(locale, "auctionDetail.notFound")
          : result.message;
      retryEligible = result.retryEligible;
    }
  } catch {
    // Network failures are rendered by the defined screen error state.
  }

  const state = !auction
    ? { state: "error" as const, retryEligible }
    : !hasRequiredAuctionMedia(auction.gallery)
      ? { state: "error" as const, retryEligible: false }
      : { state: "ready" as const };
  const errorLabel =
    auction && !hasRequiredAuctionMedia(auction.gallery)
      ? translate(locale, "auctionDetail.mediaInvalid")
      : error;

  return (
    <main>
      <Container className="py-6">
        <Breadcrumb
          ariaLabel={translate(locale, "auctionDetail.breadcrumb")}
          items={[
            { href: "/auctions", label: translate(locale, "nav.auctions") },
            {
              href: `/auctions/${id}`,
              label:
                auction?.title ?? translate(locale, "auctionDetail.breadcrumb"),
            },
          ]}
        />
        <ScreenState
          state={state}
          loadingLabel={translate(locale, "common.loading")}
          emptyLabel={translate(locale, "common.empty")}
          errorLabel={errorLabel}
          retryLabel={translate(locale, "common.retry")}
        >
          {auction && <AuctionDetail auction={auction} locale={locale} />}
        </ScreenState>
      </Container>
    </main>
  );
}

function AuctionDetail({
  auction,
  locale,
}: {
  readonly auction: Auction;
  readonly locale: "ar" | "en";
}) {
  const price = formatMoney(locale, displayedPrice(auction));
  return (
    <TwoColumnLayout
      main={
        <div className="space-y-6">
          <MediaGallery
            media={auction.gallery}
            labels={{
              gallery: translate(locale, "auctionDetail.gallery"),
              previous: translate(locale, "auctionDetail.previousMedia"),
              next: translate(locale, "auctionDetail.nextMedia"),
              videoDescription: translate(
                locale,
                "auctionDetail.videoDescription",
              ),
              invalid: translate(locale, "auctionDetail.mediaInvalid"),
            }}
          />
          <DetailsTabs
            details={auction.details}
            labels={{
              specifications: translate(locale, "auctionDetail.specifications"),
              features: translate(locale, "auctionDetail.features"),
              inspection: translate(locale, "auctionDetail.inspection"),
            }}
          />
          <SellerCard auction={auction} locale={locale} />
          <section
            aria-labelledby="auction-location"
            className="rounded-lg bg-surface-white-bg p-4 shadow-card"
          >
            <h2 id="auction-location" className="text-h3 text-text-primary">
              {translate(locale, "auctionDetail.location")}
            </h2>
            <a
              href={googleMapsUrl(auction.location.label)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${translate(locale, "auctionDetail.openMaps")}: ${auction.location.label}`}
              className="mt-2 inline-block text-body text-action-primary underline"
            >
              {auction.location.label}
            </a>
          </section>
        </div>
      }
      sidebar={
        <aside className="space-y-3 rounded-lg bg-surface-white-bg p-4 shadow-card">
          <StatusBadge
            status={auction.status}
            label={translate(locale, `status.${auction.status}`)}
          />
          <h1 className="text-h2 text-text-primary">{auction.title}</h1>
          <p className="text-h3 font-semibold text-text-primary">{price}</p>
        </aside>
      }
    />
  );
}

function SellerCard({
  auction,
  locale,
}: {
  readonly auction: Auction;
  readonly locale: "ar" | "en";
}) {
  const seller = auction.seller;
  return (
    <section
      aria-labelledby="auction-seller"
      className="rounded-lg bg-surface-white-bg p-4 shadow-card"
    >
      <h2 id="auction-seller" className="text-h3 text-text-primary">
        {translate(locale, "auctionDetail.seller")}
      </h2>
      {seller.kind === "company" ? (
        <div className="mt-3 flex items-center gap-3">
          <img
            src={seller.logoUrl}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="text-body font-semibold text-text-primary">
              {seller.name}
            </p>
            <a
              href={seller.previousAuctionsPath}
              className="text-body-sm text-action-primary underline"
            >
              {translate(locale, "auctionDetail.previousAuctions")}
            </a>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-body text-text-primary">
          {translate(locale, "seller.privateOwner")}
        </p>
      )}
    </section>
  );
}

"use client";

import type { AuctionStatus, Seller } from "../../lib/api/types";
import type { PreservedIntent } from "../../lib/api/result";
import type { MessageKey } from "../../messages/ar";
import { useState } from "react";
import { translate } from "../../lib/i18n";
import type { Locale } from "../../lib/api/types";
import { FavoriteButton } from "./FavoriteButton";
import { StatusBadge } from "./StatusBadge";
import { LoginRequired } from "../../features/auth/LoginRequired";

export interface ListingCardProps {
  readonly id: string;
  readonly title: string;
  readonly status: AuctionStatus;
  readonly statusLabelKey: MessageKey;
  readonly priceFormatted: string;
  readonly timeLabel?: string;
  readonly thumbnailUrl: string;
  readonly thumbnailAlt: string;
  readonly seller: Seller;
  readonly isFavorited?: boolean;
  readonly onFavoriteToggle?: (favorited: boolean) => void;
  readonly onRequireLogin?: () => void;
  readonly href?: string;
  readonly locale: Locale;
}

function sellerDisplayName(seller: Seller, locale: Locale): string {
  if (seller.kind === "individual" && seller.displayAsPrivateOwner) {
    return translate(locale, "seller.privateOwner");
  }
  if (seller.kind === "company") {
    return seller.name;
  }
  return translate(locale, "seller.privateOwner");
}

export function ListingCard({
  id,
  title,
  status,
  statusLabelKey,
  priceFormatted,
  timeLabel,
  thumbnailUrl,
  thumbnailAlt,
  seller,
  isFavorited = false,
  onFavoriteToggle,
  onRequireLogin,
  href,
  locale,
}: ListingCardProps) {
  const [isLoginRequiredOpen, setLoginRequiredOpen] = useState(false);
  const [loginIntent, setLoginIntent] = useState<PreservedIntent | null>(null);
  const resolvedHref = href ?? `/auctions/${id}`;
  const sellerName = sellerDisplayName(seller, locale);

  function requireLogin(): void {
    if (onRequireLogin) {
      onRequireLogin();
      return;
    }
    const returnTo =
      typeof window === "undefined"
        ? "/"
        : `${window.location.pathname}${window.location.search}`;
    setLoginIntent({ intent: "favorite", returnTo });
    setLoginRequiredOpen(true);
  }

  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg bg-surface-white-bg shadow-card">
      <a
        href={resolvedHref}
        className="relative block aspect-[4/3] overflow-hidden"
        aria-label={title}
      >
        <img
          src={thumbnailUrl}
          alt={thumbnailAlt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute start-2 top-2">
          <StatusBadge
            status={status}
            label={translate(locale, statusLabelKey)}
          />
        </div>
      </a>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <a href={resolvedHref} className="block">
          <h3 className="line-clamp-2 text-h3 font-semibold text-text-primary">
            {title}
          </h3>
        </a>

        <div className="flex items-center gap-2">
          {seller.kind === "company" && "logoUrl" in seller ? (
            <img
              src={seller.logoUrl}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full object-cover"
              aria-hidden="true"
            />
          ) : seller.kind === "individual" &&
            "photoUrl" in seller &&
            seller.photoUrl ? (
            <img
              src={seller.photoUrl}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full object-cover"
              aria-hidden="true"
            />
          ) : null}
          <span className="truncate text-body-sm text-text-sub-text">
            {sellerName}
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-label font-semibold text-text-primary">
              {priceFormatted}
            </span>
            {timeLabel && (
              <span className="text-caption text-text-sub-text">
                {timeLabel}
              </span>
            )}
          </div>

          <FavoriteButton
            isFavorited={isFavorited}
            onToggle={onFavoriteToggle}
            onRequireLogin={requireLogin}
            label={translate(locale, "common.favorite")}
            removeLabel={translate(locale, "common.removeFavorite")}
          />
        </div>
      </div>
      <LoginRequired
        open={isLoginRequiredOpen}
        onOpenChange={setLoginRequiredOpen}
        intent={loginIntent ?? { intent: "favorite", returnTo: "/" }}
      />
    </article>
  );
}

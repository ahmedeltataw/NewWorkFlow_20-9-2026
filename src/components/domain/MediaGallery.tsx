"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import type { MediaGallery as MediaGalleryAssets } from "../../lib/api/types";
import { Icon } from "../primitives/Icon";
import { FOCUS_RING } from "../primitives/utils";

export interface MediaGalleryLabels {
  readonly gallery: string;
  readonly previous: string;
  readonly next: string;
  readonly videoDescription: string;
  readonly invalid: string;
}

export interface MediaGalleryProps {
  readonly media: MediaGalleryAssets;
  readonly labels: MediaGalleryLabels;
}

/** FR-031 requires four images and one video before an auction can be presented. */
export function hasRequiredAuctionMedia(media: MediaGalleryAssets): boolean {
  return (
    media.filter((asset) => asset.kind === "image").length >= 4 &&
    media.some((asset) => asset.kind === "video")
  );
}

export function MediaGallery({ media, labels }: MediaGalleryProps) {
  const orderedMedia = useMemo(
    () =>
      [...media].sort((first, second) => first.sortOrder - second.sortOrder),
    [media],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!hasRequiredAuctionMedia(orderedMedia)) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-status-error p-4 text-body text-text-white"
      >
        {labels.invalid}
      </p>
    );
  }

  const selected = orderedMedia[selectedIndex] ?? orderedMedia[0];
  if (!selected) return null;
  const previous = () =>
    setSelectedIndex((current) =>
      current === 0 ? orderedMedia.length - 1 : current - 1,
    );
  const next = () =>
    setSelectedIndex((current) => (current + 1) % orderedMedia.length);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isRtl = document.dir === "rtl";
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (isRtl) previous();
      else next();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (isRtl) next();
      else previous();
    }
  };

  return (
    <section
      aria-label={labels.gallery}
      onKeyDown={handleKeyDown}
      className="space-y-3"
    >
      <div className="relative overflow-hidden rounded-lg bg-neutral-100">
        {selected.kind === "image" ? (
          <img
            src={selected.url}
            alt={selected.alt}
            aria-label={`${selected.alt}. ${selected.accessibilityDescription}`}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <video
            controls
            src={selected.url}
            aria-label={`${selected.alt}. ${labels.videoDescription.replace("{0}", selected.accessibilityDescription)}`}
            className="aspect-[4/3] w-full bg-neutral-900 object-contain"
          />
        )}
        <div className="absolute inset-x-3 bottom-3 flex justify-between gap-3">
          <button
            type="button"
            aria-label={labels.previous}
            onClick={previous}
            className={`rounded-full bg-surface-white-bg p-2 text-text-primary ${FOCUS_RING}`}
          >
            <Icon name="chevron-start" size="sm" mirrorInRtl />
          </button>
          <button
            type="button"
            aria-label={labels.next}
            onClick={next}
            className={`rounded-full bg-surface-white-bg p-2 text-text-primary ${FOCUS_RING}`}
          >
            <Icon name="chevron-end" size="sm" mirrorInRtl />
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {orderedMedia.map((asset, index) => (
          <button
            key={asset.id}
            type="button"
            aria-label={asset.accessibilityDescription}
            aria-current={index === selectedIndex ? "true" : undefined}
            onClick={() => setSelectedIndex(index)}
            className={`shrink-0 overflow-hidden rounded-md ${FOCUS_RING}`}
          >
            {asset.kind === "image" ? (
              <img
                src={asset.url}
                alt={asset.alt}
                className="h-16 w-20 object-cover"
              />
            ) : (
              <span className="flex h-16 w-20 items-center justify-center bg-neutral-900 text-body-sm text-text-white">
                {asset.alt}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

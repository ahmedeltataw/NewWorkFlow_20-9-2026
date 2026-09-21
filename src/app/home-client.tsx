"use client";

/**
 * T031 — Client leaf for the home page.
 *
 * Renders only the interactive BannerCarousel and Onboarding.
 * Listing grid and category chips are now server-rendered by page.tsx.
 */

import type { Locale } from "../lib/api/types";
import type { BannerSlide } from "../components/domain/BannerCarousel";
import { BannerCarousel } from "../components/domain/BannerCarousel";
import { Onboarding } from "../features/onboarding/Onboarding";

export interface HomeClientProps {
  readonly locale: Locale;
  readonly banners: readonly BannerSlide[];
  readonly carouselAriaLabel: string;
  readonly slidePositionLabel: string;
  readonly nextLabel: string;
  readonly previousLabel: string;
}

export function HomeClient({
  locale,
  banners,
  carouselAriaLabel,
  slidePositionLabel,
  nextLabel,
  previousLabel,
}: HomeClientProps) {
  return (
    <>
      <BannerCarousel
        slides={banners}
        ariaLabel={carouselAriaLabel}
        slidePositionLabel={slidePositionLabel}
        nextLabel={nextLabel}
        previousLabel={previousLabel}
        locale={locale}
        autoAdvanceMs={5000}
      />
      <Onboarding />
    </>
  );
}

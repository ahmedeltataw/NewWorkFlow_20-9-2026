"use client";

/**
 * Accessible banner carousel for the home page (T031).
 *
 * Implements WCAG carousel semantics: a labelled region, reachable slides,
 * keyboard-operable controls, no auto-advance that traps or disorients.
 * Auto-advance pauses on hover/focus and respects prefers-reduced-motion.
 * Direction follows the document direction (RTL-first).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Icon } from "../primitives/Icon";
import { cx, FOCUS_RING } from "../primitives/utils";
import type { MessageKey } from "../../messages/ar";
import type { Locale } from "../../lib/api/types";
import { translate } from "../../lib/i18n";

export interface BannerSlide {
  readonly id: string;
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly href: string;
  readonly imageUrl?: string;
}

export interface BannerCarouselProps {
  readonly slides: readonly BannerSlide[];
  readonly ariaLabel: string;
  readonly slidePositionLabel: string;
  readonly nextLabel: string;
  readonly previousLabel: string;
  readonly locale: Locale;
  readonly autoAdvanceMs?: number;
}

export function BannerCarousel({
  slides,
  ariaLabel,
  slidePositionLabel,
  nextLabel,
  previousLabel,
  locale,
  autoAdvanceMs = 5000,
}: BannerCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mq.matches;
    function onChange(e: MediaQueryListEvent) {
      prefersReducedMotion.current = e.matches;
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const pauseOnHoverOrFocus = useCallback(() => setIsPaused(true), []);
  const resumeFromHoverOrFocus = useCallback(() => setIsPaused(false), []);

  // Auto-advance
  useEffect(() => {
    if (isPaused || prefersReducedMotion.current || slides.length <= 1) return;

    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoAdvanceMs);

    return () => clearInterval(id);
  }, [isPaused, autoAdvanceMs, slides.length]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentSlide(index);
      // Announce slide change to assistive technology
      const region = regionRef.current;
      if (region) {
        const text = slidePositionLabel
          .replace("{0}", String(index + 1))
          .replace("{1}", String(slides.length));
        region.setAttribute("aria-label", `${ariaLabel} — ${text}`);
      }
    },
    [ariaLabel, slidePositionLabel, slides.length],
  );

  const goNext = useCallback(() => {
    goTo((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goTo]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    [goNext, goPrev],
  );

  const positionLabel = useMemo(
    () =>
      slidePositionLabel
        .replace("{0}", String(currentSlide + 1))
        .replace("{1}", String(slides.length)),
    [currentSlide, slides.length, slidePositionLabel],
  );

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className="relative w-full overflow-hidden rounded-lg"
      onMouseEnter={pauseOnHoverOrFocus}
      onMouseLeave={resumeFromHoverOrFocus}
      onFocus={pauseOnHoverOrFocus}
      onBlur={resumeFromHoverOrFocus}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={regionRef}
        role="group"
        aria-roledescription="slide"
        aria-label={positionLabel}
        className="relative aspect-[16/5] w-full md:aspect-[16/5]"
      >
        {slides.map((s, index) => {
          const isActive = index === currentSlide;
          const title = translate(locale, s.titleKey);
          const description = translate(locale, s.descriptionKey);

          return (
            <a
              key={s.id}
              href={s.href}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              className={cx(
                "absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center transition-opacity duration-500",
                isActive ? "opacity-100" : "pointer-events-none opacity-0",
                s.imageUrl
                  ? "bg-cover bg-center"
                  : "bg-gradient-to-br from-primary-50 to-primary-100",
              )}
              style={
                s.imageUrl ? { backgroundImage: `url(${s.imageUrl})` } : undefined
              }
            >
              {!s.imageUrl && (
                <div className="absolute inset-0 bg-base-black/30" aria-hidden="true" />
              )}
              <h2
                className={cx(
                  "relative z-10 text-h1 font-bold",
                  s.imageUrl ? "text-text-white" : "text-text-primary",
                )}
              >
                {title}
              </h2>
              <p
                className={cx(
                  "relative z-10 max-w-lg text-body",
                  s.imageUrl ? "text-text-white/90" : "text-text-sub-text",
                )}
              >
                {description}
              </p>
            </a>
          );
        })}
      </div>

      {/* Navigation controls */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className={cx(
              "absolute start-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
              "bg-base-black/40 text-text-white transition-colors hover:bg-base-black/60",
              FOCUS_RING,
            )}
            aria-label={previousLabel}
          >
            <Icon name="chevron-start" size="md" mirrorInRtl />
          </button>
          <button
            type="button"
            onClick={goNext}
            className={cx(
              "absolute end-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full",
              "bg-base-black/40 text-text-white transition-colors hover:bg-base-black/60",
              FOCUS_RING,
            )}
            aria-label={nextLabel}
          >
            <Icon name="chevron-end" size="md" mirrorInRtl />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <nav
          aria-label={positionLabel}
          className="absolute bottom-3 start-0 end-0 z-10 flex items-center justify-center gap-2"
        >
          {slides.map((s, index) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(index)}
              className={cx(
                "h-2 rounded-full transition-all duration-200",
                index === currentSlide
                  ? "w-6 bg-action-primary"
                  : "w-2 bg-base-white/60",
                FOCUS_RING,
              )}
              aria-label={slidePositionLabel
                .replace("{0}", String(index + 1))
                .replace("{1}", String(slides.length))}
              aria-current={index === currentSlide ? "step" : undefined}
            />
          ))}
        </nav>
      )}
    </section>
  );
}

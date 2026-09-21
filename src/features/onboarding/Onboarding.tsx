"use client";

/**
 * First-visit onboarding overlay (T030).
 *
 * Renders a modal-style overlay with introductory slides and a language
 * selection step. Appears on first visit only; persists the "seen" flag
 * in localStorage. Skippable at any point — the user can dismiss it and
 * reach the app immediately.
 *
 * Accessibility: dialog semantics via role="dialog", aria-modal, labelled
 * by the title, focus trapped inside, Escape to dismiss, labelled skip
 * control. Keyboard users can skip without a mouse.
 *
 * RTL-first, Arabic primary. Logical CSS properties only.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "../../components/primitives/Button";
import { Icon } from "../../components/primitives/Icon";
import { cx, FOCUS_RING } from "../../components/primitives/utils";
import { useI18n } from "../../lib/i18n/locale-provider";
import type { Locale } from "../../lib/api/types";
import type { IconName } from "../../components/primitives/Icon";
import type { MessageKey } from "../../messages/ar";

import { hasSeenOnboarding, markOnboardingSeen } from "./persistence";

export interface OnboardingProps {
  /** Called after the user dismisses (skip, get-started, or completion). */
  onComplete?: () => void;
}

interface Slide {
  readonly titleKey: MessageKey;
  readonly descriptionKey: MessageKey;
  readonly icon: IconName;
}

const SLIDES: readonly Slide[] = [
  {
    titleKey: "onboarding.discover.title",
    descriptionKey: "onboarding.discover.description",
    icon: "search",
  },
  {
    titleKey: "onboarding.liveBidding.title",
    descriptionKey: "onboarding.liveBidding.description",
    icon: "check",
  },
  {
    titleKey: "onboarding.winning.title",
    descriptionKey: "onboarding.winning.description",
    icon: "alert",
  },
] as const;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Onboarding({ onComplete }: OnboardingProps) {
  const [visible, setVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { locale, setLocale, t } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // SSR-safe: only read localStorage after mount
  useEffect(() => {
    if (!hasSeenOnboarding()) {
      setVisible(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    markOnboardingSeen();
    setVisible(false);
    onComplete?.();
    // Return focus to previously focused element
    const prev = previousFocus.current;
    if (prev && prev.isConnected) {
      prev.focus({ preventScroll: true });
    }
    previousFocus.current = null;
  }, [onComplete]);

  // Focus trap and escape handling
  useEffect(() => {
    if (!visible) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    // Remember what had focus before the dialog opened
    const active = document.activeElement;
    previousFocus.current = active instanceof HTMLElement ? active : null;

    // Move initial focus into the dialog
    dialog.focus({ preventScroll: true });

    function handleKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = Array.from(
        dialogRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hidden && !el.closest('[aria-hidden="true"]'));

      if (focusables.length === 0) {
        event.preventDefault();
        dialogRef.current!.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, dismiss]);

  const handleLanguageToggle = useCallback(
    (next: Locale) => {
      setLocale(next);
    },
    [setLocale],
  );

  const goToNext = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((s) => s + 1);
    } else {
      dismiss();
    }
  }, [currentSlide, dismiss]);

  const slide = SLIDES[currentSlide]!;
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const slideContent = useMemo(
    () => (
      <div className="flex flex-col items-center gap-6 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-action-primary/10"
          aria-hidden="true"
        >
          <Icon name={slide.icon} size="lg" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 id="onboarding-title" className="text-h2 text-text-primary">
            {t(slide.titleKey)}
          </h2>
          <p className="text-body text-text-sub-text max-w-sm">
            {t(slide.descriptionKey)}
          </p>
        </div>
      </div>
    ),
    [slide, t],
  );

  if (!visible) {
    return null;
  }

  const dialog = (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-base-black/50 pointer-events-auto"
        onClick={dismiss}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        tabIndex={-1}
        className={cx(
          "pointer-events-auto relative mx-4 flex w-full max-w-md flex-col",
          "rounded-2xl bg-surface-white-bg p-8 shadow-card",
          "outline-none",
        )}
      >
        {/* Header with language toggle and skip */}
        <header className="flex items-center justify-between">
          <Button
            variant="outline"
            size="md"
            onClick={() => handleLanguageToggle(locale === "ar" ? "en" : "ar")}
            aria-label={`${t("onboarding.selectLanguage")}: ${locale === "ar" ? "English" : "عربي"}`}
          >
            {locale === "ar" ? "English" : "عربي"}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className={cx(
              "inline-flex h-10 w-10 items-center justify-center rounded-full",
              "text-text-sub-text transition-colors hover:bg-surface-on-background",
              FOCUS_RING,
            )}
            aria-label={t("onboarding.skip")}
          >
            <Icon name="close" size="md" />
          </button>
        </header>

        {/* Slide content */}
        <div className="flex flex-1 flex-col items-center justify-center py-8">
          {slideContent}
        </div>

        {/* Dot indicators */}
        <nav
          aria-label={t("onboarding.progress")}
          className="flex items-center justify-center gap-2"
        >
          {SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSlide(index)}
              className={cx(
                "h-2 rounded-full transition-all duration-200",
                index === currentSlide
                  ? "w-6 bg-action-primary"
                  : "w-2 bg-neutral-300",
                FOCUS_RING,
              )}
              aria-label={t("onboarding.slidePosition")
                .replace("{0}", String(index + 1))
                .replace("{1}", String(SLIDES.length))}
              aria-current={index === currentSlide ? "step" : undefined}
            />
          ))}
        </nav>

        {/* Navigation buttons */}
        <footer className="mt-6 flex flex-col gap-3">
          <Button variant="solid" size="lg" fullWidth onClick={goToNext}>
            {isLastSlide ? t("onboarding.getStarted") : t("onboarding.next")}
          </Button>
          {!isLastSlide && (
            <Button variant="outline" size="lg" fullWidth onClick={dismiss}>
              {t("onboarding.skip")}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

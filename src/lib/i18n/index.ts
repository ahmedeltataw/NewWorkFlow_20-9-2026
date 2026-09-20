/**
 * Core internationalization module for the auction marketplace (T015).
 *
 * Owns, for both locales:
 *  - the ar/en message catalogues and the typed lookup (`translate`),
 *  - the resolved locale, direction, and persistence reading rules,
 *  - Western-digit number / SAR / BHD / Gregorian / Hijri formatters built on
 *    Intl (explicit locale and calendar options, no hand-rolled tables),
 *  - the mixed-direction isolation helper for Latin/numeral runs inside
 *    Arabic copy.
 *
 * Locale persistence (mechanism decision):
 *  This module reads the persisted locale from an HTTP cookie (`locale`),
 *  never from localStorage. The root layout is a Server Component that renders
 *  `<html lang dir>` before the client mounts; the server must therefore
 *  resolve the persisted preference from the incoming request. Cookies travel
 *  with every request, so the server-rendered markup and the persisted
 *  preference are the same value — no first-paint locale flash and no
 *  hydration mismatch. localStorage is invisible to the server and could only
 *  be applied after hydration, which contradicts the SSR-first requirement.
 *  The client switch writes the same cookie (see `locale-provider.tsx`).
 *
 * SSR safety: every function in this file is pure — none touch `request`,
 * `document`, or `next/headers`. Server-only cookie reads live in
 * `./server.ts`; client-only writes live in `./locale-provider.tsx`.
 */

import type { CurrencyCode, Locale, Money } from "../api/types";
import { messagesAr } from "../../messages/ar";
import type { MessageKey, Messages } from "../../messages/ar";
import { messagesEn } from "../../messages/en";

export type { MessageKey, Messages };
export { messagesAr, messagesEn };

export const SUPPORTED_LOCALES: readonly Locale[] = ["ar", "en"] as const;

/** Arabic is the primary locale (FR-001). */
export const DEFAULT_LOCALE: Locale = "ar";

/** Cookie name that persists the chosen locale across visits (FR-002). */
export const LOCALE_COOKIE_NAME = "locale";

export type Direction = "rtl" | "ltr";

/** Bidirectional direction each locale renders in (FR-001). */
export const LOCALE_DIRECTION: Record<Locale, Direction> = {
  ar: "rtl",
  en: "ltr",
};

export function isLocale(value: unknown): value is Locale {
  return value === "ar" || value === "en";
}

export function isRtlLocale(locale: Locale): boolean {
  return LOCALE_DIRECTION[locale] === "rtl";
}

export function normalizeLocale(
  value: unknown,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  return isLocale(value) ? value : fallback;
}

export function directionFor(locale: Locale): Direction {
  return LOCALE_DIRECTION[locale];
}

/** The catalogue for a locale; falls back to Arabic for unsupported values. */
export function getMessages(locale: Locale): Messages {
  return locale === "en" ? messagesEn : messagesAr;
}

/**
 * Type-safe lookup. `key` is restricted to real catalogue keys, so a missing
 * or misspelled key cannot compile; the return value is present for both
 * locales because `Messages` enforces the shared shape.
 */
export function translate(locale: Locale, key: MessageKey): string {
  return getMessages(locale)[key];
}

/* ------------------------------------------------------------------ *
 * Number and currency formatting (Western digits in both locales).
 * ------------------------------------------------------------------ */

/** Force Latin (Western) digits so prices read identically in ar and en. */
const LATIN_NUMBERING: Intl.NumberFormatOptions = {
  numberingSystem: "latn",
};

/**
 * Currency fraction digits derived from Intl, not a hand-rolled table:
 * SAR resolves to 2 decimals (halalas), BHD to 3 decimals (fils).
 */
export function currencyFractionDigits(currency: CurrencyCode): number {
  return (
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

/** Western-digit number formatting for the active locale. */
export function formatNumber(
  locale: Locale,
  amount: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return new Intl.NumberFormat(locale, {
    ...LATIN_NUMBERING,
    ...options,
  }).format(amount);
}

/**
 * Currency formatting from a minor-unit amount (`Money.amountMinor`), e.g.
 * 123450 SAR-minor -> "1,234.50 ر.س." and 1234567 BHD-minor -> "1,234.567 د.ب.".
 */
export function formatCurrency(
  locale: Locale,
  amountMinor: number,
  currency: CurrencyCode,
): string {
  const fractionDigits = currencyFractionDigits(currency);
  return new Intl.NumberFormat(locale, {
    ...LATIN_NUMBERING,
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountMinor / 10 ** fractionDigits);
}

/** Convenience wrapper for the domain `Money` value object. */
export function formatMoney(locale: Locale, money: Money): string {
  return formatCurrency(locale, money.amountMinor, money.currency);
}

/* ------------------------------------------------------------------ *
 * Gregorian and Hijri date formatting.
 * ------------------------------------------------------------------ */

export type DateInput = Date | string | number;

export function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Calendars the formatters support; array order documents precedence. */
export type CalendarId = "gregory" | "islamic" | "islamic-umalqura";

/** Hijri calendar used by Saudi Arabia: Um Al-Qura, the civil calendar. */
export const HIJRI_CALENDAR: CalendarId = "islamic-umalqura";

/**
 * Gregorian date formatting with an explicit `gregory` calendar and Western
 * digits — always Gregorian, regardless of the locale's default region.
 */
export function formatGregorianDate(
  locale: Locale,
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return formatDateWithCalendar(locale, "gregory", value, options);
}

/**
 * Hijri (Um Al-Qura) date formatting with an explicit calendar. Used where
 * the domain states a Hijri date, e.g. a national ID starting with 1 selects a
 * Hijri date of birth (FR-013, PRD FR-2.5).
 */
export function formatHijriDate(
  locale: Locale,
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return formatDateWithCalendar(locale, HIJRI_CALENDAR, value, options);
}

/** Generic date formatting with an explicit calendar and Western digits. */
export function formatDateWithCalendar(
  locale: Locale,
  calendar: CalendarId,
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat(locale, {
    ...LATIN_NUMBERING,
    calendar,
    ...options,
  }).format(toDate(value));
}

/* ------------------------------------------------------------------ *
 * Mixed-direction safety.
 * ------------------------------------------------------------------ */

/**
 * Isolates a Latin/Western-numeral run so it renders top-to-bottom-consistent
 * inside surrounding RTL text instead of being visually reordered by the
 * bidirectional algorithm. Uses the Unicode LRI/PDI controls:
 *   isolateLtrRun("BMW X5") -> "\u2066BMW X5\u2069"
 *
 * The UI wraps mixed-direction values (vehicle models, currency/dates that
 * contain Latin letters, reference numbers) with this helper, and keeps
 * wrapper elements direction-neutral in the DOM.
 */
export function isolateLtrRun(text: string): string {
  return `\u2066${text}\u2069`;
}

/* ------------------------------------------------------------------ *
 * Locale persistence: pure cookie parsing (SSR-safe).
 * ------------------------------------------------------------------ */

/** Parse a raw Cookie header into a name->value map. Never throws. */
export function parseCookieHeader(
  cookieHeader: string | null | undefined,
): ReadonlyMap<string, string> {
  const entries = new Map<string, string>();
  if (!cookieHeader) {
    return entries;
  }
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const name = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();
    if (!name || !rawValue) {
      continue;
    }
    try {
      entries.set(name, decodeURIComponent(rawValue));
    } catch {
      entries.set(name, rawValue);
    }
  }
  return entries;
}

/**
 * Resolve the persisted locale from a raw Cookie header value, falling back to
 * the default locale when absent or malformed. Used by the server helper
 * (`./server.ts`) and directly exercisable in tests.
 */
export function localeFromCookieHeader(
  cookieHeader: string | null | undefined,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  const value = parseCookieHeader(cookieHeader).get(LOCALE_COOKIE_NAME);
  return normalizeLocale(value, fallback);
}

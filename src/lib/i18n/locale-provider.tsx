"use client";

/**
 * Client-side locale provider and switching layer (T015).
 *
 * Exposes the active locale, direction, message lookup (`t`), and locale-bound
 * formatters to the component tree, plus `setLocale` which persists the choice
 * to the shared `locale` cookie (so the next server render matches), updates
 * the `<html lang dir>` attributes immediately, and refreshes the current
 * route so server-rendered content re-renders in the new language.
 *
 * This is the only provider/switching component the i18n foundation ships;
 * feature language-switch UI (T029) calls `setLocale`.
 */

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import type { CurrencyCode, Locale, Money } from "../api/types";
import type { MessageKey } from "../../messages/ar";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_DIRECTION,
  formatCurrency as formatCurrencyFor,
  formatGregorianDate as formatGregorianDateFor,
  formatHijriDate as formatHijriDateFor,
  formatMoney as formatMoneyFor,
  formatNumber as formatNumberFor,
  translate,
} from "./index";
import type { DateInput } from "./index";
import type { MessageValues } from "./index";

/** A year-long cookie lifetime; the locale preference is "across visits". */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export interface I18nContextValue {
  readonly locale: Locale;
  readonly dir: "rtl" | "ltr";
  readonly isRtl: boolean;
  readonly t: (key: MessageKey, values?: MessageValues) => string;
  readonly formatNumber: (
    amount: number,
    options?: Intl.NumberFormatOptions,
  ) => string;
  readonly formatCurrency: (
    amountMinor: number,
    currency: CurrencyCode,
  ) => string;
  readonly formatMoney: (money: Money) => string;
  readonly formatGregorianDate: (
    value: DateInput,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  readonly formatHijriDate: (
    value: DateInput,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  readonly setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: ReactNode;
}) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) {
        return;
      }
      document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
      document.documentElement.lang = next;
      document.documentElement.dir = LOCALE_DIRECTION[next];
      router.refresh();
    },
    [locale, router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: LOCALE_DIRECTION[locale],
      isRtl: LOCALE_DIRECTION[locale] === "rtl",
      t: (key, values) => translate(locale, key, values),
      formatNumber: (amount, options) =>
        formatNumberFor(locale, amount, options),
      formatCurrency: (amountMinor, currency) =>
        formatCurrencyFor(locale, amountMinor, currency),
      formatMoney: (money) => formatMoneyFor(locale, money),
      formatGregorianDate: (value, options) =>
        formatGregorianDateFor(locale, value, options),
      formatHijriDate: (value, options) =>
        formatHijriDateFor(locale, value, options),
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within a <LocaleProvider>");
  }
  return value;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

/** Convenience accessor for typed message lookup. */
export function useT() {
  return useI18n().t;
}

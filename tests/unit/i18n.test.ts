import { beforeEach, describe, expect, it, vi } from "vitest";

import { messagesAr } from "../../src/messages/ar";
import { messagesEn } from "../../src/messages/en";
import {
  DEFAULT_LOCALE,
  HIJRI_CALENDAR,
  LOCALE_COOKIE_NAME,
  LOCALE_DIRECTION,
  SUPPORTED_LOCALES,
  currencyFractionDigits,
  directionFor,
  formatCurrency,
  formatDateWithCalendar,
  formatGregorianDate,
  formatHijriDate,
  formatMoney,
  formatNumber,
  getMessages,
  isLocale,
  isRtlLocale,
  isolateLtrRun,
  localeFromCookieHeader,
  normalizeLocale,
  parseCookieHeader,
  toDate,
  translate,
} from "../../src/lib/i18n";
import { getRequestLocale } from "../../src/lib/i18n/server";

const { cookies: cookiesMock } = vi.hoisted(() => ({ cookies: vi.fn() }));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));

const JAN_15_2024 = new Date(2024, 0, 15);

const LONG_DATE_OPTIONS = {
  year: "numeric",
  month: "long",
  day: "numeric",
} as const;

function ArrayFromMap(
  map: ReadonlyMap<string, string>,
): Array<[string, string]> {
  return [...map.entries()];
}

describe("T016 catalogue key parity", () => {
  it("defines every ar key in en and every en key in ar at runtime", () => {
    const arKeys = Object.keys(messagesAr).sort();
    const enKeys = Object.keys(messagesEn).sort();
    expect(enKeys).toEqual(arKeys);
  });

  it("has no blank key names or values in either catalogue", () => {
    for (const [key, value] of Object.entries(messagesAr)) {
      expect(key.length).toBeGreaterThan(0);
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
    for (const [key, value] of Object.entries(messagesEn)) {
      expect(key.length).toBeGreaterThan(0);
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("resolves the same key to locale-appropriate copy", () => {
    expect(translate("ar", "status.live")).toBe("حالي");
    expect(translate("en", "status.live")).toBe("Live");
    expect(translate("ar", "banks.alrajhi")).toBe("مصرف الراجحي");
    expect(translate("en", "banks.alrajhi")).toBe("Al Rajhi Bank");
    expect(getMessages("ar")).toBe(messagesAr);
    expect(getMessages("en")).toBe(messagesEn);
  });
});

describe("T016 locale resolution and persistence", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it("defaults to Arabic with ar/en as the supported locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["ar", "en"]);
    expect(DEFAULT_LOCALE).toBe("ar");
    expect(LOCALE_COOKIE_NAME).toBe("locale");
  });

  it("recognizes only the two supported locales", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("en")).toBe(true);
    for (const value of ["fr", "", "AR", undefined, null, 0]) {
      expect(isLocale(value), `should reject ${String(value)}`).toBe(false);
    }
  });

  it("normalizes unknown values to the default or the given fallback", () => {
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("fr")).toBe("ar");
    expect(normalizeLocale(undefined)).toBe("ar");
    expect(normalizeLocale("xx", "en")).toBe("en");
  });

  it("parses cookie headers into name-value pairs without throwing", () => {
    const cookies = parseCookieHeader("locale=en; theme=dark; view=grid");
    expect(ArrayFromMap(cookies)).toEqual([
      ["locale", "en"],
      ["theme", "dark"],
      ["view", "grid"],
    ]);
    expect(ArrayFromMap(parseCookieHeader(null))).toEqual([]);
    expect(ArrayFromMap(parseCookieHeader(undefined))).toEqual([]);
    expect(ArrayFromMap(parseCookieHeader("no-equals-here"))).toEqual([]);
  });

  it("keeps malformed percent-encoding without throwing", () => {
    const cookies = parseCookieHeader("bad=%E0%A4%A");
    expect(cookies.get("bad")).toBe("%E0%A4%A");
  });

  it("reads the persisted locale cookie and falls back to the default", () => {
    expect(localeFromCookieHeader("locale=en")).toBe("en");
    expect(localeFromCookieHeader("theme=dark; locale=en")).toBe("en");
    expect(localeFromCookieHeader(undefined)).toBe("ar");
    expect(localeFromCookieHeader("")).toBe("ar");
    expect(localeFromCookieHeader("theme=dark")).toBe("ar");
  });

  it("falls back for unsupported or malformed stored values", () => {
    expect(localeFromCookieHeader("locale=fr")).toBe("ar");
    expect(localeFromCookieHeader("locale=%E0%A4%A")).toBe("ar");
  });

  it("honours a custom fallback for missing or unsupported cookies", () => {
    expect(localeFromCookieHeader(undefined, "en")).toBe("en");
    expect(localeFromCookieHeader("locale=fr", "en")).toBe("en");
  });

  it("resolves the server locale from a mocked request cookie", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "en" }),
    });
    await expect(getRequestLocale()).resolves.toBe("en");
  });

  it("falls back to the default server locale without a cookie", async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    await expect(getRequestLocale()).resolves.toBe("ar");
  });

  it("falls back for an unsupported server locale value", async () => {
    cookiesMock.mockResolvedValue({
      get: () => ({ value: "fr" }),
    });
    await expect(getRequestLocale()).resolves.toBe("ar");
  });
});

describe("T016 lang/dir resolution", () => {
  it("maps ar to rtl and en to ltr", () => {
    expect(LOCALE_DIRECTION).toEqual({ ar: "rtl", en: "ltr" });
    expect(directionFor("ar")).toBe("rtl");
    expect(directionFor("en")).toBe("ltr");
  });

  it("flags rtl with isRtlLocale", () => {
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("en")).toBe(false);
  });
});

describe("T016 Western-digit number formatting", () => {
  it("renders Western digits and grouping identically in both locales", () => {
    const en = formatNumber("en", 1234567.89);
    const ar = formatNumber("ar", 1234567.89);
    expect(en).toBe("1,234,567.89");
    expect(ar).toBe(en);
  });

  it("passes Intl numbering options through", () => {
    expect(formatNumber("en", 0.5, { style: "percent" })).toBe("50%");
    expect(formatNumber("en", 3.14159, { maximumFractionDigits: 2 })).toBe(
      "3.14",
    );
  });
});

describe("T016 SAR and BHD currency formatting", () => {
  it("uses two fraction digits (halalas) for SAR", () => {
    expect(currencyFractionDigits("SAR")).toBe(2);
    const value = formatCurrency("en", 123450, "SAR");
    expect(value).toMatch(/SAR/);
    expect(value).toMatch(/1,234\.50/);
    expect(formatCurrency("en", 1000, "SAR")).toMatch(/10\.00/);
  });

  it("uses three fraction digits (fils) for BHD", () => {
    expect(currencyFractionDigits("BHD")).toBe(3);
    const value = formatCurrency("en", 1234567, "BHD");
    expect(value).toMatch(/BHD/);
    expect(value).toMatch(/1,234\.567/);
    expect(formatCurrency("en", 5, "BHD")).toMatch(/0\.005/);
  });

  it("renders Western digits inside the Arabic currency output", () => {
    const sar = formatCurrency("ar", 123450, "SAR");
    expect(sar).toMatch(/1,234\.50/);
    expect(sar).toMatch(/ر\.س\./);
    const bhd = formatCurrency("ar", 1234567, "BHD");
    expect(bhd).toMatch(/1,234\.567/);
    expect(bhd).toMatch(/د\.ب\./);
  });

  it("formats the domain Money value object", () => {
    const money = { amountMinor: 1234567, currency: "BHD" } as const;
    expect(formatMoney("en", money)).toBe(formatCurrency("en", 1234567, "BHD"));
  });
});

describe("T016 Gregorian date formatting", () => {
  it("formats Gregorian dates in both locales", () => {
    expect(formatGregorianDate("en", JAN_15_2024, LONG_DATE_OPTIONS)).toBe(
      "January 15, 2024",
    );
    expect(formatGregorianDate("ar", JAN_15_2024, LONG_DATE_OPTIONS)).toBe(
      "15 يناير 2024",
    );
  });

  it("keeps the Gregorian year regardless of locale", () => {
    const ar = formatGregorianDate("ar", JAN_15_2024, { year: "numeric" });
    const en = formatGregorianDate("en", JAN_15_2024, { year: "numeric" });
    expect(ar).toMatch(/2024/);
    expect(en).toMatch(/2024/);
  });

  it("accepts Date, string, and timestamp inputs", () => {
    const expected = formatGregorianDate("en", JAN_15_2024, LONG_DATE_OPTIONS);
    expect(
      formatGregorianDate("en", "2024-01-15T00:00:00", LONG_DATE_OPTIONS),
    ).toBe(expected);
    expect(
      formatGregorianDate("en", JAN_15_2024.getTime(), LONG_DATE_OPTIONS),
    ).toBe(expected);
  });

  it("coerces inputs with toDate", () => {
    expect(toDate(JAN_15_2024)).toBe(JAN_15_2024);
    expect(toDate(JAN_15_2024.getTime()).getTime()).toBe(JAN_15_2024.getTime());
    expect(toDate("2024-01-15T00:00:00").getTime()).toBe(JAN_15_2024.getTime());
  });
});

describe("T016 Hijri (Um Al-Qura) date formatting", () => {
  it("uses the Um Al-Qura calendar", () => {
    expect(HIJRI_CALENDAR).toBe("islamic-umalqura");
  });

  it("produces a Hijri year that differs from the Gregorian year", () => {
    const hijri = formatHijriDate("en", JAN_15_2024, LONG_DATE_OPTIONS);
    const gregorian = formatGregorianDate("en", JAN_15_2024, LONG_DATE_OPTIONS);
    expect(hijri).not.toBe(gregorian);
    expect(hijri).toMatch(/1445/);
    expect(hijri).not.toMatch(/2024/);
  });

  it("renders Hijri in Arabic with the Hijri-era marker", () => {
    const hijriAr = formatHijriDate("ar", JAN_15_2024, LONG_DATE_OPTIONS);
    expect(hijriAr).toMatch(/1445/);
    expect(hijriAr).toMatch(/هـ/);
  });

  it("honours an explicit calendar through formatDateWithCalendar", () => {
    const islamic = formatDateWithCalendar("en", "islamic", JAN_15_2024, {
      year: "numeric",
    });
    const gregory = formatDateWithCalendar("en", "gregory", JAN_15_2024, {
      year: "numeric",
    });
    expect(islamic).toMatch(/1445/);
    expect(gregory).toMatch(/2024/);
  });
});

describe("T016 mixed-direction helper", () => {
  it("wraps Latin runs in LRI/PDI isolation controls", () => {
    expect(isolateLtrRun("BMW X5")).toBe("\u2066BMW X5\u2069");
    expect(isolateLtrRun("123 ABC")).toBe("\u2066123 ABC\u2069");
  });

  it("preserves the wrapped text exactly", () => {
    const value = "فورد F-150 موديل 2024";
    expect(isolateLtrRun(value)).toBe(`\u2066${value}\u2069`);
  });
});

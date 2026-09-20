/**
 * Server-only locale resolution for the marketplace (T015).
 *
 * Reads the persisted `locale` cookie from the incoming request so the root
 * layout can render `<html lang dir>` on the server before hydration.
 * Cookies are used deliberately over localStorage so the server render and the
 * persisted preference are the same value (see `./index.ts`). This module
 * imports `next/headers` and must only be imported from Server Components.
 */

import { cookies } from "next/headers";

import type { Locale } from "../api/types";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, normalizeLocale } from "./index";

/**
 * The active locale for the current request. Reads the `locale` cookie and
 * falls back to Arabic (the primary locale) when it is absent or malformed.
 */
export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return normalizeLocale(value, DEFAULT_LOCALE);
}

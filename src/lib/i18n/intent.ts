/**
 * The one-time sign-in continuation used by LoginRequired.
 *
 * This lives beside the client-side i18n helpers because T035 explicitly
 * reserves this path. Its types intentionally reuse the API gate envelope:
 * `{ intent, returnTo }`, rather than translating it to a second shape.
 */

import type { GatedIntent, PreservedIntent } from "../api/result";

const STORAGE_KEY = "auction_login_intent";

const GATED_INTENTS: readonly GatedIntent[] = [
  "bid",
  "deposit",
  "buy-now",
  "favorite",
  "personal-area",
];

function isReturnPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  );
}

function isPreservedIntent(value: unknown): value is PreservedIntent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as {
    readonly intent?: unknown;
    readonly returnTo?: unknown;
  };
  return (
    typeof candidate.intent === "string" &&
    GATED_INTENTS.includes(candidate.intent as GatedIntent) &&
    isReturnPath(candidate.returnTo)
  );
}

/** Persist the exact payload emitted by a `gateRequired` API response. */
export function captureLoginIntent(intent: PreservedIntent): void {
  if (typeof window === "undefined" || !isPreservedIntent(intent)) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}

/**
 * Takes the pending continuation before returning it. Removing it first makes
 * a refresh, back navigation, or repeated completion callback harmless.
 */
export function restoreLoginIntent(): PreservedIntent | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isPreservedIntent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Discards a pending continuation when the sign-in journey is abandoned. */
export function clearLoginIntent(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A missing or unreadable store is equivalent to having no pending intent.
  }
}

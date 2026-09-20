/**
 * First-visit onboarding persistence (T030).
 *
 * Uses localStorage to persist a "seen" flag so the onboarding overlay
 * appears only once per browser. SSR-safe: all reads are gated behind a
 * typeof window check; a missing or unreadable store treats the user as
 * "not yet seen" and never throws during render.
 */

const STORAGE_KEY = "auction_onboarding_seen";

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingSeen(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage full or unavailable — silently ignore.
  }
}

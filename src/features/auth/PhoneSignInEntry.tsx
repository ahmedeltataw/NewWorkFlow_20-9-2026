"use client";

import { useRouter } from "next/navigation";

import { restoreLoginIntent } from "../../lib/i18n/intent";

/**
 * Phase 4 calls this after it has established a session. Keeping the seam
 * here prevents entering `/auth/phone` itself from accidentally consuming a
 * continuation before authentication has succeeded.
 */
export function useLoginIntentRestoration() {
  const router = useRouter();

  return function restoreAfterSignIn(): void {
    const intent = restoreLoginIntent();
    router.replace(intent?.returnTo ?? "/");
  };
}

/**
 * FR-019: Exclude ended auctions from the home feed.
 *
 * Extracted to a standalone module so tests can import and verify the
 * filter directly, and so page.tsx can call it without exporting from
 * a Next.js route file (which forbids non-route exports).
 */

import type { Auction } from "./api/types";

export function excludeEndedAuctions(
  auctions: readonly Auction[],
): readonly Auction[] {
  return auctions.filter((a) => a.status !== "ended");
}

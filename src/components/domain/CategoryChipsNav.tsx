/**
 * Server-rendered category chip navigation for the home page (T031).
 *
 * Each chip is an <a> link navigating to /?category=<slug>, so the server
 * re-renders with filtered data. The "All" chip links to /.
 * No client JS required.
 */

import type { AuctionCategory, Locale } from "../../lib/api/types";
import type { MessageKey } from "../../messages/ar";
import { translate } from "../../lib/i18n";
import Link from "next/link";

export interface CategoryNavOption {
  readonly category: AuctionCategory;
  readonly labelKey: MessageKey;
}

export interface CategoryChipsNavProps {
  readonly categories: readonly CategoryNavOption[];
  readonly selectedCategory: AuctionCategory | null;
  readonly allLabel: string;
  readonly ariaLabel: string;
  readonly locale: Locale;
}

export function CategoryChipsNav({
  categories,
  selectedCategory,
  allLabel,
  ariaLabel,
  locale,
}: CategoryChipsNavProps) {
  return (
    <nav aria-label={ariaLabel} className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/"
          aria-current={selectedCategory === null ? "page" : undefined}
          className={[
            "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            selectedCategory === null
              ? "border-action-primary bg-action-primary text-text-inverse"
              : "border-border-secondary bg-base-white text-text-primary hover:bg-surface-secondary",
          ].join(" ")}
        >
          {allLabel}
        </Link>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.category;
          return (
            <a
              key={cat.category}
              href={`/?category=${cat.category}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-action-primary bg-action-primary text-text-inverse"
                  : "border-border-secondary bg-base-white text-text-primary hover:bg-surface-secondary",
              ].join(" ")}
            >
              {translate(locale, cat.labelKey)}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

/**
 * Category chip row for the home page (T031).
 *
 * Renders category filter chips that let the user narrow the home feed
 * by auction category. Uses FilterChip for consistent styling and
 * accessibility.
 */

import { useCallback } from "react";
import { FilterChip } from "./FilterChip";
import type { AuctionCategory } from "../../lib/api/types";
import type { Locale } from "../../lib/api/types";
import type { MessageKey } from "../../messages/ar";
import { translate } from "../../lib/i18n";

export interface CategoryOption {
  readonly category: AuctionCategory;
  readonly labelKey: MessageKey;
}

export interface CategoryChipsProps {
  readonly categories: readonly CategoryOption[];
  readonly selectedCategory: AuctionCategory | null;
  readonly onCategoryChange: (category: AuctionCategory | null) => void;
  readonly allLabel: string;
  readonly ariaLabel: string;
  readonly locale: Locale;
}

export function CategoryChips({
  categories,
  selectedCategory,
  onCategoryChange,
  allLabel,
  ariaLabel,
  locale,
}: CategoryChipsProps) {
  const handleSelect = useCallback(
    (category: AuctionCategory, selected: boolean) => {
      onCategoryChange(selected ? category : null);
    },
    [onCategoryChange],
  );

  return (
    <nav aria-label={ariaLabel} className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label={allLabel}
          selected={selectedCategory === null}
          onSelect={(selected) => {
            if (selected) onCategoryChange(null);
          }}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat.category}
            label={translate(locale, cat.labelKey)}
            selected={selectedCategory === cat.category}
            onSelect={(selected) => handleSelect(cat.category, selected)}
          />
        ))}
      </div>
    </nav>
  );
}

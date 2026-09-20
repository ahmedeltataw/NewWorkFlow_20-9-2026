"use client";

import type { KeyboardEvent } from "react";
import { Icon } from "../primitives/Icon";
import { FOCUS_RING, cx } from "../primitives/utils";

export interface FilterChipProps {
  readonly label: string;
  readonly selected?: boolean;
  readonly removable?: boolean;
  readonly onSelect?: (selected: boolean) => void;
  readonly onRemove?: () => void;
  readonly disabled?: boolean;
}

export function FilterChip({
  label,
  selected = false,
  removable = false,
  onSelect,
  onRemove,
  disabled = false,
}: FilterChipProps) {
  function handleClick() {
    if (disabled) return;
    if (removable) {
      onRemove?.();
    } else {
      onSelect?.(!selected);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (removable && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      onRemove?.();
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={removable ? undefined : selected}
      aria-label={`${label}${removable ? " - remove" : ""}`}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-body-sm font-medium transition-colors",
        "select-none",
        selected
          ? "bg-action-primary text-text-white"
          : "border border-stroke-heavy bg-surface-white-bg text-text-primary hover:bg-surface-on-background",
        "disabled:cursor-not-allowed disabled:opacity-60",
        FOCUS_RING,
      )}
    >
      {label}
      {removable && (
        <span
          role="presentation"
          className="inline-flex items-center justify-center"
        >
          <Icon name="close" size="xs" />
        </span>
      )}
    </button>
  );
}

"use client";

import type { MouseEvent, KeyboardEvent } from "react";
import { FOCUS_RING, cx } from "../primitives/utils";

export interface FavoriteButtonProps {
  readonly isFavorited?: boolean;
  readonly onToggle?: (favorited: boolean) => void;
  readonly onRequireLogin?: () => void;
  readonly disabled?: boolean;
  readonly label: string;
  readonly removeLabel: string;
}

export function FavoriteButton({
  isFavorited = false,
  onToggle,
  onRequireLogin,
  disabled = false,
  label,
  removeLabel,
}: FavoriteButtonProps) {
  function handleToggle() {
    if (disabled) return;
    if (!onToggle && onRequireLogin) {
      onRequireLogin();
      return;
    }
    onToggle?.(!isFavorited);
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    handleToggle();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  }

  const activeLabel = isFavorited ? removeLabel : label;

  return (
    <button
      type="button"
      aria-label={activeLabel}
      aria-pressed={isFavorited}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cx(
        "inline-flex items-center justify-center rounded-full p-2 transition-colors",
        "text-text-sub-text hover:text-status-error",
        "disabled:cursor-not-allowed disabled:opacity-60",
        FOCUS_RING,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

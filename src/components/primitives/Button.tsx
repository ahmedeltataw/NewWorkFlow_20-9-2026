import type { ComponentPropsWithRef } from "react";
import { Icon, type IconSize } from "./Icon";
import { cx, FOCUS_RING } from "./utils";

export type ButtonSize = "md" | "lg";

export type ButtonVariant = "solid" | "outline";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: "h-10 px-5 text-label",
  lg: "h-11 px-6 text-h3",
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  solid:
    "bg-action-primary text-text-white shadow-button enabled:hover:bg-[color-mix(in_srgb,var(--color-action-primary)_92%,var(--color-base-black))] enabled:active:translate-y-px enabled:active:shadow-none",
  outline:
    "border border-stroke-heavy bg-surface-white-bg text-text-primary enabled:hover:bg-surface-on-background",
};

const ICON_SIZES: Record<ButtonSize, IconSize> = {
  md: "md",
  lg: "lg",
};

export function Button({
  variant = "solid",
  size = "md",
  loading = false,
  loadingLabel,
  fullWidth = false,
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...(loading ? { "aria-label": loadingLabel } : undefined)}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full select-none transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        FOCUS_RING,
        BUTTON_SIZES[size],
        BUTTON_VARIANTS[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Icon name="spinner" spin size={ICON_SIZES[size]} />}
      {children}
    </button>
  );
}

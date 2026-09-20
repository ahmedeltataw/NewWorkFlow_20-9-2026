import type { ComponentPropsWithRef } from "react";
import { Icon } from "./Icon";
import {
  cx,
  FOCUS_RING,
  FIELD_SIZES,
  FIELD_TRAILING_SPACES,
  type FieldSize,
} from "./utils";

export type SelectProps = Omit<ComponentPropsWithRef<"select">, "size"> & {
  size?: FieldSize;
  loading?: boolean;
};

export function Select({
  size = "sm",
  loading = false,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        className={cx(
          "w-full cursor-pointer appearance-none rounded-sm border border-stroke-heavy bg-surface-white-bg text-text-primary transition-colors",
          "disabled:cursor-not-allowed disabled:bg-surface-on-background disabled:text-text-disabled",
          "aria-invalid:border-status-error",
          FOCUS_RING,
          FIELD_SIZES[size],
          FIELD_TRAILING_SPACES[size],
          className,
        )}
        aria-busy={loading || undefined}
        {...props}
      >
        {children}
      </select>
      <Icon
        name={loading ? "spinner" : "chevron-down"}
        spin={loading}
        size={size === "lg" ? "lg" : "md"}
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-sub-text"
      />
    </div>
  );
}

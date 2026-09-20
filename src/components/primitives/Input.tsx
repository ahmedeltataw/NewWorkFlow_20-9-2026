import type { ComponentPropsWithRef } from "react";
import { Icon } from "./Icon";
import {
  cx,
  FOCUS_RING,
  FIELD_SIZES,
  FIELD_TRAILING_SPACES,
  type FieldSize,
} from "./utils";

export type InputProps = Omit<ComponentPropsWithRef<"input">, "size"> & {
  size?: FieldSize;
  loading?: boolean;
};

export function Input({
  size = "sm",
  loading = false,
  className,
  ...props
}: InputProps) {
  return (
    <div className="relative w-full">
      <input
        className={cx(
          "w-full rounded-sm border border-stroke-heavy bg-surface-white-bg text-text-primary transition-colors",
          "placeholder:text-text-placeholder",
          "disabled:cursor-not-allowed disabled:bg-surface-on-background disabled:text-text-disabled",
          "aria-invalid:border-status-error",
          FOCUS_RING,
          FIELD_SIZES[size],
          loading && FIELD_TRAILING_SPACES[size],
          className,
        )}
        aria-busy={loading || undefined}
        {...props}
      />
      {loading && (
        <Icon
          name="spinner"
          spin
          size={size === "lg" ? "lg" : "md"}
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-sub-text"
        />
      )}
    </div>
  );
}

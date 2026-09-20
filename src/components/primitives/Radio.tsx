import type { ComponentPropsWithRef, ReactNode } from "react";
import {
  CONTROL_BOX_SIZES,
  CONTROL_TEXT_SIZES,
  cx,
  type ControlSize,
} from "./utils";

export type RadioProps = Omit<ComponentPropsWithRef<"input">, "size"> & {
  size?: ControlSize;
  label?: ReactNode;
};

const DOT_SIZES: Record<ControlSize, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const BOX_STATES =
  "rounded-full border border-stroke-heavy bg-surface-white-bg transition-colors " +
  "group-has-[:checked]:border-action-primary group-has-[:disabled]:opacity-60";

const BOX_FOCUS =
  "group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 " +
  "group-has-[:focus-visible]:outline-solid group-has-[:focus-visible]:outline-stroke-primary";

export function Radio({ size = "sm", label, className, ...props }: RadioProps) {
  return (
    <label
      className={cx(
        "group inline-flex cursor-pointer items-center gap-3",
        "group-has-[:disabled]:cursor-not-allowed group-has-[:disabled]:opacity-60",
        className,
      )}
    >
      <input type="radio" className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className={cx(
          "inline-flex shrink-0 items-center justify-center",
          BOX_STATES,
          BOX_FOCUS,
          CONTROL_BOX_SIZES[size],
        )}
      >
        <span
          className={cx(
            "rounded-full bg-action-primary",
            "hidden group-has-[:checked]:inline-block",
            DOT_SIZES[size],
          )}
        />
      </span>
      {label !== undefined && (
        <span className={cx(CONTROL_TEXT_SIZES[size], "text-text-primary")}>
          {label}
        </span>
      )}
    </label>
  );
}

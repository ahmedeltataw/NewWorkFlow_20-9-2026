"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import { Icon, type IconSize } from "./Icon";
import {
  CONTROL_BOX_SIZES,
  CONTROL_TEXT_SIZES,
  cx,
  type ControlSize,
} from "./utils";

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "size"> & {
  size?: ControlSize;
  label?: ReactNode;
  indeterminate?: boolean;
};

const ICON_SIZES: Record<ControlSize, IconSize> = {
  sm: "xs",
  md: "sm",
  lg: "md",
};

const BOX_STATES =
  "border border-stroke-heavy bg-surface-white-bg text-text-white transition-colors " +
  "group-has-[:checked]:border-action-primary group-has-[:checked]:bg-action-primary " +
  "group-has-[:indeterminate]:border-action-primary group-has-[:indeterminate]:bg-action-primary " +
  "group-has-[:disabled]:opacity-60";

const BOX_FOCUS =
  "group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 " +
  "group-has-[:focus-visible]:outline-solid group-has-[:focus-visible]:outline-stroke-primary";

export function Checkbox({
  size = "sm",
  label,
  indeterminate = false,
  className,
  ref,
  ...props
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const setRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={cx(
        "group inline-flex cursor-pointer items-center gap-3",
        "group-has-[:disabled]:cursor-not-allowed group-has-[:disabled]:opacity-60",
        className,
      )}
    >
      <input type="checkbox" ref={setRef} className="peer sr-only" {...props} />
      <span
        aria-hidden="true"
        className={cx(
          "inline-flex shrink-0 items-center justify-center rounded-xs",
          BOX_STATES,
          BOX_FOCUS,
          CONTROL_BOX_SIZES[size],
        )}
      >
        <Icon
          name="check"
          size={ICON_SIZES[size]}
          className="hidden group-has-[:checked]:inline-block"
        />
        <Icon
          name="dash"
          size={ICON_SIZES[size]}
          className="hidden group-has-[:indeterminate]:inline-block"
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

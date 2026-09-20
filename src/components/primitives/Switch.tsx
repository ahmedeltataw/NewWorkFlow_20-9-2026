"use client";

import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { useId, useState } from "react";
import { cx, FOCUS_RING } from "./utils";

export type SwitchProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
};

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  className,
  onClick,
  ...props
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const labelId = useId();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const next = !isChecked;
    if (!isControlled) {
      setInternalChecked(next);
    }
    onCheckedChange?.(next);
    onClick?.(event);
  }

  const track = (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-labelledby={label !== undefined ? labelId : undefined}
      onClick={handleClick}
      className={cx(
        "relative inline-flex h-6 w-9 shrink-0 items-center rounded-full transition-colors",
        "bg-neutral-300 aria-checked:bg-action-primary",
        "disabled:cursor-not-allowed disabled:opacity-60",
        FOCUS_RING,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-text-white shadow-card transition-transform",
          "aria-checked:translate-x-6 rtl:aria-checked:-translate-x-6",
        )}
      />
    </button>
  );

  if (label === undefined) {
    return track;
  }

  return (
    <div className="inline-flex items-center gap-3">
      {track}
      <span id={labelId} className="text-body text-text-primary">
        {label}
      </span>
    </div>
  );
}

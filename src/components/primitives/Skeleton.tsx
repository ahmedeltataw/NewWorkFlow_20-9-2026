import type { ComponentPropsWithRef } from "react";
import { cx } from "./utils";

export type SkeletonVariant = "text" | "circle" | "rectangle";

export type SkeletonProps = ComponentPropsWithRef<"div"> & {
  variant?: SkeletonVariant;
  lines?: number;
};

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: "h-3",
  circle: "h-10 w-10 rounded-full",
  rectangle: "h-5",
};

export function Skeleton({
  variant = "rectangle",
  lines = 1,
  className,
  ...props
}: SkeletonProps) {
  const itemClass = cx(
    "animate-pulse rounded-sm bg-neutral-200",
    VARIANT_CLASSES[variant],
  );
  const count = Math.max(1, lines);

  if (count === 1) {
    return (
      <div
        aria-hidden="true"
        data-testid="skeleton"
        className={cx(itemClass, className)}
        {...props}
      />
    );
  }

  return (
    <div className={cx("space-y-2", className)} {...props}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          data-testid="skeleton"
          className={itemClass}
        />
      ))}
    </div>
  );
}

import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "./utils";

export type IconName =
  | "spinner"
  | "chevron-down"
  | "chevron-up"
  | "chevron-start"
  | "chevron-end"
  | "check"
  | "dash"
  | "close"
  | "search"
  | "alert"
  | "eye"
  | "eye-off";

export type IconSize = "xs" | "sm" | "md" | "lg";

const ICON_SIZE_CLASSES: Record<IconSize, string> = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

const PATHS: Record<IconName, ReactNode> = {
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  "chevron-start": <path d="m15 18-6-6 6-6" />,
  "chevron-end": <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  dash: <path d="M5 12h14" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="m2 2 20 20" />
    </>
  ),
};

export type IconProps = ComponentPropsWithRef<"svg"> & {
  name: IconName;
  size?: IconSize;
  spin?: boolean;
  mirrorInRtl?: boolean;
};

export function Icon({
  name,
  size = "md",
  spin = false,
  mirrorInRtl = false,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx(
        "shrink-0",
        ICON_SIZE_CLASSES[size],
        spin && "animate-spin",
        mirrorInRtl && "rtl:-scale-x-100",
        className,
      )}
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

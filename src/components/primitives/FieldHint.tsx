import type { ComponentPropsWithRef } from "react";
import { Icon, type IconName, type IconSize } from "./Icon";
import { cx, type FieldSize } from "./utils";

export type FieldHintTone = "default" | "error";

export type FieldHintProps = ComponentPropsWithRef<"p"> & {
  id: string;
  tone?: FieldHintTone;
  size?: FieldSize;
  icon?: IconName;
};

const TONE_CLASSES: Record<FieldHintTone, string> = {
  default: "text-text-sub-text",
  error: "text-status-error",
};

const TEXT_CLASSES: Record<FieldSize, string> = {
  sm: "text-caption",
  lg: "text-body-sm",
};

const ICON_SIZES: Record<FieldSize, IconSize> = {
  sm: "xs",
  lg: "sm",
};

export function FieldHint({
  id,
  tone = "default",
  size = "sm",
  icon,
  className,
  children,
  ...props
}: FieldHintProps) {
  return (
    <p
      id={id}
      className={cx(
        "flex items-center gap-2",
        TONE_CLASSES[tone],
        TEXT_CLASSES[size],
        className,
      )}
      {...props}
    >
      {icon !== undefined && <Icon name={icon} size={ICON_SIZES[size]} />}
      {children}
    </p>
  );
}

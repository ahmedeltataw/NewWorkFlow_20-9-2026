export type FieldSize = "sm" | "lg";

export type ControlSize = "sm" | "md" | "lg";

export const FIELD_SIZES: Record<FieldSize, string> = {
  sm: "h-10 px-4 text-body-sm",
  lg: "h-11 px-5 text-body",
};

export const FIELD_TRAILING_SPACES: Record<FieldSize, string> = {
  sm: "pe-9",
  lg: "pe-11",
};

export const CONTROL_BOX_SIZES: Record<ControlSize, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
};

export const CONTROL_TEXT_SIZES: Record<ControlSize, string> = {
  sm: "text-body-sm",
  md: "text-body",
  lg: "text-body",
};

export const FOCUS_RING =
  "focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-stroke-primary";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

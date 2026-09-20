export const GRAPHIK_ARABIC_FAMILY = '"Graphik Arabic"';

export const OUTFIT_FAMILY = '"Outfit"';

export const GRAPHIK_ARABIC_FALLBACK = [
  "Noto Sans Arabic",
  "Tahoma",
  "Segoe UI",
  "Arial",
];

export const OUTFIT_FALLBACK = [
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Helvetica Neue",
  "Arial",
];

export const EMOJI_FALLBACK = [
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Noto Color Emoji",
];

export const GENERIC_FAMILY = "sans-serif";

export const OUTFIT_WEIGHTS = [400, 600, 700];

export const GRAPHIK_ARABIC_STACK = [
  GRAPHIK_ARABIC_FAMILY,
  ...GRAPHIK_ARABIC_FALLBACK,
].join(", ");

export const OUTFIT_STACK = [OUTFIT_FAMILY, ...OUTFIT_FALLBACK].join(", ");

export const DOCUMENT_FONT_STACK = [
  GRAPHIK_ARABIC_STACK,
  OUTFIT_STACK,
  ...EMOJI_FALLBACK,
  GENERIC_FAMILY,
].join(", ");

export type FontVariable = "--font-graphik-arabic" | "--font-outfit";

export const fontVariables: Record<FontVariable, string> = {
  "--font-graphik-arabic": GRAPHIK_ARABIC_STACK,
  "--font-outfit": OUTFIT_STACK,
};

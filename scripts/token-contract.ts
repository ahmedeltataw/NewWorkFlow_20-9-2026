export interface PrimitiveColor {
  token: string;
  value: string;
}

export interface SemanticColor {
  token: string;
  cssVariable: string;
  source: string;
  resolved: string;
}

export interface SpacingStep {
  token: string;
  cssVariable: string;
  value: number;
}

export interface RadiusToken {
  token: string;
  cssVariable: string;
  value: number;
}

export interface ShadowColor {
  hex: string;
  opacity: number;
}

export interface Elevation {
  token: string;
  cssVariable: string;
  value: string;
}

export interface TextStyle {
  token: string;
  role: string;
  family: "Graphik Arabic";
  size: number;
  weight: 400 | 600 | 700;
  lineHeight: number;
  letterSpacing: number;
}

export interface LineHeightTier {
  maxSize: number;
  ratio: number;
}

export const PRIMITIVE_COLORS = [
  { token: "neutral/100", value: "#f8f8f8" },
  { token: "neutral/200", value: "#e9e9e9" },
  { token: "neutral/300", value: "#d6d6d6" },
  { token: "neutral/400", value: "#969696" },
  { token: "neutral/500", value: "#737373" },
  { token: "neutral/600", value: "#545454" },
  { token: "primary/0", value: "#fefcf8" },
  { token: "primary/50", value: "#fdecd6" },
  { token: "primary/100", value: "#fcdaad" },
  { token: "primary/200", value: "#fac16a" },
  { token: "primary/400", value: "#e7a736" },
  { token: "primary/500", value: "#a87524" },
  { token: "base/white", value: "#ffffff" },
  { token: "base/black", value: "#121212" },
  { token: "success/50", value: "#f0fdf4" },
  { token: "success/100", value: "#dcfce7" },
  { token: "success/500", value: "#22c55e" },
  { token: "success/600", value: "#16a34a" },
  { token: "success/700", value: "#15803d" },
  { token: "warning/50", value: "#fffbeb" },
  { token: "warning/100", value: "#fef3c7" },
  { token: "warning/500", value: "#f59e0b" },
  { token: "warning/600", value: "#d97706" },
  { token: "warning/700", value: "#b45309" },
  { token: "error/50", value: "#fff1f2" },
  { token: "error/100", value: "#ffe4e6" },
  { token: "error/500", value: "#ef4444" },
  { token: "error/600", value: "#dc2626" },
  { token: "error/700", value: "#b91c1c" },
  { token: "blue/50", value: "#f3f8ff" },
  { token: "blue/100", value: "#e6f0fe" },
  { token: "blue/500", value: "#7fb3fc" },
  { token: "blue/600", value: "#5195f4" },
  { token: "blue/700", value: "#1f7ffa" },
  { token: "indigo/0", value: "#f9fbff" },
  { token: "indigo/50", value: "#f6f8fc" },
  { token: "indigo/100", value: "#ecf0f8" },
  { token: "indigo/200", value: "#d9e1f1" },
  { token: "indigo/400", value: "#6081c6" },
  { token: "indigo/500", value: "#274cb1" },
] as const satisfies readonly PrimitiveColor[];

export const SEMANTIC_COLORS = [
  {
    token: "Surface/Background",
    cssVariable: "--surface-background",
    source: "primary/0",
    resolved: "#fefcf8",
  },
  {
    token: "Surface/WhiteBG",
    cssVariable: "--surface-white-bg",
    source: "base/white",
    resolved: "#ffffff",
  },
  {
    token: "Surface/onBackground",
    cssVariable: "--surface-on-background",
    source: "neutral/100",
    resolved: "#f8f8f8",
  },
  {
    token: "Surface/CardPrimaryBG",
    cssVariable: "--surface-card-primary-bg",
    source: "primary/50",
    resolved: "#fdecd6",
  },
  {
    token: "Surface/BackgroundLight",
    cssVariable: "--surface-background-light",
    source: "primary/100",
    resolved: "#fcdaad",
  },
  {
    token: "Surface/OnBackgroundLight",
    cssVariable: "--surface-on-background-light",
    source: "primary/50",
    resolved: "#fdecd6",
  },
  {
    token: "Surface/Disabled",
    cssVariable: "--surface-disabled",
    source: "neutral/400",
    resolved: "#969696",
  },
  {
    token: "Text/Primary",
    cssVariable: "--text-primary",
    source: "base/black",
    resolved: "#121212",
  },
  {
    token: "Text/Disabled",
    cssVariable: "--text-disabled",
    source: "neutral/600",
    resolved: "#545454",
  },
  {
    token: "Text/subText",
    cssVariable: "--text-sub-text",
    source: "neutral/500",
    resolved: "#737373",
  },
  {
    token: "Text/placeholder",
    cssVariable: "--text-placeholder",
    source: "neutral/400",
    resolved: "#969696",
  },
  {
    token: "Text/options",
    cssVariable: "--text-options",
    source: "neutral/300",
    resolved: "#d6d6d6",
  },
  {
    token: "Text/white",
    cssVariable: "--text-white",
    source: "base/white",
    resolved: "#ffffff",
  },
  {
    token: "Action/Primary",
    cssVariable: "--action-primary",
    source: "primary/500",
    resolved: "#a87524",
  },
  {
    token: "Status/Success",
    cssVariable: "--status-success",
    source: "success/600",
    resolved: "#16a34a",
  },
  {
    token: "Status/Error",
    cssVariable: "--status-error",
    source: "error/600",
    resolved: "#dc2626",
  },
  {
    token: "Status/ErrorBG",
    cssVariable: "--status-error-bg",
    source: "error/50",
    resolved: "#fff1f2",
  },
  {
    token: "Status/Warning",
    cssVariable: "--status-warning",
    source: "warning/600",
    resolved: "#d97706",
  },
  {
    token: "Stroke/light",
    cssVariable: "--stroke-light",
    source: "neutral/200",
    resolved: "#e9e9e9",
  },
  {
    token: "Stroke/havey",
    cssVariable: "--stroke-heavy",
    source: "neutral/300",
    resolved: "#d6d6d6",
  },
  {
    token: "Stroke/Primary",
    cssVariable: "--stroke-primary",
    source: "primary/200",
    resolved: "#fac16a",
  },
] as const satisfies readonly SemanticColor[];

export const SPACING = [
  { token: "spacing/1", cssVariable: "--space-1", value: 2 },
  { token: "spacing/2", cssVariable: "--space-2", value: 4 },
  { token: "spacing/3", cssVariable: "--space-3", value: 8 },
  { token: "spacing/4", cssVariable: "--space-4", value: 12 },
  { token: "spacing/5", cssVariable: "--space-5", value: 16 },
  { token: "spacing/6", cssVariable: "--space-6", value: 20 },
  { token: "spacing/7", cssVariable: "--space-7", value: 24 },
  { token: "spacing/8", cssVariable: "--space-8", value: 32 },
  { token: "spacing/9", cssVariable: "--space-9", value: 40 },
  { token: "spacing/10", cssVariable: "--space-10", value: 48 },
  { token: "spacing/11", cssVariable: "--space-11", value: 64 },
  { token: "spacing/12", cssVariable: "--space-12", value: 80 },
] as const satisfies readonly SpacingStep[];

export const RADII = [
  { token: "radius/none", cssVariable: "--radius-none", value: 0 },
  { token: "radius/xs", cssVariable: "--radius-xs", value: 4 },
  { token: "radius/sm", cssVariable: "--radius-sm", value: 8 },
  { token: "radius/md", cssVariable: "--radius-md", value: 12 },
  { token: "radius/lg", cssVariable: "--radius-lg", value: 16 },
  { token: "radius/xl", cssVariable: "--radius-xl", value: 24 },
  { token: "radius/2xl", cssVariable: "--radius-2xl", value: 32 },
  { token: "radius/full", cssVariable: "--radius-full", value: 9999 },
] as const satisfies readonly RadiusToken[];

export const SHADOW_COLORS = {
  "shadowColor/Button_inner_shadow": { hex: "#eda537", opacity: 1 },
  "shadowColor/Button_drop_shadow": { hex: "#4b4001", opacity: 0.15 },
  "shadowColor/Footer_drop_shadow": { hex: "#c7c7c7", opacity: 0.25 },
  "shadowColor/Card_drop_shadow": { hex: "#000000", opacity: 0.05 },
} as const satisfies Record<string, ShadowColor>;

export const ELEVATIONS = [
  {
    token: "Shadow/Card",
    cssVariable: "--shadow-card",
    value: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  {
    token: "Shadow/Button",
    cssVariable: "--shadow-button",
    value: "0 2px 8px rgba(75, 64, 1, 0.15), inset 0 1px 2px #eda537",
  },
  {
    token: "Shadow/Footer",
    cssVariable: "--shadow-footer",
    value: "0 -2px 12px rgba(199, 199, 199, 0.25)",
  },
] as const satisfies readonly Elevation[];

export const TEXT_STYLES = [
  {
    token: "Graphik Arabic/38px: Bold",
    role: "display / hero price",
    family: "Graphik Arabic",
    size: 38,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/30px: Bold",
    role: "page title",
    family: "Graphik Arabic",
    size: 30,
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/24px: Bold",
    role: "h1",
    family: "Graphik Arabic",
    size: 24,
    weight: 700,
    lineHeight: 1.3,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/24px: SemiBold",
    role: "h1 alt",
    family: "Graphik Arabic",
    size: 24,
    weight: 600,
    lineHeight: 1.3,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/18px: SemiBold",
    role: "h2",
    family: "Graphik Arabic",
    size: 18,
    weight: 600,
    lineHeight: 1.3,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/16px: SemiBold",
    role: "h3 / button",
    family: "Graphik Arabic",
    size: 16,
    weight: 600,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/16px: Regular",
    role: "body",
    family: "Graphik Arabic",
    size: 16,
    weight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/14px: SemiBold",
    role: "label",
    family: "Graphik Arabic",
    size: 14,
    weight: 600,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/14px: Regular",
    role: "body-sm",
    family: "Graphik Arabic",
    size: 14,
    weight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/12px: SemiBold",
    role: "caption-strong",
    family: "Graphik Arabic",
    size: 12,
    weight: 600,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/12px: Regular",
    role: "caption",
    family: "Graphik Arabic",
    size: 12,
    weight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/10px: SemiBold",
    role: "badge / tab label",
    family: "Graphik Arabic",
    size: 10,
    weight: 600,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  {
    token: "Graphik Arabic/10px: Regular",
    role: "micro",
    family: "Graphik Arabic",
    size: 10,
    weight: 400,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
] as const satisfies readonly TextStyle[];

export const LINE_HEIGHT_POLICY = [
  { maxSize: 16, ratio: 1.5 },
  { maxSize: 24, ratio: 1.3 },
  { maxSize: 38, ratio: 1.2 },
] as const satisfies readonly LineHeightTier[];

export const TOKEN_CONTRACT = {
  primitives: PRIMITIVE_COLORS,
  semanticColors: SEMANTIC_COLORS,
  spacing: SPACING,
  radii: RADII,
  shadowColors: SHADOW_COLORS,
  elevations: ELEVATIONS,
  textStyles: TEXT_STYLES,
  lineHeightPolicy: LINE_HEIGHT_POLICY,
};

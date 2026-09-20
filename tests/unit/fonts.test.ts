import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DOCUMENT_FONT_STACK,
  GRAPHIK_ARABIC_FAMILY,
  GRAPHIK_ARABIC_STACK,
  OUTFIT_FAMILY,
  OUTFIT_STACK,
  OUTFIT_WEIGHTS,
  fontVariables,
} from "../../src/app/fonts";

const CSS_GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
]);

function genericSignature(stack: string): {
  count: number;
  lastEntryIsGeneric: boolean;
} {
  const entries = stack.split(",").map((entry) => entry.trim());
  let count = 0;
  let lastGenericIndex = -1;
  entries.forEach((entry, index) => {
    if (CSS_GENERIC_FAMILIES.has(entry)) {
      count += 1;
      lastGenericIndex = index;
    }
  });
  return {
    count,
    lastEntryIsGeneric: count === 0 || lastGenericIndex === entries.length - 1,
  };
}

const tokensCss = readFileSync(
  join(process.cwd(), "src/styles/tokens.css"),
  "utf8",
);

describe("T014 font loading contract", () => {
  it("uses the documented 400/600/700 weight scale for Outfit", () => {
    expect([...OUTFIT_WEIGHTS]).toEqual([400, 600, 700]);
  });

  it("quotes multi-word family names for valid CSS font-family values", () => {
    expect(GRAPHIK_ARABIC_FAMILY).toBe('"Graphik Arabic"');
    expect(OUTFIT_FAMILY).toBe('"Outfit"');
  });

  it("leads each stack with its primary family", () => {
    expect(GRAPHIK_ARABIC_STACK.startsWith(GRAPHIK_ARABIC_FAMILY)).toBe(true);
    expect(OUTFIT_STACK.startsWith(OUTFIT_FAMILY)).toBe(true);
  });

  it("keeps Arabic and Latin named fallbacks", () => {
    expect(GRAPHIK_ARABIC_STACK).toContain("Noto Sans Arabic");
    expect(GRAPHIK_ARABIC_STACK).toContain("Tahoma");
    expect(OUTFIT_STACK).toContain("-apple-system");
  });

  it("keeps generic families out of fragments consumed by --font-sans", () => {
    expect(genericSignature(GRAPHIK_ARABIC_STACK).count).toBe(0);
    expect(genericSignature(OUTFIT_STACK).count).toBe(0);
  });

  it("composes DOCUMENT_FONT_STACK with one generic family as the last entry", () => {
    const signature = genericSignature(DOCUMENT_FONT_STACK);
    expect(signature.count).toBe(1);
    expect(signature.lastEntryIsGeneric).toBe(true);
    expect(DOCUMENT_FONT_STACK.startsWith(GRAPHIK_ARABIC_STACK)).toBe(true);
    expect(DOCUMENT_FONT_STACK).toContain(OUTFIT_STACK);
    expect(DOCUMENT_FONT_STACK).toContain("Apple Color Emoji");
  });

  it("declares --font-sans with one generic family as the last entry", () => {
    const match = tokensCss.match(/--font-sans:\s*([^;]+);/);
    expect(match?.[1]).toBeDefined();
    const signature = genericSignature(match?.[1] as string);
    expect(signature.count).toBe(1);
    expect(signature.lastEntryIsGeneric).toBe(true);
  });

  it("exposes the CSS variables consumed by the token pipeline", () => {
    expect(fontVariables).toHaveProperty("--font-graphik-arabic");
    expect(fontVariables).toHaveProperty("--font-outfit");
    expect(fontVariables["--font-graphik-arabic"]).toBe(GRAPHIK_ARABIC_STACK);
    expect(fontVariables["--font-outfit"]).toBe(OUTFIT_STACK);
  });
});

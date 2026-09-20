import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
import {
  FONT_DISPLAY,
  FONT_FACES,
  createFontFaces,
} from "../../scripts/font-faces.mjs";

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

type Runtime = ReturnType<typeof createFontFaces>;

function makeTempRuntime(label: string): { dir: string; runtime: Runtime } {
  const dir = join(
    tmpdir(),
    `p2-005-${label}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return { dir, runtime: createFontFaces({ dir }) };
}

function dropAllFaces(dir: string): void {
  for (const face of FONT_FACES) {
    writeFileSync(join(dir, face.file), "placeholder");
  }
}

describe("BUG-P2-005 conditional font-face delivery", () => {
  it("declares exactly the documented six faces with swap display", () => {
    expect(FONT_FACES.map((face) => face.file)).toEqual([
      "graphik-arabic-400.woff2",
      "graphik-arabic-600.woff2",
      "graphik-arabic-700.woff2",
      "outfit-400.woff2",
      "outfit-600.woff2",
      "outfit-700.woff2",
    ]);
    expect(FONT_DISPLAY).toBe("swap");
  });

  it("no longer hard-codes @font-face in tokens.css", () => {
    expect(/@font-face\s*\{/.test(tokensCss)).toBe(false);
    expect(tokensCss).toContain('@plugin "../../scripts/fonts-plugin.mjs";');
  });

  it("emits no @font-face and no /fonts/ URL when the asset set is absent", () => {
    const { dir, runtime } = makeTempRuntime("absent");
    try {
      expect(runtime.fontAssetState().present).toHaveLength(0);
      expect(runtime.fontAssetState().missing).toHaveLength(FONT_FACES.length);
      expect(runtime.fontFacesCss()).toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("emits every declared face with display swap when all assets are present", () => {
    const { dir, runtime } = makeTempRuntime("present");
    try {
      dropAllFaces(dir);
      const css = runtime.fontFacesCss();
      expect(runtime.fontAssetState().missing).toHaveLength(0);
      expect(css.match(/@font-face/g)).toHaveLength(FONT_FACES.length);
      for (const face of FONT_FACES) {
        expect(css).toContain(`font-family: "${face.family}";`);
        expect(css).toContain(`font-weight: ${face.weight};`);
        expect(css).toContain("font-display: swap;");
        expect(css).toContain(
          `src: url("/fonts/${face.file}") format("woff2");`,
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails loudly when only part of the drop-in set is present", () => {
    const { dir, runtime } = makeTempRuntime("partial");
    try {
      dropAllFaces(dir);
      rmSync(join(dir, "outfit-700.woff2"), { force: true });
      expect(() => runtime.assertFontSources()).toThrow(/outfit-700\.woff2/);
      expect(() => runtime.fontFacesCss()).toThrow(/all-or-nothing/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = dirname(fileURLToPath(import.meta.url));

export const FONT_DIR = resolve(moduleDir, "..", "public", "fonts");

export const FONT_FACES = [
  { family: "Graphik Arabic", weight: 400, file: "graphik-arabic-400.woff2" },
  { family: "Graphik Arabic", weight: 600, file: "graphik-arabic-600.woff2" },
  { family: "Graphik Arabic", weight: 700, file: "graphik-arabic-700.woff2" },
  { family: "Outfit", weight: 400, file: "outfit-400.woff2" },
  { family: "Outfit", weight: 600, file: "outfit-600.woff2" },
  { family: "Outfit", weight: 700, file: "outfit-700.woff2" },
];

export const FONT_DISPLAY = "swap";

export function createFontFaces({ dir = FONT_DIR } = {}) {
  function fontAssetState() {
    const present = [];
    const missing = [];
    for (const face of FONT_FACES) {
      if (existsSync(join(dir, face.file))) present.push(face);
      else missing.push(face);
    }
    return { present, missing };
  }

  function assertFontSources() {
    const { present, missing } = fontAssetState();
    if (present.length === 0) return;
    if (missing.length === 0) return;
    const detail = missing
      .map(
        (face) =>
          `@font-face ${face.family} weight ${face.weight} -> ${face.file}`,
      )
      .join("\n");
    throw new Error(
      "Declared @font-face sources are missing from the font asset directory. " +
        "The drop-in set is all-or-nothing: drop every licensed WOFF2 listed in " +
        "docs/fonts.md, or drop none. Missing files:\n" +
        detail,
    );
  }

  function fontFacesCss() {
    assertFontSources();
    if (fontAssetState().present.length === 0) return "";
    return FONT_FACES.map((face) =>
      [
        "@font-face {",
        `  font-family: "${face.family}";`,
        "  font-style: normal;",
        `  font-weight: ${face.weight};`,
        `  font-display: ${FONT_DISPLAY};`,
        `  src: url("/fonts/${face.file}") format("woff2");`,
        "}",
      ].join("\n"),
    ).join("\n\n");
  }

  return {
    dir,
    faces: FONT_FACES,
    fontAssetState,
    assertFontSources,
    fontFacesCss,
  };
}

const defaultFaces = createFontFaces();

export const fontAssetState = defaultFaces.fontAssetState;
export const assertFontSources = defaultFaces.assertFontSources;
export const fontFacesCss = defaultFaces.fontFacesCss;

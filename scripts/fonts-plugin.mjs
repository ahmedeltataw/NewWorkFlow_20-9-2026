import {
  FONT_FACES,
  FONT_DISPLAY,
  assertFontSources,
  fontAssetState,
} from "./font-faces.mjs";

export default {
  handler({ addBase }) {
    const { present } = fontAssetState();
    if (present.length === 0) return;
    assertFontSources();
    addBase({
      "@font-face": FONT_FACES.map((face) => ({
        fontFamily: `"${face.family}"`,
        fontStyle: "normal",
        fontWeight: String(face.weight),
        fontDisplay: FONT_DISPLAY,
        src: `url("/fonts/${face.file}") format("woff2")`,
      })),
    });
  },
};

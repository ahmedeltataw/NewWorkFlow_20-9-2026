# Font Assets

## Graphik Arabic

- **Status**: Commercial font. Licence not yet approved for this project.
- **Approval gate**: Before any WOFF2 subset is committed, merged, or released, written proof of licence must exist and be reviewed. This is a hard release blocker (see `plan.md` and `specs/001-auction-marketplace-mvp/plan.md`).
- **No font file may be fetched or assumed licensed by this task.**

### WOFF2 subset requirements

- Subset must cover at minimum: Arabic glyphs plus the Latin and Western-numeral glyphs required for mixed-script marketplace rendering.
- Subset files are supplied locally; they are not downloaded at build time or fetched from a CDN.
- Redistribution and subsetting rights must be explicitly granted in the licence document.

### Text style mapping

| Figma style group | Usage                  | Line-height policy |
| ----------------- | ---------------------- | ------------------ |
| 10–16 px sizes    | Body, captions, labels | 1.5                |
| 18–24 px sizes    | Sub-headings           | 1.3                |
| 30–38 px sizes    | Display / hero         | 1.2                |

All 13 published Graphik Arabic text styles are defined in the design token pipeline (`tokens.css` / Tailwind v4 `@theme inline`).

## Outfit

- **Status**: Open-source (SIL OFL). Local WOFF2 files are required for consistent delivery alongside Graphik Arabic.
- **Provenance**: Outfit WOFF2 assets must be sourced locally. The project deliberately avoids `next/font/google` for Outfit to keep delivery consistent with Graphik Arabic's local-only pattern (see `research.md`).
- **No font file may be fetched or assumed licensed by this task.**

### Weight mappings

| Weight   | CSS value | Usage                           |
| -------- | --------- | ------------------------------- |
| Regular  | 400       | Body text, UI labels            |
| SemiBold | 600       | Emphasis, headings              |
| Bold     | 700       | Strong emphasis, section titles |

The same 400/600/700 weights are declared for Graphik Arabic so both families share one token weight scale.

## Fallback stacks

Exact stack declarations live in `src/app/fonts.ts` and are applied to the `<html>` element in `src/app/layout.tsx` (T014).

**Invariant**: exactly one generic family, always as the last entry, in each final composed stack. Family-plus-fallback fragments never carry a generic terminator — a generic family always resolves, so any family listed after it would be unreachable dead code.

- Graphik Arabic fragment (value of `--font-graphik-arabic`): `"Graphik Arabic", "Noto Sans Arabic", Tahoma, "Segoe UI", Arial`. No generic family.
- Outfit fragment (value of `--font-outfit`): `"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial`. No generic family.
- Document stack (applied to `<html>`): Graphik fragment, Outfit fragment, emoji fallbacks (`Apple Color Emoji`, `Segoe UI Emoji`, `Segoe UI Symbol`, `Noto Color Emoji`), then the single generic `sans-serif` as the last entry.
- `--font-sans` in `tokens.css`: `var(--font-graphik-arabic), var(--font-outfit), -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans Arabic", Tahoma, Arial, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif` — same invariant: one generic, last. Because the `--font-graphik-arabic` and `--font-outfit` variables carry no generic terminator, both families and the emoji fallbacks stay reachable when composed into `--font-sans`.

Font weights, family names, the fragments, and the composed stacks are exported from `src/app/fonts.ts`; the root layout maps the fragments to the CSS custom properties `--font-graphik-arabic` and `--font-outfit`, which the token pipeline's `--font-sans` already references.

## Loading strategy

- Fonts are declared with CSS `@font-face` rules in `src/styles/tokens.css`. The project avoids `next/font/local` until the licensed asset files exist, because `next/font/local` fails the build when a referenced file is absent; plain `@font-face` rules tolerate a missing file and gracefully fall through to the fallback stack.
- `font-display: swap` is applied to every face to prevent FOIT (per `WEB_ADAPTATION.md`).
- Each `@font-face` points directly at the web asset path `/fonts/<file>.woff2`; missing files resolve to the documented fallback stacks until the licensed assets land.

### Drop-in path and file names

Licensed WOFF2 files drop into `public/fonts/`. Adding these files is sufficient — no code change is needed after T014.

| Family         | Weight | File                                    |
| -------------- | ------ | --------------------------------------- |
| Graphik Arabic | 400    | `public/fonts/graphik-arabic-400.woff2` |
| Graphik Arabic | 600    | `public/fonts/graphik-arabic-600.woff2` |
| Graphik Arabic | 700    | `public/fonts/graphik-arabic-700.woff2` |
| Outfit         | 400    | `public/fonts/outfit-400.woff2`         |
| Outfit         | 600    | `public/fonts/outfit-600.woff2`         |
| Outfit         | 700    | `public/fonts/outfit-700.woff2`         |

## Constraints

- No font file is committed, downloaded, or assumed licensed by the T014 task.
- Graphik Arabic licence verification remains a release-blocker tracked in the release checklist (`docs/release-checklist.md`).

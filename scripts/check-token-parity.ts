import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const contractPath = join(rootDir, "scripts", "token-contract.ts");
const cssPath = join(rootDir, "src", "styles", "tokens.css");

interface CssVar {
  name: string;
  value: string;
  line: number;
}

type Props = Map<string, string>;

const errors: string[] = [];

function fail(category: string, message: string): void {
  errors.push(`[${category}] ${message}`);
}

function collapseWs(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function normalizeHex(input: string): string {
  return input.toLowerCase();
}

function readOrThrow(path: string, label: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(
      `${label} not found at ${path} — cannot run token parity check. ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function extractBlock(src: string, header: string): string {
  const idx = src.indexOf(header);
  if (idx === -1) return "";
  const open = src.indexOf("{", idx);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return "";
}

function parseDeclarations(
  blockBody: string,
  blockName: string,
): Map<string, CssVar> {
  const vars = new Map<string, CssVar>();
  const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]*);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blockBody)) !== null) {
    const name = m[1]!.trim();
    const value = collapseWs(m[2]!);
    const upto = blockBody.slice(0, m.index);
    const line = 1 + (upto.match(/\n/g)?.length ?? 0);
    const prev = vars.get(name);
    if (prev) {
      fail(
        "DUPLICATE",
        `CSS variable "${name}" is defined twice in ${blockName} (line ${prev.line} and line ${line}).`,
      );
      continue;
    }
    vars.set(name, { name, value, line });
  }
  return vars;
}

function parseProps(chunk: string): Props {
  const props = new Map<string, string>();
  const strRe = /([a-zA-Z]+)\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = strRe.exec(chunk)) !== null) props.set(m[1]!, m[2]!);
  const numRe = /([a-zA-Z]+)\s*:\s*(-?\d+(?:\.\d+)?)/g;
  while ((m = numRe.exec(chunk)) !== null) props.set(m[1]!, m[2]!);
  return props;
}

function extractArrayChunks(src: string, exportName: string): string[] {
  const anchor = `export const ${exportName} =`;
  const idx = src.indexOf(anchor);
  if (idx === -1) return [];
  const start = src.indexOf("[", idx);
  if (start === -1) return [];
  const end = src.indexOf("]", start);
  const body = src.slice(start + 1, end);
  const chunks: string[] = [];
  const re = /\{([^{}]*)}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    chunks.push(m[1]!.trim());
  }
  return chunks;
}

function extractObjectEntries(
  src: string,
  exportName: string,
): { key: string; props: Props }[] {
  const anchor = `export const ${exportName} =`;
  const idx = src.indexOf(anchor);
  if (idx === -1) return [];
  const start = src.indexOf("{", idx);
  let end = start;
  let depth = 0;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = src.slice(start + 1, end);
  const out: { key: string; props: Props }[] = [];
  const re = /"([^"]+)"\s*:\s*\{([^{}]*)}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    out.push({ key: m[1]!, props: parseProps(m[2]!) });
  }
  return out;
}

function primitiveVarName(token: string): string {
  return "--color-" + token.replace(/\//g, "-");
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function shadowLiteral(hex: string, opacity: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (opacity === 1) return "#" + hex.replace(/^#/, "").toLowerCase();
  return `rgba(${r}, ${g}, ${b}, ${String(opacity)})`;
}

function shadowVarName(key: string): string {
  const rest = key
    .slice(key.indexOf("/") + 1)
    .replace(/_shadow$/, "")
    .toLowerCase()
    .replace(/_/g, "-");
  return "--color-shadow-" + rest;
}

function parsePx(input: string): number {
  return Number(input.replace(/px$/i, ""));
}

function parseNum(input: string): number {
  return Number(input.replace(/em$/i, ""));
}

const contractSrc = readOrThrow(contractPath, "Token contract");
const cssSrc = readOrThrow(cssPath, "Token stylesheet");

const rootVars = parseDeclarations(extractBlock(cssSrc, ":root"), ":root");
const themeVars = parseDeclarations(
  extractBlock(cssSrc, "@theme inline"),
  "@theme inline",
);

const primitiveLookup = new Map<string, string>();
const primitiveTokens = new Set<string>();

for (const chunk of extractArrayChunks(contractSrc, "PRIMITIVE_COLORS")) {
  const p = parseProps(chunk);
  const token = p.get("token");
  const value = p.get("value");
  if (token === undefined || value === undefined) {
    fail("UNMAPPED", `Primitive entry could not be parsed: {${chunk}}.`);
    continue;
  }
  if (primitiveTokens.has(token)) {
    fail(
      "DUPLICATE",
      `Primitive token "${token}" appears more than once in PRIMITIVE_COLORS.`,
    );
    continue;
  }
  primitiveTokens.add(token);
  primitiveLookup.set(token, value);
  const cssName = primitiveVarName(token);
  const cssVar = rootVars.get(cssName);
  if (!cssVar) {
    fail(
      "MISSING",
      `Primitive "${token}" (${value}) has no CSS variable ${cssName} defined in :root.`,
    );
    continue;
  }
  if (normalizeHex(cssVar.value) !== normalizeHex(value)) {
    fail(
      "MISMATCH",
      `Primitive "${token}" expects ${cssName}: ${normalizeHex(value)} but CSS declares ${cssName}: ${cssVar.value} (line ${cssVar.line}).`,
    );
  }
}

const shadowEntries: { key: string; cssName: string; literal: string }[] = [];

for (const { key, props } of extractObjectEntries(
  contractSrc,
  "SHADOW_COLORS",
)) {
  const hex = props.get("hex");
  const opacity = Number(props.get("opacity") ?? "1");
  if (hex === undefined) {
    fail("UNMAPPED", `Shadow color "${key}" has no hex value.`);
    continue;
  }
  const cssName = shadowVarName(key);
  const literal = shadowLiteral(hex, opacity);
  const cssVar = rootVars.get(cssName);
  if (!cssVar) {
    fail(
      "MISSING",
      `Shadow color "${key}" has no CSS variable ${cssName} defined in :root.`,
    );
  } else if (collapseWs(cssVar.value) !== literal) {
    fail(
      "MISMATCH",
      `Shadow color "${key}" expects ${cssName}: ${literal} but CSS declares ${cssName}: ${cssVar.value} (line ${cssVar.line}).`,
    );
  }
  shadowEntries.push({ key, cssName, literal });
}

const shadowVarMap = new Map(
  shadowEntries.map((entry) => [entry.cssName, entry.literal]),
);

const semanticVars = new Set<string>();

for (const chunk of extractArrayChunks(contractSrc, "SEMANTIC_COLORS")) {
  const p = parseProps(chunk);
  const token = p.get("token");
  const cssVariable = p.get("cssVariable");
  const source = p.get("source");
  const resolved = p.get("resolved");
  if (token === undefined || cssVariable === undefined) {
    fail("UNMAPPED", `Semantic entry could not be parsed: {${chunk}}.`);
    continue;
  }
  if (semanticVars.has(cssVariable)) {
    fail(
      "DUPLICATE",
      `Semantic alias "${token}" reuses cssVariable "${cssVariable}" already declared by another entry.`,
    );
    continue;
  }
  semanticVars.add(cssVariable);

  const cssVar = rootVars.get(cssVariable);
  if (!cssVar) {
    fail(
      "MISSING",
      `Semantic alias "${token}" declares ${cssVariable} but it is not defined in :root.`,
    );
    continue;
  }
  const expectedRef = `var(${primitiveVarName(source ?? "")})`;
  if (collapseWs(cssVar.value) !== expectedRef) {
    fail(
      "MISMATCH",
      `Semantic alias "${token}" expects ${cssVariable}: ${expectedRef} but CSS declares ${cssVariable}: ${cssVar.value} (line ${cssVar.line}).`,
    );
  }
  if (source === undefined) {
    fail("UNMAPPED", `Semantic alias "${token}" has no source primitive.`);
    continue;
  }
  const primitiveValue = primitiveLookup.get(source);
  if (primitiveValue === undefined) {
    fail(
      "UNMAPPED",
      `Semantic alias "${token}" sources "${source}" which is not defined in PRIMITIVE_COLORS.`,
    );
    continue;
  }
  if (
    resolved !== undefined &&
    normalizeHex(resolved) !== normalizeHex(primitiveValue)
  ) {
    fail(
      "MISMATCH",
      `Semantic alias "${token}" resolved value ${normalizeHex(resolved)} does not match source "${source}" value ${normalizeHex(primitiveValue)}.`,
    );
  }
}

function checkScalarGroup(
  exportName: string,
  render: (value: string) => string,
  kind: string,
): void {
  const tokens = new Set<string>();
  const cssVars = new Set<string>();
  for (const chunk of extractArrayChunks(contractSrc, exportName)) {
    const p = parseProps(chunk);
    const token = p.get("token");
    const cssVariable = p.get("cssVariable");
    const value = p.get("value");
    if (
      token === undefined ||
      cssVariable === undefined ||
      value === undefined
    ) {
      fail("UNMAPPED", `${exportName} entry could not be parsed: {${chunk}}.`);
      continue;
    }
    if (tokens.has(token)) {
      fail(
        "DUPLICATE",
        `${kind} token "${token}" appears more than once in ${exportName}.`,
      );
      continue;
    }
    tokens.add(token);
    if (cssVars.has(cssVariable)) {
      fail(
        "DUPLICATE",
        `${kind} token "${token}" reuses cssVariable "${cssVariable}" already declared by another entry in ${exportName}.`,
      );
      continue;
    }
    cssVars.add(cssVariable);
    const expected = render(value);
    const cssVar = rootVars.get(cssVariable);
    if (!cssVar) {
      fail(
        "MISSING",
        `${kind} token "${token}" declares ${cssVariable} but it is not defined in :root.`,
      );
      continue;
    }
    if (collapseWs(cssVar.value) !== expected) {
      fail(
        "MISMATCH",
        `${kind} token "${token}" expects ${cssVariable}: ${expected} but CSS declares ${cssVariable}: ${cssVar.value} (line ${cssVar.line}).`,
      );
    }
  }
}

checkScalarGroup("SPACING", (value) => `${value}px`, "Spacing");
checkScalarGroup(
  "RADII",
  (value) => (value === "0" ? "0" : `${value}px`),
  "Radius",
);

for (const chunk of extractArrayChunks(contractSrc, "ELEVATIONS")) {
  const p = parseProps(chunk);
  const token = p.get("token");
  const cssVariable = p.get("cssVariable");
  const value = p.get("value");
  if (token === undefined || cssVariable === undefined || value === undefined) {
    fail("UNMAPPED", `Elevation entry could not be parsed: {${chunk}}.`);
    continue;
  }
  const cssVar = rootVars.get(cssVariable);
  if (!cssVar) {
    fail(
      "MISSING",
      `Elevation "${token}" declares ${cssVariable} but it is not defined in :root.`,
    );
    continue;
  }
  const resolvedCss = collapseWs(
    cssVar.value.replace(
      /var\((--[^)]+)\)/g,
      (_all, name: string) => shadowVarMap.get(name) ?? name,
    ),
  );
  const expected = collapseWs(value);
  if (resolvedCss !== expected) {
    fail(
      "MISMATCH",
      `Elevation "${token}" expects ${cssVariable}: ${expected} but CSS resolves to ${resolvedCss} (line ${cssVar.line}).`,
    );
  }
}

interface TextGroup {
  name: string;
  size: number;
  lineHeight: number;
  weight: number;
  letterSpacing: number;
}

const textGroups = new Map<string, TextGroup>();

for (const cssVar of themeVars.values()) {
  const name = cssVar.name;
  if (!name.startsWith("--text-")) continue;
  if (
    name.endsWith("--line-height") ||
    name.endsWith("--font-weight") ||
    name.endsWith("--letter-spacing")
  ) {
    continue;
  }
  const lh = themeVars.get(name + "--line-height");
  const weightVar = themeVars.get(name + "--font-weight");
  const ls = themeVars.get(name + "--letter-spacing");
  if (lh === undefined || weightVar === undefined || ls === undefined) {
    fail(
      "MISSING",
      `Text group "${name}" is missing its --line-height/--font-weight/--letter-spacing companions in @theme inline.`,
    );
    continue;
  }
  const group: TextGroup = {
    name,
    size: parsePx(cssVar.value),
    lineHeight: Number(lh.value),
    weight: Number(weightVar.value),
    letterSpacing: parseNum(ls.value),
  };
  const key = `${group.size}/${group.weight}`;
  if (textGroups.has(key)) {
    fail(
      "DUPLICATE",
      `CSS text groups "${textGroups.get(key)?.name}" and "${name}" both resolve to ${key}.`,
    );
    continue;
  }
  textGroups.set(key, group);
}

for (const chunk of extractArrayChunks(contractSrc, "TEXT_STYLES")) {
  const p = parseProps(chunk);
  const token = p.get("token");
  const size = Number(p.get("size"));
  const weight = Number(p.get("weight"));
  const lineHeight = Number(p.get("lineHeight"));
  const letterSpacing = Number(p.get("letterSpacing"));
  if (
    token === undefined ||
    !Number.isFinite(size) ||
    !Number.isFinite(weight)
  ) {
    fail("UNMAPPED", `Text style entry could not be parsed: {${chunk}}.`);
    continue;
  }
  const key = `${size}/${weight}`;
  const group = textGroups.get(key);
  if (!group) {
    fail(
      "UNMAPPED",
      `Text style "${token}" (${size}px / weight ${weight}) has no matching --text-* group in @theme inline.`,
    );
    continue;
  }
  if (group.size !== size) {
    fail(
      "MISMATCH",
      `Text style "${token}" expects size ${size}px but CSS group "${group.name}" declares ${group.size}px.`,
    );
  }
  if (group.weight !== weight) {
    fail(
      "MISMATCH",
      `Text style "${token}" expects weight ${weight} but CSS group "${group.name}" declares ${group.weight}.`,
    );
  }
  if (group.lineHeight !== lineHeight) {
    fail(
      "MISMATCH",
      `Text style "${token}" expects line-height ${lineHeight} but CSS group "${group.name}" declares ${group.lineHeight}.`,
    );
  }
  if (group.letterSpacing !== letterSpacing) {
    fail(
      "MISMATCH",
      `Text style "${token}" expects letter-spacing ${letterSpacing}em but CSS group "${group.name}" declares ${group.letterSpacing}em.`,
    );
  }
}

if (errors.length > 0) {
  throw new Error(
    `Token parity check failed (${rootDir}):\n${errors.join("\n")}`,
  );
}

console.log(
  `Token parity OK — all contract aliases mapped and matched in ${cssPath}.`,
);

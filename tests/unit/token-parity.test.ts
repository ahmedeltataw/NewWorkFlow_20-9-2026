import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import {
  PRIMITIVE_COLORS,
  RADII,
  SEMANTIC_COLORS,
  SPACING,
  TOKEN_CONTRACT,
} from "../../scripts/token-contract";

const execFileAsync = promisify(execFile);

const repoRoot = process.cwd();

const primitiveByToken = new Map(
  PRIMITIVE_COLORS.map((c) => [c.token, c.value] as const),
);

describe("T013 token contract and parity checker", () => {
  describe("PRIMITIVE_COLORS", () => {
    it("declares unique, well-formed hex tokens", () => {
      const seen = new Set<string>();
      for (const color of PRIMITIVE_COLORS) {
        expect(seen.has(color.token), `duplicate token ${color.token}`).toBe(
          false,
        );
        seen.add(color.token);
        expect(color.value).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it("holds the quoted contract hex values", () => {
      expect(primitiveByToken.get("neutral/100")).toBe("#f8f8f8");
      expect(primitiveByToken.get("primary/500")).toBe("#a87524");
      expect(primitiveByToken.get("base/black")).toBe("#121212");
    });
  });

  describe("SEMANTIC_COLORS", () => {
    it("declares unique tokens and cssVariables", () => {
      const tokens = new Set<string>();
      const cssVariables = new Set<string>();
      for (const color of SEMANTIC_COLORS) {
        expect(tokens.has(color.token), `duplicate token ${color.token}`).toBe(
          false,
        );
        tokens.add(color.token);
        expect(
          cssVariables.has(color.cssVariable),
          `duplicate cssVariable ${color.cssVariable}`,
        ).toBe(false);
        cssVariables.add(color.cssVariable);
        expect(color.cssVariable).toMatch(/^--[a-z][a-z0-9-]*$/i);
      }
    });

    it("maps every semantic color to a declared primitive and its resolved value", () => {
      for (const color of SEMANTIC_COLORS) {
        const sourceValue = primitiveByToken.get(color.source);
        expect(
          sourceValue,
          `${color.token} sources unknown primitive ${color.source}`,
        ).toBeDefined();
        expect(sourceValue).toBe(color.resolved);
      }
    });

    it("holds the quoted semantic spot values", () => {
      const byToken = new Map(SEMANTIC_COLORS.map((c) => [c.token, c]));
      expect(byToken.get("Surface/Background")?.resolved).toBe("#fefcf8");
      expect(byToken.get("Text/Primary")?.resolved).toBe("#121212");
      expect(byToken.get("Action/Primary")?.resolved).toBe("#a87524");
      expect(byToken.get("Status/ErrorBG")?.resolved).toBe("#fff1f2");
    });
  });

  describe("SPACING", () => {
    it("is strictly increasing and matches its token/cssVariable pattern", () => {
      const tokens: string[] = [];
      SPACING.forEach((step, index) => {
        expect(step.token).toBe(`spacing/${index + 1}`);
        expect(step.cssVariable).toBe(`--space-${index + 1}`);
        tokens.push(step.token);
      });
      expect(new Set(tokens).size).toBe(tokens.length);
      for (let i = 1; i < SPACING.length; i += 1) {
        expect(SPACING[i]!.value).toBeGreaterThan(SPACING[i - 1]!.value);
      }
    });

    it("matches the quoted spacing values", () => {
      expect(SPACING.map((s) => s.value)).toEqual([
        2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80,
      ]);
    });

    it("exposes spacing through the exported TOKEN_CONTRACT", () => {
      expect(TOKEN_CONTRACT.spacing).toBe(SPACING);
    });
  });

  describe("RADII", () => {
    it("matches the quoted radius tokens and cssVariables", () => {
      const expectedTokens = [
        "radius/none",
        "radius/xs",
        "radius/sm",
        "radius/md",
        "radius/lg",
        "radius/xl",
        "radius/2xl",
        "radius/full",
      ];
      const expectedCss = [
        "--radius-none",
        "--radius-xs",
        "--radius-sm",
        "--radius-md",
        "--radius-lg",
        "--radius-xl",
        "--radius-2xl",
        "--radius-full",
      ];
      RADII.forEach((radius, index) => {
        expect(radius.token).toBe(expectedTokens[index]);
        expect(radius.cssVariable).toBe(expectedCss[index]);
      });
      expect(RADII.map((r) => r.value)).toEqual([
        0, 4, 8, 12, 16, 24, 32, 9999,
      ]);
      expect(TOKEN_CONTRACT.radii).toBe(RADII);
    });
  });

  describe("parity checker (behavior level)", () => {
    it("passes against the real tokens.css contract mapping", async () => {
      const { stdout } = await execFileAsync(
        process.execPath,
        ["--experimental-strip-types", "scripts/check-token-parity.ts"],
        { cwd: repoRoot },
      );
      expect(stdout).toContain("Token parity OK");
    });
  });
});

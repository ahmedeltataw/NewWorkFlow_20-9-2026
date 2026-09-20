/// <reference types="vitest/globals" />

declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveNoViolations(results?: unknown): T;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(results?: unknown): void;
  }
}

export {};

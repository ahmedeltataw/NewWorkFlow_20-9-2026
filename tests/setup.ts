import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect } from "vitest";

import { installMswLifecycle } from "./msw";

expect.extend(toHaveNoViolations);
installMswLifecycle();

afterEach(() => {
  cleanup();
});

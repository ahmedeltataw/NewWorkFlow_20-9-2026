"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { startBrowserMockWorker } from "./browser-runtime";

/** Starts the shared MSW fixtures for local development and Playwright. */
export function BrowserMockProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  useEffect(() => {
    void startBrowserMockWorker().catch(() => {
      // The runtime logs once; API requests surface a typed error result.
    });
  }, []);
  return children;
}

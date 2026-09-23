/**
 * BUG-P4-010 — shared auth layout (WEB_ADAPTATION §5.8).
 *
 * Renders the real server layout with a mocked request cookie in both
 * locales and asserts the split-layout hooks (form column + brand panel)
 * exist and the brand tagline comes from the message catalogues.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthLayout from "../../src/app/auth/layout";
import { messagesAr } from "../../src/messages/ar";
import { messagesEn } from "../../src/messages/en";
import type { Locale } from "../../src/lib/api/types";

const { cookies: cookiesMock } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));

const catalogues = { en: messagesEn, ar: messagesAr } as const;

async function renderLayout(locale: Locale) {
  cookiesMock.mockResolvedValue({ get: () => ({ value: locale }) });
  const element = await AuthLayout({ children: <form>phone entry</form> });
  return render(element);
}

describe("auth shared layout (WEB_ADAPTATION §5.8)", () => {
  it.each(["en", "ar"] as const)(
    "renders both layout columns with the %s catalogue tagline",
    async (locale) => {
      await renderLayout(locale);

      const formColumn = screen.getByTestId("auth-form-column");
      const brandPanel = screen.getByTestId("auth-brand-panel");
      expect(formColumn).toBeInTheDocument();
      expect(brandPanel).toBeInTheDocument();
      expect(formColumn).toContainElement(screen.getByText("phone entry"));
      expect(
        screen.getByText(catalogues[locale]["auth.brand.tagline"]),
      ).toBeInTheDocument();
      expect(
        screen.getByText(catalogues[locale]["app.name"]),
      ).toBeInTheDocument();
    },
  );

  it("keeps the brand panel out of the accessibility hiding pattern despite containing text", async () => {
    const { container } = await renderLayout("en");

    const brandPanel = screen.getByTestId("auth-brand-panel");
    expect(brandPanel).not.toHaveAttribute("aria-hidden");
    expect(brandPanel.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
    expect(container.querySelectorAll("main")).toHaveLength(0);
  });
});

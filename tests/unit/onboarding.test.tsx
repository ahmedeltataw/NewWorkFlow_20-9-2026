import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "../../src/lib/i18n/locale-provider";
import {
  Onboarding,
  hasSeenOnboarding,
  markOnboardingSeen,
} from "../../src/features/onboarding";

const { refresh: refreshMock } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function renderWithLocale(ui: React.ReactNode, locale: "ar" | "en" = "ar") {
  return render(<LocaleProvider locale={locale}>{ui}</LocaleProvider>);
}

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  refreshMock.mockClear();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
      get length() {
        return storage.size;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      key: (_index: number) => null,
    },
    writable: true,
    configurable: true,
  });
});

describe("T030 Onboarding persistence", () => {
  describe("hasSeenOnboarding", () => {
    it("returns false when localStorage is empty", () => {
      expect(hasSeenOnboarding()).toBe(false);
    });

    it("returns true after markOnboardingSeen", () => {
      markOnboardingSeen();
      expect(hasSeenOnboarding()).toBe(true);
    });

    it("returns false when localStorage throws", () => {
      const original = window.localStorage.getItem;
      window.localStorage.getItem = () => {
        throw new Error("quota exceeded");
      };
      expect(hasSeenOnboarding()).toBe(false);
      window.localStorage.getItem = original;
    });
  });

  describe("Onboarding component", () => {
    it("shows on first visit (no localStorage flag)", () => {
      renderWithLocale(<Onboarding />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      // Heading is Arabic: "اكتشف المزادات"
      expect(screen.getByRole("heading")).toBeInTheDocument();
    });

    it("does not show after markOnboardingSeen", () => {
      markOnboardingSeen();
      renderWithLocale(<Onboarding />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("dismisses and persists on close button click", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      renderWithLocale(<Onboarding onComplete={onComplete} />);

      // The close icon button in the header has aria-label "تخطي"
      // Use the first match (header close button with the icon)
      const skipButtons = screen.getAllByRole("button", { name: "تخطي" });
      await user.click(skipButtons[0]!);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(hasSeenOnboarding()).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("dismisses on Escape key", async () => {
      const user = userEvent.setup();
      renderWithLocale(<Onboarding />);

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(hasSeenOnboarding()).toBe(true);
    });

    it("advances through slides and completes on get-started", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      renderWithLocale(<Onboarding onComplete={onComplete} />);

      // "التالي" = Next in Arabic
      await user.click(screen.getByText("التالي"));
      // Second slide — click Next again
      await user.click(screen.getByText("التالي"));
      // Third (last) slide — click "ابدأ" = Get Started
      await user.click(screen.getByText("ابدأ"));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(hasSeenOnboarding()).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("allows language toggle via header button", async () => {
      const user = userEvent.setup();
      renderWithLocale(<Onboarding />);

      // Default is Arabic; toggle to English. aria-label is "اللغة: English"
      const langButton = screen.getByRole("button", {
        name: "اللغة: English",
      });
      await user.click(langButton);

      // After language change, the dialog should still be present
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not show after localStorage is already set on re-mount", () => {
      markOnboardingSeen();
      const { unmount } = renderWithLocale(<Onboarding />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      unmount();

      renderWithLocale(<Onboarding />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on backdrop click", async () => {
      const user = userEvent.setup();
      renderWithLocale(<Onboarding />);

      // The backdrop is the sibling before the dialog panel
      const dialog = screen.getByRole("dialog");
      const backdrop = dialog.parentElement!.querySelector(
        "[aria-hidden='true']",
      );
      expect(backdrop).not.toBeNull();

      await user.click(backdrop!);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(hasSeenOnboarding()).toBe(true);
    });
  });
});

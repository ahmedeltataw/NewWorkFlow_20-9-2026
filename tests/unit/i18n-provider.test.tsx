import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LOCALE_COOKIE_NAME } from "../../src/lib/i18n";
import {
  LocaleProvider,
  useI18n,
  useLocale,
  useT,
} from "../../src/lib/i18n/locale-provider";

const { refresh: refreshMock } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

function Probe() {
  const i18n = useI18n();
  const t = useT();
  const locale = useLocale();
  return (
    <div>
      <span data-testid="locale">{i18n.locale}</span>
      <span data-testid="dir">{i18n.dir}</span>
      <span data-testid="is-rtl">{String(i18n.isRtl)}</span>
      <span data-testid="use-locale">{locale}</span>
      <span data-testid="app-name">{i18n.t("app.name")}</span>
      <span data-testid="loading">{t("common.loading")}</span>
      <span data-testid="money">
        {i18n.formatMoney({ amountMinor: 123450, currency: "SAR" })}
      </span>
      <span data-testid="number">{i18n.formatNumber(1234567)}</span>
      <button type="button" onClick={() => i18n.setLocale("en")}>
        Switch to English
      </button>
    </div>
  );
}

describe("T016 LocaleProvider and useI18n", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    document.cookie = "locale=; Max-Age=-99999999; path=/";
    document.documentElement.lang = "";
    document.documentElement.dir = "";
  });

  it('renders Arabic, rtl direction, and Arabic copy for locale="ar"', () => {
    render(
      <LocaleProvider locale="ar">
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("ar");
    expect(screen.getByTestId("use-locale")).toHaveTextContent("ar");
    expect(screen.getByTestId("dir")).toHaveTextContent("rtl");
    expect(screen.getByTestId("is-rtl")).toHaveTextContent("true");
    expect(screen.getByTestId("app-name")).toHaveTextContent("المزاد الدولي");
    expect(screen.getByTestId("loading")).toHaveTextContent("جارٍ التحميل");
    expect(screen.getByTestId("money")).toHaveTextContent("1,234.50");
    expect(screen.getByTestId("number")).toHaveTextContent("1,234,567");
  });

  it('renders English, ltr direction, and English copy for locale="en"', () => {
    render(
      <LocaleProvider locale="en">
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("use-locale")).toHaveTextContent("en");
    expect(screen.getByTestId("dir")).toHaveTextContent("ltr");
    expect(screen.getByTestId("is-rtl")).toHaveTextContent("false");
    expect(screen.getByTestId("app-name")).toHaveTextContent(
      "International Auction",
    );
    expect(screen.getByTestId("loading")).toHaveTextContent("Loading");
  });

  it("persists the switch and updates <html lang dir> when setLocale runs", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="ar">
        <Probe />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Switch to English" }));

    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=en`);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("skips persistence and refresh when the locale is unchanged", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="en">
        <Probe />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Switch to English" }));

    expect(refreshMock).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain(`${LOCALE_COOKIE_NAME}=en`);
  });

  it("throws when useI18n has no provider", () => {
    expect(() => render(<Probe />)).toThrow(/LocaleProvider/);
  });
});

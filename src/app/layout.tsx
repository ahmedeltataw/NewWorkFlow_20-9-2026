import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { DOCUMENT_FONT_STACK, fontVariables } from "./fonts";
import { LOCALE_DIRECTION, translate } from "../lib/i18n";
import { LocaleProvider } from "../lib/i18n/locale-provider";
import { getRequestLocale } from "../lib/i18n/server";
import { AppShell } from "../components/shell/AppShell";
import { BrowserMockProvider } from "../mocks/BrowserMockProvider";

import "../styles/tokens.css";

export const metadata: Metadata = {
  title: "Auction Marketplace",
  description: "International auction marketplace",
};

const fontStyles: CSSProperties = {
  ...fontVariables,
  fontFamily: DOCUMENT_FONT_STACK,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = await getRequestLocale();
  const shellLabels = {
    appName: translate(locale, "app.name"),
    home: translate(locale, "nav.home"),
    auctions: translate(locale, "nav.auctions"),
    wallet: translate(locale, "nav.wallet"),
    profile: translate(locale, "nav.profile"),
    search: translate(locale, "common.search"),
    language: translate(locale, "nav.language"),
    languageToggle: translate(locale, "nav.languageToggle"),
    notifications: translate(locale, "nav.notifications"),
  };
  return (
    <html lang={locale} dir={LOCALE_DIRECTION[locale]} style={fontStyles}>
      <body>
        <LocaleProvider locale={locale}>
          <BrowserMockProvider>
            <AppShell labels={shellLabels}>{children}</AppShell>
          </BrowserMockProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

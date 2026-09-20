import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { DOCUMENT_FONT_STACK, fontVariables } from "./fonts";
import { LOCALE_DIRECTION } from "../lib/i18n";
import { LocaleProvider } from "../lib/i18n/locale-provider";
import { getRequestLocale } from "../lib/i18n/server";

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
  return (
    <html lang={locale} dir={LOCALE_DIRECTION[locale]} style={fontStyles}>
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}

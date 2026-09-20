import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { DOCUMENT_FONT_STACK, fontVariables } from "./fonts";

import "../styles/tokens.css";

export const metadata: Metadata = {
  title: "Auction Marketplace",
  description: "International auction marketplace",
};

const fontStyles: CSSProperties = {
  ...fontVariables,
  fontFamily: DOCUMENT_FONT_STACK,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" style={fontStyles}>
      <body>{children}</body>
    </html>
  );
}

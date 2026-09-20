"use client";

import { useI18n } from "../../lib/i18n/locale-provider";
import { Button } from "../primitives/Button";

export interface LanguageToggleProps {
  readonly label: string;
}

export function LanguageToggle({ label }: LanguageToggleProps) {
  const { locale, setLocale } = useI18n();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <Button
      variant="outline"
      size="md"
      onClick={() => setLocale(next)}
      aria-label={`${label}: ${next.toUpperCase()}`}
    >
      {next === "ar" ? "عربي" : "English"}
    </Button>
  );
}

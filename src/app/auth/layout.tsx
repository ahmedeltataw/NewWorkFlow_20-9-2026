import type { ReactNode } from "react";

import { translate } from "../../lib/i18n";
import { getRequestLocale } from "../../lib/i18n/server";

export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = await getRequestLocale();

  return (
    <div className="px-4 py-6 md:px-6 lg:grid lg:grid-cols-2 lg:gap-6">
      <div
        data-testid="auth-form-column"
        className="mx-auto w-full max-w-[480px]"
      >
        {children}
      </div>
      <div
        data-testid="auth-brand-panel"
        className="hidden rounded-lg bg-surface-card-primary-bg p-10 text-text-primary lg:flex lg:flex-col lg:justify-center lg:gap-4"
      >
        <p className="text-h1">{translate(locale, "app.name")}</p>
        <p className="text-body text-text-sub-text">
          {translate(locale, "auth.brand.tagline")}
        </p>
      </div>
    </div>
  );
}

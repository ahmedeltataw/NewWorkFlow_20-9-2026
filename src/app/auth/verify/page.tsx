"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../../components/primitives";
import { useI18n } from "../../../lib/i18n/locale-provider";

const actions = [
  { labelKey: "auth.verify.approve", status: "success" },
  { labelKey: "auth.verify.decline", status: "failure" },
  { labelKey: "auth.verify.cancel", status: "abandoned" },
] as const;

export default function VerifyPage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <main>
      <h1 className="text-h1 text-text-primary">{t("auth.verify.title")}</h1>
      <p className="mt-3 text-body text-text-sub-text">
        {t("auth.verify.description")}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {actions.map(({ labelKey, status }) => (
          <Button
            key={status}
            variant={status === "success" ? "solid" : "outline"}
            onClick={() => router.push(`/auth/review?status=${status}`)}
          >
            {t(labelKey)}
          </Button>
        ))}
      </div>
    </main>
  );
}

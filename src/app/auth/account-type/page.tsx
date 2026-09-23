"use client";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/primitives";
import { useI18n } from "../../../lib/i18n/locale-provider";
export default function AccountTypePage() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <main>
      <h1 className="text-h1 text-text-primary">
        {t("auth.accountType.title")}
      </h1>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => router.push("/auth/details?type=individual")}>
          {t("auth.accountType.individual")}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/auth/details?type=company")}
        >
          {t("auth.accountType.company")}
        </Button>
      </div>
    </main>
  );
}

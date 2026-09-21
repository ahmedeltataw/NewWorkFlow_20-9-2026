"use client";

import { useRouter } from "next/navigation";

import type { PreservedIntent } from "../../lib/api/result";
import { useT } from "../../lib/i18n/locale-provider";
import { captureLoginIntent } from "../../lib/i18n/intent";
import { Button } from "../../components/primitives/Button";
import { Sheet } from "../../components/primitives/Sheet";

export interface LoginRequiredProps {
  readonly open: boolean;
  readonly intent: PreservedIntent;
  readonly onOpenChange: (open: boolean) => void;
}

/** Responsive guest gate: bottom sheet below md, centred dialog at md+. */
export function LoginRequired({
  open,
  intent,
  onOpenChange,
}: LoginRequiredProps) {
  const router = useRouter();
  const t = useT();

  function continueToSignIn(): void {
    captureLoginIntent(intent);
    onOpenChange(false);
    router.push("/auth/phone");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("auth.loginRequired.title")}
      description={t("auth.loginRequired.description")}
      contentClassName="p-6"
      footer={
        <div className="p-4 pt-0">
          <Button fullWidth onClick={continueToSignIn}>
            {t("auth.loginRequired.continue")}
          </Button>
        </div>
      }
    >
      <p className="text-body text-text-sub-text">
        {t("auth.loginRequired.description")}
      </p>
    </Sheet>
  );
}

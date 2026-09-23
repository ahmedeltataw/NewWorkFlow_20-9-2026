"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenState } from "../../../components/shell/ScreenState";
import { useLoginIntentRestoration } from "../../../features/auth/PhoneSignInEntry";
import { clearPendingRegistrationPhone } from "../../../features/auth/registration-session";
import {
  YakeenReturn,
  type VerificationReturnStatus,
} from "../../../features/auth/YakeenReturn";
import { ApiClient } from "../../../lib/api/api-client";
import { useI18n } from "../../../lib/i18n/locale-provider";
import type {
  CompanyAccount,
  ScreenState as ScreenStateType,
} from "../../../lib/api/types";

const client = new ApiClient();

const reviewSteps = [
  { state: "submitted", labelKey: "auth.review.step.submitted" },
  { state: "underReview", labelKey: "auth.review.step.underReview" },
  { state: "activated", labelKey: "auth.review.step.activated" },
] as const;

function CompanyReview() {
  const { t } = useI18n();
  const [screen, setScreen] = useState<ScreenStateType>({ state: "loading" });
  const [review, setReview] = useState<CompanyAccount["review"] | null>(null);

  const loadReview = useCallback(async () => {
    setScreen({ state: "loading" });
    try {
      const result = await client.getCompanyReview();
      if (result.status === "success" && result.data?.type === "company") {
        setReview(result.data.review);
        setScreen({ state: "ready" });
      } else {
        setScreen({ state: "error", retryEligible: true });
      }
    } catch {
      setScreen({ state: "error", retryEligible: true });
    }
  }, []);

  useEffect(() => {
    void loadReview();
  }, [loadReview]);

  return (
    <main>
      <h1 className="text-h1 text-text-primary">{t("auth.review.title")}</h1>
      <ScreenState
        state={screen}
        loadingLabel={t("auth.review.loading")}
        emptyLabel={t("auth.review.empty")}
        errorLabel={t("auth.review.error")}
        retryLabel={t("auth.review.retry")}
        onRetry={() => void loadReview()}
      >
        {review && (
          <>
            <ol className="mt-6 list-inside list-decimal space-y-3">
              {reviewSteps.map((step) => (
                <li
                  key={step.state}
                  aria-current={review === step.state ? "step" : undefined}
                  className={
                    review === step.state
                      ? "font-semibold text-text-primary"
                      : "text-text-sub-text"
                  }
                >
                  {t(step.labelKey)}
                </li>
              ))}
            </ol>
            <p role="status" className="mt-6">
              {review === "activated"
                ? t("auth.review.available")
                : t("auth.review.unavailable")}
            </p>
          </>
        )}
      </ScreenState>
    </main>
  );
}

export default function ReviewPage() {
  const params = useSearchParams();
  const restoreIntent = useLoginIntentRestoration();
  const status = params.get("status");

  if (status === "success" || status === "failure" || status === "abandoned") {
    return (
      <main>
        <YakeenReturn
          status={status}
          complete={(value: VerificationReturnStatus) =>
            client.completeIdentityVerification({ status: value })
          }
          onSuccess={() => {
            clearPendingRegistrationPhone();
            restoreIntent();
          }}
        />
      </main>
    );
  }

  return <CompanyReview />;
}

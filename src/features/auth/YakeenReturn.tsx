"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/primitives";
import { useI18n } from "../../lib/i18n/locale-provider";
import type { Result } from "../../lib/api/result";
import type { Account } from "../../lib/api/types";

export type VerificationReturnStatus = "success" | "failure" | "abandoned";

const messages = {
  success: "auth.identity.success",
  failure: "auth.identity.failure",
  abandoned: "auth.identity.abandoned",
  completionError: "auth.identity.completionError",
} as const;

export function YakeenReturn({
  status,
  complete,
  onSuccess,
}: {
  readonly status: VerificationReturnStatus;
  readonly complete: (
    status: VerificationReturnStatus,
  ) => Promise<Result<Account>>;
  readonly onSuccess?: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [completion, setCompletion] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const completionRequest = useRef<Promise<Result<Account>> | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    if (status !== "success") return;
    let active = true;
    completionRequest.current ??= complete(status);
    void completionRequest.current
      .then((result) => {
        if (!active) return;
        if (result.status === "success") {
          setCompletion("success");
        } else {
          setCompletion("error");
        }
      })
      .catch(() => {
        if (active) setCompletion("error");
      });
    return () => {
      active = false;
    };
  }, [complete, status]);

  useEffect(() => {
    if (status === "success" && completion === "success" && !restored.current) {
      restored.current = true;
      onSuccess?.();
    }
  }, [completion, onSuccess, status]);

  if (status === "success" && completion === "loading") {
    return <p role="status">{t("auth.identity.completing")}</p>;
  }
  if (status === "success" && completion === "success") {
    return <p role="status">{t(messages.success)}</p>;
  }

  const message =
    status === "abandoned"
      ? messages.abandoned
      : status === "failure"
        ? messages.failure
        : messages.completionError;

  return (
    <>
      <p role="alert">{t(message)}</p>
      <Button onClick={() => router.push("/auth/verify")}>
        {t("auth.identity.retry")}
      </Button>
    </>
  );
}

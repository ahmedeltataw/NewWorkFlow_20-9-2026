"use client";

import { useEffect, useState } from "react";
import { otpResendSeconds } from "../../config/marketplace";
import { isolateLtrRun } from "../../lib/i18n";
import { useI18n } from "../../lib/i18n/locale-provider";
import { Button } from "../primitives/Button";

export interface ResendClock {
  setInterval(callback: () => void, delay: number): number;
  clearInterval(id: number): void;
}

const browserClock: ResendClock = {
  setInterval: (callback, delay) => window.setInterval(callback, delay),
  clearInterval: (id) => window.clearInterval(id),
};

export function OtpResend({
  onResend,
  disabled = false,
  clock = browserClock,
}: {
  readonly onResend: () => void | Promise<void>;
  readonly disabled?: boolean;
  readonly clock?: ResendClock;
}) {
  const { t, formatNumber, isRtl } = useI18n();
  const [remaining, setRemaining] = useState(otpResendSeconds);
  const [announcement, setAnnouncement] = useState<"waiting" | "available">(
    "waiting",
  );
  const isAvailable = remaining === 0;

  useEffect(() => {
    if (isAvailable) {
      setAnnouncement("available");
      return;
    }
    const interval = clock.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clock.clearInterval(interval);
  }, [clock, isAvailable]);

  const minutes = formatNumber(Math.floor(remaining / 60), {
    useGrouping: false,
  });
  const seconds = formatNumber(remaining % 60, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const time = `${minutes}:${seconds}`;
  const displayedTime = isRtl ? isolateLtrRun(time) : time;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setRemaining(otpResendSeconds);
          setAnnouncement("waiting");
          void onResend();
        }}
        disabled={disabled || remaining > 0}
      >
        {remaining > 0
          ? t("auth.otp.resendCountdown", { time: displayedTime })
          : t("auth.otp.resend")}
      </Button>
      <span className="sr-only" aria-live="polite">
        {announcement === "waiting"
          ? t("auth.otp.resendAvailableIn", {
              seconds: formatNumber(otpResendSeconds, { useGrouping: false }),
            })
          : t("auth.otp.resendAvailable")}
      </span>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";

import { ApiClient } from "../../lib/api/api-client";
import { PhoneAndOtpForm } from "./PhoneAndOtpForm";
import { usePendingRegistrationPhone } from "./registration-session";

const client = new ApiClient();

export function OtpFlow() {
  const router = useRouter();
  const phone = usePendingRegistrationPhone();
  if (!phone) return null;

  return (
    <PhoneAndOtpForm
      mode="otp"
      verifyOtp={(code) => client.verifyOtpCode(code)}
      resendOtp={() => client.requestOtpCode(phone)}
      onSuccess={() => router.push("/auth/account-type")}
    />
  );
}

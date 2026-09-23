"use client";

import { useRouter } from "next/navigation";
import { ApiClient } from "../../lib/api/api-client";
import { PhoneAndOtpForm } from "./PhoneAndOtpForm";
import { setPendingRegistrationPhone } from "./registration-session";

const client = new ApiClient();
export function PhoneFlow() {
  const router = useRouter();
  return (
    <PhoneAndOtpForm
      mode="phone"
      requestOtp={(phone) => client.requestOtpCode(phone)}
      onPhoneSuccess={setPendingRegistrationPhone}
      onSuccess={() => router.push("/auth/otp")}
    />
  );
}

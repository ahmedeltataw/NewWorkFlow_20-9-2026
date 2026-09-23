"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PhoneNumber } from "../../lib/api/types";

const storageKey = "registration.pendingPhone";
let fallbackPhone: PhoneNumber | null = null;

function isPhoneNumber(value: unknown): value is PhoneNumber {
  if (!value || typeof value !== "object") return false;
  const phone = value as Partial<PhoneNumber>;
  return (
    typeof phone.countryCode === "string" &&
    typeof phone.nationalNumber === "string"
  );
}

export function setPendingRegistrationPhone(phone: PhoneNumber): void {
  fallbackPhone = phone;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(phone));
  } catch {
    // The in-memory value supports browsers that block session storage.
  }
}

export function getPendingRegistrationPhone(): PhoneNumber | null {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return null;
    try {
      const parsed: unknown = JSON.parse(stored);
      return isPhoneNumber(parsed) ? parsed : null;
    } catch {
      return null;
    }
  } catch {
    return fallbackPhone;
  }
}

export function clearPendingRegistrationPhone(): void {
  fallbackPhone = null;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // No persistent value was available to clear.
  }
}

export function usePendingRegistrationPhone(): PhoneNumber | null {
  const router = useRouter();
  const [phone, setPhone] = useState<PhoneNumber | null>(null);

  useEffect(() => {
    const pendingPhone = getPendingRegistrationPhone();
    if (pendingPhone) setPhone(pendingPhone);
    else router.replace("/auth/phone");
  }, [router]);

  return phone;
}

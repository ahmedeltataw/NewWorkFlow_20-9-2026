"use client";

import { useRef, useState } from "react";
import { Button, FieldHint, Input, Select } from "../../components/primitives";
import { OtpResend } from "../../components/domain/OtpResend";
import { phoneCountryRules } from "../../config/marketplace";
import { useI18n } from "../../lib/i18n/locale-provider";
import type { MessageKey } from "../../messages/ar";
import type { Result } from "../../lib/api/result";
import type { Account, PhoneNumber } from "../../lib/api/types";

type PhoneResult = Result<PhoneNumber> | { readonly status: "success" };
type OtpResult = Result<Account> | { readonly status: "success" };

const phoneFormatErrors: Readonly<Record<string, MessageKey>> = {
  "+966": "auth.phoneForm.invalidSaudi",
  "+973": "auth.phoneForm.invalidBahrain",
};

export function PhoneAndOtpForm({
  mode,
  requestOtp,
  verifyOtp,
  resendOtp,
  onPhoneSuccess,
  onSuccess,
}: {
  readonly mode: "phone" | "otp";
  readonly requestOtp?: (phone: PhoneNumber) => Promise<PhoneResult>;
  readonly verifyOtp?: (code: string) => Promise<OtpResult>;
  readonly resendOtp?: () => Promise<PhoneResult>;
  readonly onPhoneSuccess?: (phone: PhoneNumber) => void;
  readonly onSuccess?: () => void;
}) {
  const { t, formatNumber } = useI18n();
  const [countryCode, setCountryCode] = useState("+966");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [fieldError, setFieldError] = useState<MessageKey | "">("");
  const [formError, setFormError] = useState<MessageKey | "">("");
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const countryRef = useRef<HTMLSelectElement | null>(null);
  const [countryError, setCountryError] = useState<MessageKey | "">("");
  const formatDigit = (value: number) =>
    formatNumber(value, { useGrouping: false });
  const phoneErrorValues = {
    digits: formatDigit(countryCode === "+966" ? 9 : 8),
    prefix: formatDigit(5),
  };
  const submitPhone = async (event: React.FormEvent) => {
    event.preventDefault();
    const country = phoneCountryRules.find(
      (rule) => rule.countryCode === countryCode,
    );
    if (!country) {
      setCountryError("auth.phoneForm.invalidCountry");
      countryRef.current?.focus();
      return;
    }
    if (!country.nationalNumberPattern.test(phone)) {
      setFieldError(
        phoneFormatErrors[countryCode] ?? "auth.phoneForm.invalidCountry",
      );
      phoneRef.current?.focus();
      return;
    }
    setCountryError("");
    setFieldError("");
    setFormError("");
    const submittedPhone = { countryCode, nationalNumber: phone };
    const result = await requestOtp?.(submittedPhone);
    if (result && result.status !== "success") {
      setFormError("auth.phoneForm.sendFailed");
      return;
    }
    onPhoneSuccess?.(submittedPhone);
    onSuccess?.();
  };
  const submitOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = digits.join("");
    if (!/^\d{6}$/.test(code)) {
      setFieldError("auth.otp.invalidCode");
      refs.current[0]?.focus();
      return;
    }
    setFieldError("");
    setFormError("");
    const result = await verifyOtp?.(code);
    if (result && result.status !== "success") {
      setFieldError("auth.otp.rejectedCode");
      refs.current[0]?.focus();
      return;
    }
    onSuccess?.();
  };
  if (mode === "phone")
    return (
      <form
        onSubmit={(event) => void submitPhone(event)}
        className="mt-6 space-y-4"
        noValidate
      >
        <label htmlFor="country">{t("auth.phoneForm.country")}</label>
        <Select
          id="country"
          ref={countryRef}
          value={countryCode}
          onChange={(e) => {
            setCountryCode(e.target.value);
            setCountryError("");
            setFieldError("");
          }}
          aria-invalid={countryError ? true : undefined}
          aria-describedby={countryError ? "country-error" : undefined}
        >
          {phoneCountryRules.map((country) => (
            <option key={country.countryCode} value={country.countryCode}>
              {t(country.labelKey)}
            </option>
          ))}
        </Select>
        {countryError && (
          <FieldHint id="country-error" tone="error" role="alert">
            {t(countryError)}
          </FieldHint>
        )}
        <label htmlFor="phone">{t("auth.phoneForm.phoneNumber")}</label>
        <Input
          id="phone"
          ref={phoneRef}
          inputMode="tel"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, ""));
            setFieldError("");
          }}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "phone-error" : undefined}
        />
        {fieldError && (
          <FieldHint id="phone-error" tone="error" role="alert">
            {t(fieldError, phoneErrorValues)}
          </FieldHint>
        )}
        {formError && (
          <FieldHint id="phone-submit-error" tone="error" role="alert">
            {t(formError)}
          </FieldHint>
        )}
        <Button type="submit">{t("auth.phoneForm.sendCode")}</Button>
      </form>
    );
  function setOtp(index: number, value: string) {
    const pasted = value.replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 1) {
      const next = Array.from({ length: 6 }, (_, i) => pasted[i] ?? "");
      setDigits(next);
      setFieldError("");
      refs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    setDigits((current) =>
      current.map((digit, i) => (i === index ? pasted : digit)),
    );
    setFieldError("");
    if (pasted) refs.current[index + 1]?.focus();
  }
  return (
    <form
      onSubmit={(event) => void submitOtp(event)}
      className="mt-6 space-y-4"
      noValidate
    >
      <fieldset>
        <legend>{t("auth.otp.verificationCode")}</legend>
        <div className="flex gap-2" dir="ltr">
          {digits.map((digit, index) => (
            <Input
              key={index}
              ref={(node) => {
                refs.current[index] = node;
              }}
              value={digit}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={t("auth.otp.digit", {
                number: formatDigit(index + 1),
              })}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? "otp-error" : undefined}
              maxLength={6}
              onChange={(e) => setOtp(index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digit)
                  refs.current[index - 1]?.focus();
              }}
              className="w-10 text-center"
            />
          ))}
        </div>
      </fieldset>
      {fieldError && (
        <FieldHint id="otp-error" tone="error" role="alert">
          {t(fieldError)}
        </FieldHint>
      )}
      {formError && (
        <FieldHint id="otp-submit-error" tone="error" role="alert">
          {t(formError)}
        </FieldHint>
      )}
      <div className="flex gap-3">
        <Button type="submit">{t("auth.otp.verifyCode")}</Button>
        {resendOtp && (
          <OtpResend
            onResend={async () => {
              await resendOtp();
            }}
          />
        )}
      </div>
    </form>
  );
}

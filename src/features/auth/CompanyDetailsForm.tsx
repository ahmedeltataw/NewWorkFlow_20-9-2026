"use client";

import { useRef, useState } from "react";
import { Button, FieldHint, Input } from "../../components/primitives";
import { useI18n } from "../../lib/i18n/locale-provider";
import type { MessageKey } from "../../messages/ar";
import type { PhoneNumber, Account } from "../../lib/api/types";
import type { Result } from "../../lib/api/result";

const messages = {
  companyName: "auth.company.nameRequired",
  submit: "auth.company.submitFailed",
} as const;

export function CompanyDetailsForm({
  phone,
  onSubmit,
  onSubmitted,
}: {
  readonly phone: PhoneNumber;
  readonly onSubmit?: (input: {
    phone: PhoneNumber;
    companyName: string;
  }) => Promise<Result<Account>>;
  readonly onSubmitted?: () => void;
}) {
  const { t } = useI18n();
  const [companyName, setCompanyName] = useState("");
  const [fieldError, setFieldError] = useState<MessageKey | "">("");
  const [formError, setFormError] = useState<MessageKey | "">("");
  const [submitted, setSubmitted] = useState(false);
  const companyNameRef = useRef<HTMLInputElement | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyName.trim()) {
      setFieldError(messages.companyName);
      companyNameRef.current?.focus();
      return;
    }
    setFieldError("");
    setFormError("");
    const result = await onSubmit?.({ phone, companyName });
    if (result && result.status !== "success") {
      setFormError(messages.submit);
      return;
    }
    setSubmitted(true);
    onSubmitted?.();
  };
  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="mt-6 space-y-4"
      noValidate
    >
      <label htmlFor="company-name">{t("auth.company.name")}</label>
      <Input
        id="company-name"
        ref={companyNameRef}
        value={companyName}
        onChange={(e) => {
          setCompanyName(e.target.value);
          setFieldError("");
        }}
        aria-invalid={fieldError ? true : undefined}
        aria-describedby={fieldError ? "company-error" : undefined}
      />
      {fieldError && (
        <FieldHint id="company-error" tone="error" role="alert">
          {t(fieldError)}
        </FieldHint>
      )}
      {formError && (
        <FieldHint id="company-submit-error" tone="error" role="alert">
          {t(formError)}
        </FieldHint>
      )}
      {submitted && <p role="status">{t("auth.company.underReview")}</p>}
      <Button type="submit">{t("auth.company.submit")}</Button>
    </form>
  );
}

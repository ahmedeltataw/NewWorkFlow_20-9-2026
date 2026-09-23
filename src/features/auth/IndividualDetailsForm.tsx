"use client";

import { useRef, useState } from "react";
import { Button, FieldHint, Input, Radio } from "../../components/primitives";
import { useI18n } from "../../lib/i18n/locale-provider";
import type { MessageKey } from "../../messages/ar";
import type { IndividualRegistration } from "../../lib/api/client";
import type { Result } from "../../lib/api/result";
import type {
  Account,
  NationalIdCalendar,
  PhoneNumber,
} from "../../lib/api/types";

type DateField = "day" | "month" | "year";
type FieldName = "nationalId" | DateField;
type FieldErrors = Partial<Record<FieldName, MessageKey>>;

const messages = {
  nationalId: "auth.details.invalidNationalId",
  hijriDay: "auth.details.invalidHijriDay",
  hijriMonth: "auth.details.invalidHijriMonth",
  hijriYear: "auth.details.invalidHijriYear",
  gregorianDay: "auth.details.invalidGregorianDay",
  gregorianMonth: "auth.details.invalidGregorianMonth",
  gregorianYear: "auth.details.invalidGregorianYear",
  futureDate: "auth.details.futureDate",
  submit: "auth.details.submitFailed",
} as const;

const emptyDate = { day: "", month: "", year: "" };
const fieldLabels = {
  day: "auth.details.day",
  month: "auth.details.month",
  year: "auth.details.year",
} as const;

function calendarForId(id: string): NationalIdCalendar {
  return id.startsWith("1") ? "hijri" : "gregorian";
}

function validateDate(
  date: typeof emptyDate,
  calendar: NationalIdCalendar,
): FieldErrors {
  const errors: FieldErrors = {};
  const day = Number(date.day);
  const month = Number(date.month);
  const year = Number(date.year);

  if (calendar === "hijri") {
    if (!date.day || day < 1 || day > 30) errors.day = messages.hijriDay;
    if (!date.month || month < 1 || month > 12)
      errors.month = messages.hijriMonth;
    if (!date.year || year < 1300 || year > 1450)
      errors.year = messages.hijriYear;
    return errors;
  }

  const now = new Date();
  if (!date.month || month < 1 || month > 12)
    errors.month = messages.gregorianMonth;
  if (!date.year || year < 1900 || year > now.getFullYear())
    errors.year = messages.gregorianYear;
  const candidate = new Date(year, month - 1, day);
  if (
    !date.day ||
    day < 1 ||
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    errors.day = messages.gregorianDay;
  } else if (!errors.year && !errors.month && candidate > now) {
    errors.day = messages.futureDate;
  }
  return errors;
}

export function IndividualDetailsForm({
  phone,
  onSubmit,
  onSuccess,
}: {
  readonly phone: PhoneNumber;
  readonly onSubmit?: (
    input: IndividualRegistration,
  ) => Promise<Result<Account>>;
  readonly onSuccess?: (nationality: "saudi" | "nonSaudi") => void;
}) {
  const { t, formatNumber } = useI18n();
  const [nationality, setNationality] = useState<"saudi" | "nonSaudi">("saudi");
  const [nationalId, setNationalId] = useState("");
  const [date, setDate] = useState(emptyDate);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<MessageKey | "">("");
  const refs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});
  const calendar = calendarForId(nationalId);
  const formatDigit = (value: number) =>
    formatNumber(value, { useGrouping: false });
  function errorText(key: MessageKey): string {
    if (key === messages.nationalId) {
      return t(key, {
        digits: formatDigit(10),
        first: formatDigit(1),
        second: formatDigit(2),
      });
    }
    if (key === messages.hijriYear) {
      return t(key, {
        minimum: formatDigit(1300),
        maximum: formatDigit(1450),
      });
    }
    if (key === messages.gregorianYear) {
      return t(key, { minimum: formatDigit(1900) });
    }
    if (key === messages.hijriDay) {
      return t(key, { minimum: formatDigit(1), maximum: formatDigit(30) });
    }
    if (key === messages.hijriMonth || key === messages.gregorianMonth) {
      return t(key, { minimum: formatDigit(1), maximum: formatDigit(12) });
    }
    return t(key);
  }

  function changeNationalId(value: string) {
    const nextId = value.replace(/\D/g, "");
    if (calendarForId(nextId) !== calendar) {
      setDate(emptyDate);
      setFieldErrors({});
    } else {
      setFieldErrors((current) => ({ ...current, nationalId: undefined }));
    }
    setNationalId(nextId);
  }

  function changeDate(field: DateField, value: string) {
    setDate((current) => ({ ...current, [field]: value.replace(/\D/g, "") }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: FieldErrors = {
      ...(/^[12]\d{9}$/.test(nationalId)
        ? {}
        : { nationalId: messages.nationalId }),
      ...validateDate(date, calendar),
    };
    setFieldErrors(errors);
    setFormError("");
    const firstInvalid = (["nationalId", "day", "month", "year"] as const).find(
      (field) => errors[field],
    );
    if (firstInvalid) {
      refs.current[firstInvalid]?.focus();
      return;
    }

    const result = await onSubmit?.({
      phone,
      nationality,
      nationalId,
      dateCalendar: calendar,
      dateOfBirth: {
        day: Number(date.day),
        month: Number(date.month),
        year: Number(date.year),
      },
    });
    if (result && result.status !== "success") {
      setFormError(messages.submit);
      return;
    }
    onSuccess?.(nationality);
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="mt-6 space-y-4"
      noValidate
    >
      <fieldset>
        <legend>{t("auth.details.nationality")}</legend>
        <Radio
          name="nationality"
          checked={nationality === "saudi"}
          onChange={() => setNationality("saudi")}
          label={t("auth.details.saudi")}
        />
        <Radio
          name="nationality"
          checked={nationality === "nonSaudi"}
          onChange={() => setNationality("nonSaudi")}
          label={t("auth.details.nonSaudi")}
        />
      </fieldset>
      <label htmlFor="national-id">{t("auth.details.nationalId")}</label>
      <Input
        id="national-id"
        ref={(node) => {
          refs.current.nationalId = node;
        }}
        inputMode="numeric"
        value={nationalId}
        onChange={(event) => changeNationalId(event.target.value)}
        aria-invalid={fieldErrors.nationalId ? true : undefined}
        aria-describedby={
          fieldErrors.nationalId ? "national-id-error" : undefined
        }
      />
      {fieldErrors.nationalId && (
        <FieldHint id="national-id-error" tone="error" role="alert">
          {errorText(fieldErrors.nationalId)}
        </FieldHint>
      )}
      <fieldset className="space-y-4">
        <legend>
          {t("auth.details.birthDate", {
            calendar: t(
              calendar === "hijri" ? "calendar.hijri" : "calendar.gregorian",
            ),
          })}
        </legend>
        {(["day", "month", "year"] as const).map((field) => (
          <div key={field}>
            <label htmlFor={`dob-${field}`}>{t(fieldLabels[field])}</label>
            <Input
              id={`dob-${field}`}
              ref={(node) => {
                refs.current[field] = node;
              }}
              type="number"
              inputMode="numeric"
              value={date[field]}
              onChange={(event) => changeDate(field, event.target.value)}
              aria-invalid={fieldErrors[field] ? true : undefined}
              aria-describedby={
                fieldErrors[field] ? `dob-${field}-error` : undefined
              }
            />
            {fieldErrors[field] && (
              <FieldHint id={`dob-${field}-error`} tone="error" role="alert">
                {errorText(fieldErrors[field])}
              </FieldHint>
            )}
          </div>
        ))}
      </fieldset>
      {formError && (
        <FieldHint id="details-error" tone="error" role="alert">
          {t(formError)}
        </FieldHint>
      )}
      <Button type="submit">{t("auth.details.continue")}</Button>
    </form>
  );
}

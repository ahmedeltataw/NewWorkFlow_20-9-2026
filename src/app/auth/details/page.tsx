"use client";

import { useSearchParams, useRouter } from "next/navigation";

import { ApiClient } from "../../../lib/api/api-client";
import { useI18n } from "../../../lib/i18n/locale-provider";
import { IndividualDetailsForm } from "../../../features/auth/IndividualDetailsForm";
import { CompanyDetailsForm } from "../../../features/auth/CompanyDetailsForm";
import { useLoginIntentRestoration } from "../../../features/auth/PhoneSignInEntry";
import {
  clearPendingRegistrationPhone,
  usePendingRegistrationPhone,
} from "../../../features/auth/registration-session";

const client = new ApiClient();

export default function DetailsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const restoreIntent = useLoginIntentRestoration();
  const phone = usePendingRegistrationPhone();
  const company = params.get("type") === "company";
  if (!phone) return null;

  return (
    <main>
      <h1 className="text-h1 text-text-primary">
        {company
          ? t("auth.details.companyTitle")
          : t("auth.details.individualTitle")}
      </h1>
      {company ? (
        <CompanyDetailsForm
          phone={phone}
          onSubmit={(input) => client.registerCompany(input)}
          onSubmitted={() => {
            clearPendingRegistrationPhone();
            router.push("/auth/review?company=submitted");
          }}
        />
      ) : (
        <IndividualDetailsForm
          phone={phone}
          onSubmit={(input) => client.registerIndividual(input)}
          onSuccess={(nationality) => {
            if (phone.countryCode === "+966" || nationality === "saudi") {
              router.push("/auth/verify");
              return;
            }
            clearPendingRegistrationPhone();
            restoreIntent();
          }}
        />
      )}
    </main>
  );
}

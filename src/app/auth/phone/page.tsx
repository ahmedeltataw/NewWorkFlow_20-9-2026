import { translate } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n/server";
import { PhoneFlow } from "../../../features/auth/PhoneFlow";

/**
 * Phase 4 owns the phone and OTP form. This entry route deliberately does not
 * consume a login continuation: its client flow invokes
 * `useLoginIntentRestoration` only after sign-in succeeds.
 */
export default async function PhoneSignInPage() {
  const locale = await getRequestLocale();

  return (
    <main>
      <h1 className="text-h1 text-text-primary">
        {translate(locale, "auth.phone.title")}
      </h1>
      <p className="mt-3 text-body text-text-sub-text">
        {translate(locale, "auth.phone.description")}
      </p>
      <PhoneFlow />
    </main>
  );
}

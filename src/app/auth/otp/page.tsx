import { OtpFlow } from "../../../features/auth/OtpFlow";
import { translate } from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n/server";

export default async function OtpPage() {
  const locale = await getRequestLocale();
  return (
    <main>
      <h1 className="text-h1 text-text-primary">
        {translate(locale, "auth.otp.title")}
      </h1>
      <OtpFlow />
    </main>
  );
}

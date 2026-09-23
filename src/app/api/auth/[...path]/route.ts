import {
  createCompanyAccount,
  createIndividualAccount,
  createManualVerification,
  createSaudiVerification,
} from "../../../../mocks/factories";
import {
  serverError,
  success,
  validationFailure,
} from "../../../../mocks/handlers/shared";
import type {
  CompanyRegistration,
  IdentityVerificationReturn,
  IndividualRegistration,
} from "../../../../lib/api/client";
import type { PhoneNumber } from "../../../../lib/api/types";

/** Server fallback for the same auth fixtures used by the browser worker. */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const route = path.join("/");
  if (route === "national-id/calendar") {
    const nationalId = new URL(request.url).searchParams.get("nationalId");
    if (!nationalId)
      return validationFailure({ nationalId: "national-id-required" });
    return success({
      calendar: nationalId.startsWith("1") ? "hijri" : "gregorian",
      nationalId,
    });
  }
  if (route === "company-review") {
    return success(createCompanyAccount({ review: "submitted" }));
  }
  if (route === "session") return success(createIndividualAccount());
  return Response.json(
    { status: "error", message: "mock-api-route-not-found" },
    { status: 404 },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const route = path.join("/");
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return serverError();
  }
  if (route === "otp") {
    const phone = body as PhoneNumber;
    return phone.nationalNumber
      ? success(phone)
      : validationFailure({ phone: "phone-number-required" });
  }
  if (route === "otp/verify") return success(createIndividualAccount());
  if (route === "register/individual") {
    const input = body as IndividualRegistration;
    if (!input.nationalId?.trim())
      return validationFailure({ nationalId: "national-id-required" });
    return success(
      createIndividualAccount({
        phone: input.phone,
        nationality: input.nationality,
        nationalId: input.nationalId,
        dateCalendar: input.dateCalendar,
        dateOfBirth: input.dateOfBirth,
        verification:
          input.nationality === "saudi"
            ? createSaudiVerification("success")
            : createManualVerification(),
      }),
    );
  }
  if (route === "register/company") {
    const input = body as CompanyRegistration;
    if (!input.companyName?.trim())
      return validationFailure({ companyName: "company-name-required" });
    return success(
      createCompanyAccount({
        phone: input.phone,
        companyName: input.companyName,
        review: "submitted",
      }),
    );
  }
  if (route === "yakeen/return" || route === "verification/return") {
    const input = body as IdentityVerificationReturn;
    return success(
      createIndividualAccount({
        verification: createSaudiVerification(input.status),
      }),
    );
  }
  return Response.json(
    { status: "error", message: "mock-api-route-not-found" },
    { status: 404 },
  );
}

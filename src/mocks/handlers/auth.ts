/**
 * T038 Auth MSW request handlers and fixture scenarios for the
 * auction marketplace.
 *
 * This module owns every authentication-related operation the typed
 * UI data client exposes (`AuctionMarketplaceClient` in
 * `src/lib/api/client.ts`) over MSW v2. It implements the full
 * account-flow surface: session lookup, OTP request and verification,
 * national-ID calendar switching, Saudi Yakeen/Nafath return,
 * individual/company registration, and company-review lifecycle.
 *
 * Response envelope contract (matches `src/lib/api/result.ts`):
 * - success          -> 200 `{ status: "success", data }`
 * - validationFailure -> 400 `{ status: "validationFailure", fieldErrors }`
 * - gateRequired     -> 401 `{ status: "gateRequired", intent }`
 * - error            -> 500 `{ status: "error", kind, message, retryEligible }`
 * - notFound         -> 404 `{ status: "error", kind: "notFound", ... }`
 *
 * Scenario layer: a switchable, deterministic set of behaviours covering
 * default, loading (delayed), empty, error, guest (unauthenticated), and
 * role-based variants. Gated endpoints return a `gateRequired` result
 * in the guest scenario.
 *
 * This module imports neither `msw/node` nor `msw/browser`, so it is
 * safe to share between the node test server (`server.ts`) and the
 * browser worker (`browser.ts`).
 */

import {
  createIndividualAccount,
  createCompanyAccount,
  createSaudiVerification,
  createManualVerification,
} from "../factories";
import type {
  Account,
  CompanyAccount,
  NationalIdCalendar,
  PhoneNumber,
} from "../../lib/api/types";
import type {
  IndividualRegistration,
  CompanyRegistration,
  IdentityVerificationReturn,
} from "../../lib/api/client";
import {
  apiRoutes,
  success,
  gateRequired,
  validationFailure,
  serverError,
} from "./shared";
import { http, delay } from "msw";
import type { HttpHandler } from "msw";

export { apiRoutes };

export type MockScenario =
  "default" | "loading" | "empty" | "error" | "guest" | "role";

export type MockRole =
  | "individualSaudi"
  | "individualNonSaudi"
  | "companySubmitted"
  | "companyUnderReview"
  | "companyActivated";

export const mockScenarios: readonly MockScenario[] = [
  "default",
  "loading",
  "empty",
  "error",
  "guest",
  "role",
];

export const mockRoles: readonly MockRole[] = [
  "individualSaudi",
  "individualNonSaudi",
  "companySubmitted",
  "companyUnderReview",
  "companyActivated",
];

export const DEFAULT_MOCK_DELAY_MS = 400;

export interface MockState {
  readonly scenario: MockScenario;
  readonly role: MockRole;
  readonly delayMs: number;
}

const defaultState: MockState = {
  scenario: "default",
  role: "individualSaudi",
  delayMs: DEFAULT_MOCK_DELAY_MS,
};

export function getDefaultState(): MockState {
  return { ...defaultState };
}

export function createAuthHandlers(state: MockState): readonly HttpHandler[] {
  function waitForScenarioDelay(): Promise<void> {
    if (state.scenario === "loading") {
      return delay(state.delayMs);
    }
    return Promise.resolve();
  }

  function isGated(): boolean {
    return state.scenario === "guest";
  }

  function urlOf(request: Request): URL {
    return new URL(request.url);
  }

  function accountForRole(role: MockRole): Account {
    switch (role) {
      case "individualSaudi":
        return createIndividualAccount();
      case "individualNonSaudi":
        return createIndividualAccount({ nationality: "nonSaudi" });
      case "companySubmitted":
        return createCompanyAccount({ review: "submitted" });
      case "companyUnderReview":
        return createCompanyAccount({ review: "underReview" });
      case "companyActivated":
        return createCompanyAccount({ review: "activated" });
    }
  }

  function currentAccount(): Account {
    return accountForRole(state.role);
  }

  function companyReviewForRole(): CompanyAccount["review"] {
    if (state.role === "companySubmitted") return "submitted";
    if (state.role === "companyUnderReview") return "underReview";
    if (state.role === "companyActivated") return "activated";
    return "submitted";
  }

  const handlers: readonly HttpHandler[] = [
    /* -------- Session --------------------------------------------------- */
    http.get(apiRoutes.session, async () => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      if (isGated()) return success<Account | null>(null);
      return success<Account | null>(currentAccount());
    }),

    /* -------- OTP request ----------------------------------------------- */
    http.post(apiRoutes.authOtp, async ({ request }) => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      const body = (await request.json()) as PhoneNumber;
      if (!body.nationalNumber) {
        return validationFailure({ phone: "phone-number-required" });
      }
      return success<PhoneNumber>(body);
    }),

    /* -------- OTP verification ------------------------------------------ */
    http.post(apiRoutes.otpVerify, async () => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      if (isGated()) {
        return gateRequired(
          new Request("http://localhost:3000/api/auth/otp/verify"),
          "personal-area",
        );
      }
      return success<Account>(currentAccount());
    }),

    /* -------- Individual registration ----------------------------------- */
    http.post(apiRoutes.registerIndividual, async ({ request }) => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      const body = (await request.json()) as IndividualRegistration;
      if (!body.nationalId?.trim()) {
        return validationFailure({ nationalId: "national-id-required" });
      }
      const account = createIndividualAccount({
        phone: body.phone,
        nationality: body.nationality,
        nationalId: body.nationalId,
        dateCalendar: body.dateCalendar,
        dateOfBirth: body.dateOfBirth,
        verification:
          body.nationality === "saudi"
            ? createSaudiVerification("success")
            : createManualVerification(),
      });
      return success<Account>(account);
    }),

    /* -------- Company registration -------------------------------------- */
    http.post(apiRoutes.registerCompany, async ({ request }) => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      const body = (await request.json()) as CompanyRegistration;
      if (!body.companyName?.trim()) {
        return validationFailure({ companyName: "company-name-required" });
      }
      return success<Account>(
        createCompanyAccount({
          phone: body.phone,
          companyName: body.companyName,
          review: "submitted",
        }),
      );
    }),

    /* -------- Verification return --------------------------------------- */
    http.post(apiRoutes.verificationReturn, async ({ request }) => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      const body = (await request.json()) as IdentityVerificationReturn;
      return success<Account>(
        createIndividualAccount({
          verification: createSaudiVerification(body.status),
        }),
      );
    }),

    /* -------- National-ID calendar -------------------------------------- */
    http.get(apiRoutes.nationalIdCalendar, async ({ request }) => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      const url = urlOf(request);
      const nationalId = url.searchParams.get("nationalId");
      if (!nationalId) {
        return validationFailure({ nationalId: "national-id-required" });
      }
      const calendar: NationalIdCalendar = nationalId.startsWith("1")
        ? "hijri"
        : "gregorian";
      return success<{ calendar: NationalIdCalendar; nationalId: string }>({
        calendar,
        nationalId,
      });
    }),

    /* -------- Yakeen/Nafath return -------------------------------------- */
    http.post(apiRoutes.yakeenReturn, async ({ request }) => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      const body = (await request.json()) as IdentityVerificationReturn;
      return success<Account>(
        createIndividualAccount({
          verification: createSaudiVerification(body.status),
        }),
      );
    }),

    /* -------- Company review -------------------------------------------- */
    http.get(apiRoutes.companyReview, async () => {
      await waitForScenarioDelay();
      if (state.scenario === "error") return serverError();
      if (isGated()) {
        return gateRequired(
          new Request("http://localhost:3000/api/auth/company-review"),
          "personal-area",
        );
      }
      return success<CompanyAccount>(
        createCompanyAccount({ review: companyReviewForRole() }),
      );
    }),

    /* -------- Profile --------------------------------------------------- */
    http.get(apiRoutes.profile, async ({ request }) => {
      await waitForScenarioDelay();
      if (isGated()) {
        return gateRequired(request, "personal-area");
      }
      if (state.scenario === "error") return serverError();
      return success<Account>(currentAccount());
    }),
  ];

  return handlers;
}

/* ------------------------------------------------------------------------- */
/* Typed account fixture scenarios                                          */
/* ------------------------------------------------------------------------- */

export interface AccountScenario {
  readonly name: string;
  readonly description: string;
  readonly account: Account;
}

export const accountScenarios: readonly AccountScenario[] = [
  {
    name: "auth/individual-saudi",
    description: "Saudi individual account with verified national identity",
    account: createIndividualAccount(),
  },
  {
    name: "auth/individual-non-saudi",
    description: "Non-Saudi individual account registered manually",
    account: createIndividualAccount({ nationality: "nonSaudi" }),
  },
  {
    name: "auth/company-submitted",
    description: "Company account in submitted review state",
    account: createCompanyAccount({ review: "submitted" }),
  },
  {
    name: "auth/company-under-review",
    description: "Company account currently under review",
    account: createCompanyAccount({ review: "underReview" }),
  },
  {
    name: "auth/company-activated",
    description: "Company account fully activated and selling",
    account: createCompanyAccount({ review: "activated" }),
  },
  {
    name: "auth/saudi-verification-pending",
    description: "Saudi individual awaiting Yakeen/Nafath verification",
    account: createIndividualAccount({
      verification: createSaudiVerification("pending"),
    }),
  },
  {
    name: "auth/saudi-verification-redirected",
    description: "Saudi individual redirected to Yakeen/Nafath",
    account: createIndividualAccount({
      verification: createSaudiVerification("redirected"),
    }),
  },
  {
    name: "auth/saudi-verification-failed",
    description: "Saudi individual with failed Yakeen/Nafath verification",
    account: createIndividualAccount({
      verification: createSaudiVerification("failure"),
    }),
  },
  {
    name: "auth/saudi-verification-abandoned",
    description: "Saudi individual who abandoned Yakeen/Nafath verification",
    account: createIndividualAccount({
      verification: createSaudiVerification("abandoned"),
    }),
  },
];

/* ------------------------------------------------------------------------- */
/* OTP scenarios                                                            */
/* ------------------------------------------------------------------------- */

export interface OtpScenario {
  readonly name: string;
  readonly description: string;
  readonly handlers: readonly HttpHandler[];
}

export const otpScenarios: readonly OtpScenario[] = [
  {
    name: "auth/otp/request-success",
    description: "OTP request returns the submitted phone number",
    handlers: [
      http.post(apiRoutes.authOtp, async ({ request }) => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        const body = (await request.json()) as PhoneNumber;
        if (!body.nationalNumber) {
          return validationFailure({ phone: "phone-number-required" });
        }
        return success<PhoneNumber>(body);
      }),
    ],
  },
  {
    name: "auth/otp/request-invalid",
    description:
      "OTP request without a phone number returns validation failure",
    handlers: [
      http.post(apiRoutes.authOtp, async () => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        return validationFailure({ phone: "phone-number-required" });
      }),
    ],
  },
  {
    name: "auth/otp/verify-success",
    description: "OTP verification succeeds and returns the current account",
    handlers: [
      http.post(apiRoutes.otpVerify, async () => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        return success<Account>({
          id: "account-individual-saudi-001",
          phone: { countryCode: "+966", nationalNumber: "555123456" },
          type: "individual",
          nationality: "saudi",
          dateCalendar: "hijri",
          verification: {
            route: "saudiNationalVerification",
            status: "success",
          },
        });
      }),
    ],
  },
  {
    name: "auth/otp/verify-expired",
    description:
      "OTP verification with an expired code returns validation failure",
    handlers: [
      http.post(apiRoutes.otpVerify, async () => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        return validationFailure({ otp: "otp-expired" });
      }),
    ],
  },
];

/* ------------------------------------------------------------------------- */
/* National-ID calendar scenarios                                         */
/* ------------------------------------------------------------------------- */

export interface NationalIdCalendarScenario {
  readonly name: string;
  readonly description: string;
  readonly handlers: readonly HttpHandler[];
}

export const nationalIdCalendarScenarios: readonly NationalIdCalendarScenario[] =
  [
    {
      name: "auth/national-id/hijri-calendar",
      description: "National ID beginning with 1 yields a Hijri calendar",
      handlers: [
        http.get(apiRoutes.nationalIdCalendar, async ({ request }) => {
          await delay(DEFAULT_MOCK_DELAY_MS);
          const url = new URL(request.url);
          const nationalId = url.searchParams.get("nationalId");
          if (!nationalId) {
            return validationFailure({ nationalId: "national-id-required" });
          }
          const calendar: NationalIdCalendar = nationalId.startsWith("1")
            ? "hijri"
            : "gregorian";
          return success<{ calendar: NationalIdCalendar; nationalId: string }>({
            calendar,
            nationalId,
          });
        }),
      ],
    },
    {
      name: "auth/national-id/gregorian-calendar",
      description: "National ID beginning with 2 yields a Gregorian calendar",
      handlers: [
        http.get(apiRoutes.nationalIdCalendar, async ({ request }) => {
          await delay(DEFAULT_MOCK_DELAY_MS);
          const url = new URL(request.url);
          const nationalId = url.searchParams.get("nationalId");
          if (!nationalId) {
            return validationFailure({ nationalId: "national-id-required" });
          }
          const calendar: NationalIdCalendar = nationalId.startsWith("2")
            ? "gregorian"
            : "hijri";
          return success<{ calendar: NationalIdCalendar; nationalId: string }>({
            calendar,
            nationalId,
          });
        }),
      ],
    },
    {
      name: "auth/national-id/missing",
      description: "Request without a national ID returns validation failure",
      handlers: [
        http.get(apiRoutes.nationalIdCalendar, async () => {
          await delay(DEFAULT_MOCK_DELAY_MS);
          return validationFailure({ nationalId: "national-id-required" });
        }),
      ],
    },
  ];

/* ------------------------------------------------------------------------- */
/* Yakeen/Nafath return scenarios                                         */
/* ------------------------------------------------------------------------- */

export interface YakeenReturnScenario {
  readonly name: string;
  readonly description: string;
  readonly handlers: readonly HttpHandler[];
}

export const yakeenReturnScenarios: readonly YakeenReturnScenario[] = [
  {
    name: "auth/yakeen/success",
    description:
      "Yakeen/Nafath return with success status activates the account",
    handlers: [
      http.post(apiRoutes.yakeenReturn, async ({ request }) => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        const body = (await request.json()) as IdentityVerificationReturn;
        return success<Account>(
          createIndividualAccount({
            verification: createSaudiVerification(body.status),
          }),
        );
      }),
    ],
  },
  {
    name: "auth/yakeen/failure",
    description:
      "Yakeen/Nafath return with failure status returns an unverified account",
    handlers: [
      http.post(apiRoutes.yakeenReturn, async ({ request }) => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        const body = (await request.json()) as IdentityVerificationReturn;
        return success<Account>(
          createIndividualAccount({
            verification: createSaudiVerification(body.status),
          }),
        );
      }),
    ],
  },
  {
    name: "auth/yakeen/abandoned",
    description:
      "Yakeen/Nafath return with abandonment status preserves the pending state",
    handlers: [
      http.post(apiRoutes.yakeenReturn, async ({ request }) => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        const body = (await request.json()) as IdentityVerificationReturn;
        return success<Account>(
          createIndividualAccount({
            verification: createSaudiVerification(body.status),
          }),
        );
      }),
    ],
  },
  {
    name: "auth/yakeen/guest",
    description:
      "Yakeen/Nafath return when unauthenticated returns gateRequired",
    handlers: [
      http.post(apiRoutes.yakeenReturn, async () => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        return gateRequired(
          new Request("http://localhost:3000/api/auth/yakeen/return"),
          "personal-area",
        );
      }),
    ],
  },
];

/* ------------------------------------------------------------------------- */
/* Company-review fixture scenarios                                       */
/* ------------------------------------------------------------------------- */

export interface CompanyReviewScenario {
  readonly name: string;
  readonly description: string;
  readonly handlers: readonly HttpHandler[];
}

export const companyReviewScenarios: readonly CompanyReviewScenario[] = [
  {
    name: "auth/company-review/submitted",
    description:
      "Company review in submitted state returns the account with review=submitted",
    handlers: [
      http.get(apiRoutes.companyReview, async () => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        return success<CompanyAccount>(
          createCompanyAccount({ review: "submitted" }),
        );
      }),
    ],
  },
  {
    name: "auth/company-review/under-review",
    description:
      "Company review in underReview state returns the account with review=underReview",
    handlers: [
      http.get(apiRoutes.companyReview, async () => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        return success<CompanyAccount>(
          createCompanyAccount({ review: "underReview" }),
        );
      }),
    ],
  },
  {
    name: "auth/company-review/activated",
    description:
      "Company review in activated state returns the account with review=activated",
    handlers: [
      http.get(apiRoutes.companyReview, async () => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        return success<CompanyAccount>(
          createCompanyAccount({ review: "activated" }),
        );
      }),
    ],
  },
  {
    name: "auth/company-review/guest",
    description:
      "Company review endpoint returns gateRequired for unauthenticated guests",
    handlers: [
      http.get(apiRoutes.companyReview, async () => {
        await delay(DEFAULT_MOCK_DELAY_MS);
        return gateRequired(
          new Request("http://localhost:3000/api/auth/company-review"),
          "personal-area",
        );
      }),
    ],
  },
];

/* ------------------------------------------------------------------------- */
/* Public scenario catalogue                                                */
/* ------------------------------------------------------------------------- */

export interface AuthScenarioName {
  readonly name: string;
  readonly description: string;
  readonly handlers: readonly HttpHandler[];
}

const allAuthScenarios = [
  ...otpScenarios,
  ...nationalIdCalendarScenarios,
  ...yakeenReturnScenarios,
  ...companyReviewScenarios,
] as const;

export type AuthScenarioNameType = (typeof allAuthScenarios)[number]["name"];

export function authScenarioHandlers(
  name: AuthScenarioNameType,
): readonly HttpHandler[] {
  const scenario = allAuthScenarios.find((s) => s.name === name);
  if (!scenario) {
    throw new Error(`Unknown auth scenario: ${name}`);
  }
  return scenario.handlers;
}

export const authScenarioList: readonly AuthScenarioName[] =
  allAuthScenarios as readonly AuthScenarioName[];

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhoneAndOtpForm } from "../../src/features/auth/PhoneAndOtpForm";
import { IndividualDetailsForm } from "../../src/features/auth/IndividualDetailsForm";
import { CompanyDetailsForm } from "../../src/features/auth/CompanyDetailsForm";
import { LocaleProvider } from "../../src/lib/i18n/locale-provider";
import type { Locale } from "../../src/lib/api/types";
import { ApiClient } from "../../src/lib/api/api-client";
import {
  createCompanyAccount,
  createIndividualAccount,
} from "../../src/mocks/factories";
import { PhoneFlow } from "../../src/features/auth/PhoneFlow";
import { OtpFlow } from "../../src/features/auth/OtpFlow";
import DetailsPage from "../../src/app/auth/details/page";
import VerifyPage from "../../src/app/auth/verify/page";
import ReviewPage from "../../src/app/auth/review/page";
import AccountTypePage from "../../src/app/auth/account-type/page";
import { YakeenReturn } from "../../src/features/auth/YakeenReturn";
import { captureLoginIntent } from "../../src/lib/i18n/intent";
import { authScenarioHandlers } from "../../src/mocks/handlers/auth";
import { setMockScenario } from "../../src/mocks/handlers";
import { addMswHandlers } from "../msw";
import {
  clearPendingRegistrationPhone,
  getPendingRegistrationPhone,
  setPendingRegistrationPhone,
} from "../../src/features/auth/registration-session";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  search: new URLSearchParams(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  useSearchParams: () => navigation.search,
}));

function renderAuth(ui: React.ReactElement, locale: Locale = "en") {
  return render(<LocaleProvider locale={locale}>{ui}</LocaleProvider>);
}

const intentStorage = new Map<string, string>();

async function enterDate(
  user: ReturnType<typeof userEvent.setup>,
  day: string,
  month: string,
  year: string,
) {
  await user.type(screen.getByLabelText("Day"), day);
  await user.type(screen.getByLabelText("Month"), month);
  await user.type(screen.getByLabelText("Year"), year);
}

describe("authentication forms", () => {
  beforeEach(() => {
    clearPendingRegistrationPhone();
    navigation.push.mockClear();
    navigation.replace.mockClear();
    navigation.search = new URLSearchParams();
    intentStorage.clear();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => intentStorage.get(key) ?? null,
        setItem: (key: string, value: string) => intentStorage.set(key, value),
        removeItem: (key: string) => intentStorage.delete(key),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    clearPendingRegistrationPhone();
  });

  it.each([
    ["Saudi Arabia (+966)", "512345678", "+966"],
    ["Bahrain (+973)", "12345678", "+973"],
  ])("accepts a valid %s number", async (country, number, code) => {
    const requestOtp = vi.fn().mockResolvedValue({ status: "success" });
    const user = userEvent.setup();
    renderAuth(<PhoneAndOtpForm mode="phone" requestOtp={requestOtp} />);

    await user.selectOptions(screen.getByLabelText("Country"), country);
    await user.type(screen.getByLabelText("Phone number"), number);
    await user.click(screen.getByRole("button", { name: "Send code" }));

    expect(requestOtp).toHaveBeenCalledWith({
      countryCode: code,
      nationalNumber: number,
    });
  });

  it.each([
    [
      "Saudi Arabia (+966)",
      "123456789",
      "Enter a 9-digit Saudi mobile number starting with 5",
    ],
    ["Bahrain (+973)", "123456789", "Enter an 8-digit Bahrain phone number"],
  ])("rejects an invalid %s number", async (country, number, message) => {
    const requestOtp = vi.fn();
    const user = userEvent.setup();
    renderAuth(<PhoneAndOtpForm mode="phone" requestOtp={requestOtp} />);

    await user.selectOptions(screen.getByLabelText("Country"), country);
    await user.type(screen.getByLabelText("Phone number"), number);
    await user.click(screen.getByRole("button", { name: "Send code" }));

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(requestOtp).not.toHaveBeenCalled();
  });

  it("accepts a pasted OTP", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ status: "success" });
    const user = userEvent.setup();
    renderAuth(<PhoneAndOtpForm mode="otp" verifyOtp={verifyOtp} />);

    await user.click(screen.getByLabelText("Verification digit 1"));
    await user.paste("123456");
    await user.click(screen.getByRole("button", { name: "Verify code" }));

    expect(verifyOtp).toHaveBeenCalledWith("123456");
  });

  it("enables resend after 60 seconds and restarts the countdown", async () => {
    const resendOtp = vi.fn().mockResolvedValue({ status: "success" });
    vi.useFakeTimers();
    renderAuth(<PhoneAndOtpForm mode="otp" resendOtp={resendOtp} />);

    expect(
      screen.getByRole("button", { name: "Resend code in 1:00" }),
    ).toBeDisabled();
    act(() => vi.advanceTimersByTime(18000));
    expect(
      screen.getByRole("button", { name: "Resend code in 0:42" }),
    ).toBeDisabled();
    act(() => vi.advanceTimersByTime(42000));
    const button = screen.getByRole("button", { name: "Resend code" });
    expect(button).toBeEnabled();
    act(() => button.click());
    expect(resendOtp).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Resend code in 1:00" }),
    ).toBeDisabled();
  });

  it("carries the submitted phone to individual registration", async () => {
    const phone = { countryCode: "+973", nationalNumber: "12345678" };
    vi.spyOn(ApiClient.prototype, "requestOtpCode").mockResolvedValue({
      status: "success",
      data: phone,
    });
    const register = vi
      .spyOn(ApiClient.prototype, "registerIndividual")
      .mockResolvedValue({
        status: "success",
        data: createIndividualAccount(),
      });
    const user = userEvent.setup();
    const flow = renderAuth(<PhoneFlow />);
    await user.selectOptions(screen.getByLabelText("Country"), "+973");
    await user.type(
      screen.getByLabelText("Phone number"),
      phone.nationalNumber,
    );
    await user.click(screen.getByRole("button", { name: "Send code" }));
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/auth/otp"),
    );
    expect(getPendingRegistrationPhone()).toEqual(phone);

    flow.unmount();
    renderAuth(<DetailsPage />);
    await user.type(await screen.findByLabelText("National ID"), "2234567890");
    await enterDate(user, "15", "06", "1995");
    await user.click(
      screen.getByRole("button", { name: "Continue verification" }),
    );
    await waitFor(() =>
      expect(register).toHaveBeenCalledWith(expect.objectContaining({ phone })),
    );
  });

  it("uses the pending phone for resend and redirects when it is missing", async () => {
    const phone = { countryCode: "+973", nationalNumber: "12345678" };
    setPendingRegistrationPhone(phone);
    const requestOtp = vi
      .spyOn(ApiClient.prototype, "requestOtpCode")
      .mockResolvedValue({ status: "success", data: phone });
    vi.useFakeTimers();
    const flow = renderAuth(<OtpFlow />);
    act(() => vi.advanceTimersByTime(60000));
    act(() => screen.getByRole("button", { name: "Resend code" }).click());
    expect(requestOtp).toHaveBeenCalledWith(phone);
    flow.unmount();
    clearPendingRegistrationPhone();
    renderAuth(<OtpFlow />);
    expect(navigation.replace).toHaveBeenCalledWith("/auth/phone");
  });

  it("uses the pending phone for company registration", async () => {
    const phone = { countryCode: "+973", nationalNumber: "12345678" };
    setPendingRegistrationPhone(phone);
    navigation.search = new URLSearchParams("type=company");
    const register = vi
      .spyOn(ApiClient.prototype, "registerCompany")
      .mockResolvedValue({ status: "success", data: createCompanyAccount() });
    const user = userEvent.setup();
    renderAuth(<DetailsPage />);

    await user.type(
      await screen.findByLabelText("Company name"),
      "Auction House",
    );
    await user.click(screen.getByRole("button", { name: "Submit company" }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        phone,
        companyName: "Auction House",
      }),
    );
    expect(getPendingRegistrationPhone()).toBeNull();
  });

  it("routes a Saudi phone to identity verification for a non-Saudi national", async () => {
    setPendingRegistrationPhone({
      countryCode: "+966",
      nationalNumber: "512345678",
    });
    vi.spyOn(ApiClient.prototype, "registerIndividual").mockResolvedValue({
      status: "success",
      data: createIndividualAccount(),
    });
    const user = userEvent.setup();
    renderAuth(<DetailsPage />);
    await user.click(await screen.findByRole("radio", { name: "Non-Saudi" }));
    await user.type(screen.getByLabelText("National ID"), "2234567890");
    await enterDate(user, "15", "06", "1995");
    await user.click(
      screen.getByRole("button", { name: "Continue verification" }),
    );

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/auth/verify"),
    );
    expect(getPendingRegistrationPhone()).not.toBeNull();
  });

  it("routes a Saudi national with a Bahrain phone to verification", async () => {
    setPendingRegistrationPhone({
      countryCode: "+973",
      nationalNumber: "12345678",
    });
    vi.spyOn(ApiClient.prototype, "registerIndividual").mockResolvedValue({
      status: "success",
      data: createIndividualAccount(),
    });
    const user = userEvent.setup();
    renderAuth(<DetailsPage />);
    await user.type(await screen.findByLabelText("National ID"), "1234567890");
    await enterDate(user, "15", "06", "1415");
    await user.click(
      screen.getByRole("button", { name: "Continue verification" }),
    );

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/auth/verify"),
    );
    expect(getPendingRegistrationPhone()).not.toBeNull();
  });

  it("restores the intent and clears the phone for a non-Saudi registration", async () => {
    setPendingRegistrationPhone({
      countryCode: "+973",
      nationalNumber: "12345678",
    });
    captureLoginIntent({ intent: "bid", returnTo: "/auctions/auction-42" });
    vi.spyOn(ApiClient.prototype, "registerIndividual").mockResolvedValue({
      status: "success",
      data: createIndividualAccount({ nationality: "nonSaudi" }),
    });
    const user = userEvent.setup();
    renderAuth(<DetailsPage />);
    await user.click(await screen.findByRole("radio", { name: "Non-Saudi" }));
    await user.type(screen.getByLabelText("National ID"), "2234567890");
    await enterDate(user, "15", "06", "1995");
    await user.click(
      screen.getByRole("button", { name: "Continue verification" }),
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/auctions/auction-42"),
    );
    expect(getPendingRegistrationPhone()).toBeNull();
  });

  it("redirects details to the phone step without a pending phone", () => {
    renderAuth(<DetailsPage />);
    expect(navigation.replace).toHaveBeenCalledWith("/auth/phone");
    expect(screen.queryByLabelText("National ID")).not.toBeInTheDocument();
  });

  it.each([
    ["Approve", "success"],
    ["Decline", "failure"],
    ["Cancel", "abandoned"],
  ])("mock provider %s returns %s", async (action, status) => {
    const user = userEvent.setup();
    renderAuth(<VerifyPage />);
    expect(
      screen.getByRole("heading", { name: "Mock national identity provider" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: action }));
    expect(navigation.push).toHaveBeenCalledWith(
      `/auth/review?status=${status}`,
    );
  });

  it("completes successful identity verification before restoring the intent", async () => {
    const complete = vi.fn().mockResolvedValue({
      status: "success",
      data: createIndividualAccount(),
    });
    const onSuccess = vi.fn();
    renderAuth(
      <YakeenReturn
        status="success"
        complete={complete}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(complete).toHaveBeenCalledWith("success");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Identity verification succeeded",
    );
  });

  it.each([
    ["failure", "Identity verification failed"],
    ["abandoned", "Identity verification was abandoned"],
  ] as const)(
    "shows %s and retries through the provider",
    async (status, message) => {
      const complete = vi.fn();
      const user = userEvent.setup();
      renderAuth(<YakeenReturn status={status} complete={complete} />);
      expect(screen.getByRole("alert")).toHaveTextContent(message);
      expect(complete).not.toHaveBeenCalled();
      await user.click(
        screen.getByRole("button", { name: "Try verification again" }),
      );
      expect(navigation.push).toHaveBeenCalledWith("/auth/verify");
    },
  );

  it("clears the pending phone and restores intent after successful review", async () => {
    setPendingRegistrationPhone({
      countryCode: "+966",
      nationalNumber: "512345678",
    });
    captureLoginIntent({ intent: "bid", returnTo: "/auctions/auction-42" });
    navigation.search = new URLSearchParams("status=success");
    const complete = vi
      .spyOn(ApiClient.prototype, "completeIdentityVerification")
      .mockResolvedValue({
        status: "success",
        data: createIndividualAccount(),
      });
    renderAuth(<ReviewPage />);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/auctions/auction-42"),
    );
    expect(complete).toHaveBeenCalledWith({ status: "success" });
    expect(getPendingRegistrationPhone()).toBeNull();
  });

  it.each([
    [
      "auth/company-review/submitted",
      "Submitted",
      "Selling is unavailable until your company is activated",
    ],
    [
      "auth/company-review/under-review",
      "Under review",
      "Selling is unavailable until your company is activated",
    ],
    ["auth/company-review/activated", "Activated", "Selling is available"],
  ] as const)(
    "loads %s from the company-review API",
    async (scenario, current, availability) => {
      addMswHandlers(...authScenarioHandlers(scenario));
      navigation.search = new URLSearchParams("company=activated");
      renderAuth(<ReviewPage />);
      expect(
        screen.getByRole("status", { name: "Loading company review" }),
      ).toBeInTheDocument();

      const currentStep = await screen.findByText(current);
      expect(currentStep.closest("li")).toHaveAttribute("aria-current", "step");
      expect(screen.getByRole("list").querySelectorAll("li")).toHaveLength(3);
      expect(screen.getByRole("status")).toHaveTextContent(availability);
    },
  );

  it("shows a retry when company review fails", async () => {
    setMockScenario("error");
    renderAuth(<ReviewPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load company review",
    );
    setMockScenario("default");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    expect(
      (await screen.findByText("Submitted")).closest("li"),
    ).toHaveAttribute("aria-current", "step");
  });

  it("switches calendars and clears the date when the ID prefix changes", async () => {
    const user = userEvent.setup();
    renderAuth(
      <IndividualDetailsForm
        phone={{ countryCode: "+966", nationalNumber: "555123456" }}
      />,
    );

    await user.type(screen.getByLabelText("National ID"), "1234567890");
    expect(
      screen.getByRole("group", { name: "Date of birth (Hijri)" }),
    ).toBeInTheDocument();
    await enterDate(user, "15", "06", "1415");
    await user.clear(screen.getByLabelText("National ID"));
    await user.type(screen.getByLabelText("National ID"), "2234567890");
    expect(
      screen.getByRole("group", { name: "Date of birth (Gregorian)" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toHaveValue(null);
    expect(screen.getByLabelText("Month")).toHaveValue(null);
    expect(screen.getByLabelText("Year")).toHaveValue(null);
  });

  it("keeps company selling restricted until activated", async () => {
    const user = userEvent.setup();
    renderAuth(
      <CompanyDetailsForm
        phone={{ countryCode: "+966", nationalNumber: "555123456" }}
      />,
    );

    await user.type(screen.getByLabelText("Company name"), "Auction House");
    await user.click(screen.getByRole("button", { name: "Submit company" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Selling is unavailable while your company is under review",
    );
  });

  it.each([
    ["1234567890", "Hijri", "1415", "hijri"],
    ["2234567890", "Gregorian", "1995", "gregorian"],
  ])(
    "accepts a %s birth date and submits its calendar",
    async (id, label, year, calendar) => {
      const onSubmit = vi.fn().mockResolvedValue({ status: "success" });
      const user = userEvent.setup();
      renderAuth(
        <IndividualDetailsForm
          phone={{ countryCode: "+973", nationalNumber: "12345678" }}
          onSubmit={onSubmit}
        />,
      );
      await user.type(screen.getByLabelText("National ID"), id);
      expect(
        screen.getByRole("group", { name: `Date of birth (${label})` }),
      ).toBeInTheDocument();
      await enterDate(user, "15", "06", year);
      await user.click(
        screen.getByRole("button", { name: "Continue verification" }),
      );

      expect(onSubmit).toHaveBeenCalledWith({
        phone: { countryCode: "+973", nationalNumber: "12345678" },
        nationality: "saudi",
        nationalId: id,
        dateCalendar: calendar,
        dateOfBirth: { day: 15, month: 6, year: Number(year) },
      });
    },
  );

  it("rejects a Hijri year outside 1300–1450", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderAuth(
      <IndividualDetailsForm
        phone={{ countryCode: "+966", nationalNumber: "512345678" }}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("National ID"), "1234567890");
    await enterDate(user, "15", "06", "1500");
    await user.click(
      screen.getByRole("button", { name: "Continue verification" }),
    );

    const year = screen.getByLabelText("Year");
    expect(year).toHaveAttribute("aria-invalid", "true");
    expect(year).toHaveAccessibleDescription(
      "Enter a Hijri year between 1300 and 1450",
    );
    expect(year).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an impossible Gregorian date", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderAuth(
      <IndividualDetailsForm
        phone={{ countryCode: "+973", nationalNumber: "12345678" }}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("National ID"), "2234567890");
    await enterDate(user, "31", "02", "1995");
    await user.click(
      screen.getByRole("button", { name: "Continue verification" }),
    );

    const day = screen.getByLabelText("Day");
    expect(day).toHaveAttribute("aria-invalid", "true");
    expect(day).toHaveAccessibleDescription("Enter a real Gregorian date");
    expect(day).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a submit failure as a form alert without marking valid fields invalid", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      status: "error",
      kind: "server",
      message: "Server unavailable",
      retryEligible: true,
    });
    const user = userEvent.setup();
    renderAuth(
      <IndividualDetailsForm
        phone={{ countryCode: "+973", nationalNumber: "12345678" }}
        onSubmit={onSubmit}
      />,
    );
    await user.type(screen.getByLabelText("National ID"), "2234567890");
    await enterDate(user, "15", "06", "1995");
    await user.click(
      screen.getByRole("button", { name: "Continue verification" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save your details",
    );
    for (const label of ["National ID", "Day", "Month", "Year"]) {
      const field = screen.getByLabelText(label);
      expect(field).not.toHaveAttribute("aria-invalid");
      expect(field).not.toHaveAttribute("aria-describedby");
    }
  });

  it("associates individual errors and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    const { container } = renderAuth(
      <IndividualDetailsForm
        phone={{ countryCode: "+966", nationalNumber: "512345678" }}
      />,
    );
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    await user.click(
      screen.getByRole("button", { name: "Continue verification" }),
    );

    const id = screen.getByLabelText("National ID");
    expect(id).toHaveAttribute("aria-invalid", "true");
    expect(id).toHaveAccessibleDescription(
      "National ID must be 10 digits starting with 1 or 2",
    );
    expect(id).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("associates company errors and focuses the company name", async () => {
    const user = userEvent.setup();
    const { container } = renderAuth(
      <CompanyDetailsForm
        phone={{ countryCode: "+966", nationalNumber: "512345678" }}
      />,
    );
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Submit company" }));

    const name = screen.getByLabelText("Company name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Enter your company name");
    expect(name).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("associates phone errors and focuses the phone number", async () => {
    const user = userEvent.setup();
    const { container } = renderAuth(<PhoneAndOtpForm mode="phone" />);
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Send code" }));

    const phone = screen.getByLabelText("Phone number");
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription(
      "Enter a 9-digit Saudi mobile number starting with 5",
    );
    expect(phone).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("associates OTP errors with each digit and focuses the first", async () => {
    const user = userEvent.setup();
    const { container } = renderAuth(<PhoneAndOtpForm mode="otp" />);
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Verify code" }));

    for (let index = 1; index <= 6; index++) {
      const digit = screen.getByLabelText(`Verification digit ${index}`);
      expect(digit).toHaveAttribute("aria-invalid", "true");
      expect(digit).toHaveAccessibleDescription("Enter the six-digit code");
    }
    expect(screen.getByLabelText("Verification digit 1")).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the phone form and country rules in Arabic", async () => {
    const requestOtp = vi.fn();
    const user = userEvent.setup();
    renderAuth(<PhoneAndOtpForm mode="phone" requestOtp={requestOtp} />, "ar");
    await user.selectOptions(screen.getByLabelText("الدولة"), "+973");
    await user.type(screen.getByLabelText("رقم الجوال"), "123456789");
    await user.click(screen.getByRole("button", { name: "إرسال الرمز" }));

    expect(
      screen.getByRole("option", { name: "البحرين (+973)" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("رقم الجوال")).toHaveAccessibleDescription(
      "أدخل رقم هاتف بحرينيًا من 8 أرقام",
    );
    expect(requestOtp).not.toHaveBeenCalled();
  });

  it("renders the OTP countdown in Arabic while keeping code entry left to right", () => {
    renderAuth(<PhoneAndOtpForm mode="otp" resendOtp={vi.fn()} />, "ar");
    expect(screen.getByText("رمز التحقق")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /إعادة إرسال الرمز خلال/ }),
    ).toHaveTextContent("1:00");
    expect(
      screen.getByLabelText("الرقم 1 من رمز التحقق").closest('[dir="ltr"]'),
    ).toBeInTheDocument();
  });

  it("renders individual date errors in Arabic", async () => {
    const user = userEvent.setup();
    renderAuth(
      <IndividualDetailsForm
        phone={{ countryCode: "+966", nationalNumber: "512345678" }}
      />,
      "ar",
    );
    await user.type(screen.getByLabelText("رقم الهوية الوطنية"), "1234567890");
    expect(
      screen.getByRole("group", { name: "تاريخ الميلاد (هجري)" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "متابعة التحقق" }));

    expect(screen.getByLabelText("اليوم")).toHaveAccessibleDescription(
      "أدخل يومًا هجريًا بين 1 و30",
    );
  });

  it("renders company review in Arabic from the API state", async () => {
    addMswHandlers(...authScenarioHandlers("auth/company-review/under-review"));
    renderAuth(<ReviewPage />, "ar");
    expect(
      (await screen.findByText("قيد المراجعة")).closest("li"),
    ).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("status")).toHaveTextContent(
      "البيع غير متاح حتى تفعيل شركتك",
    );
  });

  it("renders account-type, provider, and identity-return actions in Arabic", async () => {
    const accountType = renderAuth(<AccountTypePage />, "ar");
    expect(
      screen.getByRole("heading", { name: "اختر نوع الحساب" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "فرد" })).toBeInTheDocument();
    accountType.unmount();

    const provider = renderAuth(<VerifyPage />, "ar");
    expect(
      screen.getByRole("heading", { name: "موفر الهوية الوطنية التجريبي" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "موافقة" })).toBeInTheDocument();
    provider.unmount();

    renderAuth(<YakeenReturn status="failure" complete={vi.fn()} />, "ar");
    expect(screen.getByRole("alert")).toHaveTextContent("فشل التحقق من الهوية");
    expect(
      screen.getByRole("button", { name: "إعادة محاولة التحقق" }),
    ).toBeInTheDocument();
  });
});

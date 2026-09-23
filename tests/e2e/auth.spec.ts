import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import { translate } from "../../src/lib/i18n";
import type { Locale } from "../../src/lib/api/types";

interface SuccessSnapshot {
  url: string;
  dir: string;
  scrollWidth: number;
  clientWidth: number;
  formX: number;
  brandX: number;
  brandVisible: boolean;
  mswReady: boolean;
}

function projectLocale(testInfo: TestInfo): Locale {
  return testInfo.project.name.endsWith("-ar") ? "ar" : "en";
}

async function assertPage(page: Page, locale: Locale) {
  await expect(page.locator('html[data-msw-ready="true"]')).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "dir",
    locale === "ar" ? "rtl" : "ltr",
  );
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, "page has horizontal overflow").toBeLessThanOrEqual(
    clientWidth,
  );

  if (new URL(page.url()).pathname.startsWith("/auth/")) {
    const form = page.getByTestId("auth-form-column");
    const brand = page.getByTestId("auth-brand-panel");
    const width = page.viewportSize()?.width ?? 0;
    await expect(form).toBeVisible();
    if (width < 1024) {
      await expect(brand).toBeHidden();
    } else {
      await expect(brand).toBeVisible();
      const formBox = await form.boundingBox();
      const brandBox = await brand.boundingBox();
      expect(formBox).not.toBeNull();
      expect(brandBox).not.toBeNull();
      if (formBox && brandBox) {
        if (locale === "en") expect(brandBox.x).toBeGreaterThan(formBox.x);
        else expect(brandBox.x).toBeLessThan(formBox.x);
      }
    }
  }
}

async function startPhone(page: Page, locale: Locale) {
  await page.goto("/auth/phone");
  await assertPage(page, locale);
}

async function submitPhone(
  page: Page,
  locale: Locale,
  countryCode: "+966" | "+973",
) {
  await startPhone(page, locale);
  await page
    .getByLabel(translate(locale, "auth.phoneForm.country"))
    .selectOption(countryCode);
  await page
    .getByLabel(translate(locale, "auth.phoneForm.phoneNumber"))
    .fill(countryCode === "+966" ? "555123456" : "12345678");
  await page
    .getByRole("button", { name: translate(locale, "auth.phoneForm.sendCode") })
    .click();
  await expect(page).toHaveURL(/\/auth\/otp$/);
  await assertPage(page, locale);
}

async function verifyCode(page: Page, locale: Locale) {
  await page.locator('input[autocomplete="one-time-code"]').fill("123456");
  await expect(page.locator("fieldset input")).toHaveCount(6);
  for (const [index, digit] of [..."123456"].entries()) {
    await expect(page.locator("fieldset input").nth(index)).toHaveValue(digit);
  }
  await page
    .getByRole("button", { name: translate(locale, "auth.otp.verifyCode") })
    .click();
  await expect(page).toHaveURL(/\/auth\/account-type$/);
  await assertPage(page, locale);
}

async function chooseAccount(
  page: Page,
  locale: Locale,
  type: "individual" | "company",
) {
  await page
    .getByRole("button", {
      name: translate(locale, `auth.accountType.${type}`),
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`/auth/details\\?type=${type}$`));
  await assertPage(page, locale);
}

async function fillIndividual(
  page: Page,
  locale: Locale,
  nationality: "saudi" | "nonSaudi",
) {
  if (nationality === "nonSaudi") {
    const nonSaudi = translate(locale, "auth.details.nonSaudi");
    await page.getByText(nonSaudi, { exact: true }).click();
    await expect(page.getByRole("radio", { name: nonSaudi })).toBeChecked();
  }
  await page
    .getByLabel(translate(locale, "auth.details.nationalId"))
    .fill(nationality === "saudi" ? "1234567890" : "2234567890");
  await expect(
    page.getByRole("group", {
      name: translate(locale, "auth.details.birthDate", {
        calendar: translate(
          locale,
          nationality === "saudi" ? "calendar.hijri" : "calendar.gregorian",
        ),
      }),
    }),
  ).toBeVisible();
  await page.getByLabel(translate(locale, "auth.details.day")).fill("15");
  await page.getByLabel(translate(locale, "auth.details.month")).fill("06");
  await page
    .getByLabel(translate(locale, "auth.details.year"))
    .fill(nationality === "saudi" ? "1415" : "1995");
  await page
    .getByRole("button", { name: translate(locale, "auth.details.continue") })
    .click();
}

async function reachVerify(page: Page, locale: Locale) {
  await submitPhone(page, locale, "+966");
  await verifyCode(page, locale);
  await chooseAccount(page, locale, "individual");
  await fillIndividual(page, locale, "saudi");
  await expect(page).toHaveURL(/\/auth\/verify$/);
  await assertPage(page, locale);
  await expect(
    page.getByRole("heading", { name: translate(locale, "auth.verify.title") }),
  ).toBeVisible();
}

test("invalid Saudi phone reports a field error and blocks submission", async ({
  page,
}, testInfo) => {
  const locale = projectLocale(testInfo);
  await startPhone(page, locale);
  const phone = page.getByLabel(
    translate(locale, "auth.phoneForm.phoneNumber"),
  );
  await phone.fill("123456789");
  await page
    .getByRole("button", { name: translate(locale, "auth.phoneForm.sendCode") })
    .click();
  const expected = translate(locale, "auth.phoneForm.invalidSaudi", {
    digits: "9",
    prefix: "5",
  });
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toHaveAccessibleDescription(expected);
  await expect(page).toHaveURL(/\/auth\/phone$/);
  await assertPage(page, locale);
});

test("Saudi individual can approve verification", async ({
  page,
}, testInfo) => {
  const locale = projectLocale(testInfo);
  await reachVerify(page, locale);
  await page.evaluate(
    (successText) => {
      const observedWindow = window as Window & {
        authSuccessSnapshot?: SuccessSnapshot;
      };
      const capture = () => {
        if (!document.body.textContent?.includes(successText)) return;
        const form = document.querySelector('[data-testid="auth-form-column"]');
        const brand = document.querySelector(
          '[data-testid="auth-brand-panel"]',
        );
        observedWindow.authSuccessSnapshot = {
          url: window.location.pathname + window.location.search,
          dir: document.documentElement.dir,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          formX: form?.getBoundingClientRect().x ?? 0,
          brandX: brand?.getBoundingClientRect().x ?? 0,
          brandVisible: brand
            ? getComputedStyle(brand).display !== "none"
            : false,
          mswReady: document.documentElement.dataset.mswReady === "true",
        };
        observer.disconnect();
      };
      const observer = new MutationObserver(capture);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      capture();
    },
    translate(locale, "auth.identity.success"),
  );
  await page
    .getByRole("button", { name: translate(locale, "auth.verify.approve") })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await assertPage(page, locale);
  const snapshot = await page.evaluate(
    () =>
      (window as Window & { authSuccessSnapshot?: SuccessSnapshot })
        .authSuccessSnapshot,
  );
  if (!snapshot) throw new Error("Success review state was not rendered");
  expect(snapshot).toMatchObject({
    url: "/auth/review?status=success",
    dir: locale === "ar" ? "rtl" : "ltr",
    mswReady: true,
  });
  expect(snapshot.scrollWidth).toBeLessThanOrEqual(snapshot.clientWidth);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    expect(snapshot.brandVisible).toBe(true);
    if (locale === "en")
      expect(snapshot.brandX).toBeGreaterThan(snapshot.formX);
    else expect(snapshot.brandX).toBeLessThan(snapshot.formX);
  } else {
    expect(snapshot.brandVisible).toBe(false);
  }
});

test("Saudi individual can decline, retry, and cancel verification", async ({
  page,
}, testInfo) => {
  const locale = projectLocale(testInfo);
  await reachVerify(page, locale);
  await page
    .getByRole("button", { name: translate(locale, "auth.verify.decline") })
    .click();
  await expect(page).toHaveURL(/\/auth\/review\?status=failure$/);
  await assertPage(page, locale);
  await expect(
    page.getByText(translate(locale, "auth.identity.failure")),
  ).toBeVisible();
  await page
    .getByRole("button", { name: translate(locale, "auth.identity.retry") })
    .click();
  await expect(page).toHaveURL(/\/auth\/verify$/);
  await assertPage(page, locale);
  await page
    .getByRole("button", { name: translate(locale, "auth.verify.cancel") })
    .click();
  await expect(page).toHaveURL(/\/auth\/review\?status=abandoned$/);
  await assertPage(page, locale);
  await expect(
    page.getByText(translate(locale, "auth.identity.abandoned")),
  ).toBeVisible();
});

test("non-Saudi individual completes without identity provider", async ({
  page,
}, testInfo) => {
  const locale = projectLocale(testInfo);
  await submitPhone(page, locale, "+973");
  await verifyCode(page, locale);
  await chooseAccount(page, locale, "individual");
  await fillIndividual(page, locale, "nonSaudi");
  await expect(page).toHaveURL(/\/$/);
  await assertPage(page, locale);
  await expect(
    page.getByRole("heading", { name: translate(locale, "auth.verify.title") }),
  ).toHaveCount(0);
});

test("company submission reaches API-backed submitted review", async ({
  page,
}, testInfo) => {
  const locale = projectLocale(testInfo);
  await submitPhone(page, locale, "+973");
  await verifyCode(page, locale);
  await chooseAccount(page, locale, "company");
  await page
    .getByLabel(translate(locale, "auth.company.name"))
    .fill("Auction House");
  await page
    .getByRole("button", { name: translate(locale, "auth.company.submit") })
    .click();
  await expect(page).toHaveURL(/\/auth\/review\?company=submitted$/);
  await assertPage(page, locale);
  const steps = page.locator("ol > li");
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toHaveText(
    translate(locale, "auth.review.step.submitted"),
  );
  await expect(steps.nth(1)).toHaveText(
    translate(locale, "auth.review.step.underReview"),
  );
  await expect(steps.nth(2)).toHaveText(
    translate(locale, "auth.review.step.activated"),
  );
  await expect(steps.nth(0)).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("status")).toHaveText(
    translate(locale, "auth.review.unavailable"),
  );
});

test("favorite login intent returns to its auction listing", async ({
  page,
}, testInfo) => {
  const locale = projectLocale(testInfo);
  await page.goto("/auctions");
  await assertPage(page, locale);
  await page
    .getByRole("button", { name: translate(locale, "common.favorite") })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await assertPage(page, locale);
  await page
    .getByRole("button", {
      name: translate(locale, "auth.loginRequired.continue"),
    })
    .click();
  await expect(page).toHaveURL(/\/auth\/phone$/);
  await assertPage(page, locale);
  await page
    .getByLabel(translate(locale, "auth.phoneForm.country"))
    .selectOption("+973");
  await page
    .getByLabel(translate(locale, "auth.phoneForm.phoneNumber"))
    .fill("12345678");
  await page
    .getByRole("button", { name: translate(locale, "auth.phoneForm.sendCode") })
    .click();
  await expect(page).toHaveURL(/\/auth\/otp$/);
  await assertPage(page, locale);
  await verifyCode(page, locale);
  await chooseAccount(page, locale, "individual");
  await fillIndividual(page, locale, "nonSaudi");
  await expect(page).toHaveURL(/\/auctions$/);
  await assertPage(page, locale);
  await expect(
    page
      .getByRole("button", { name: translate(locale, "common.favorite") })
      .first(),
  ).toBeVisible();
});

test("OTP resend becomes available after sixty seconds", async ({
  page,
}, testInfo) => {
  const locale = projectLocale(testInfo);
  await page.clock.install();
  await submitPhone(page, locale, "+966");
  const resend = page.getByRole("button", {
    name: translate(locale, "auth.otp.resend"),
  });
  await expect(resend).toBeDisabled();
  await page.clock.runFor(60_000);
  await expect(resend).toBeEnabled();
  await resend.click();
  await expect(resend).toBeDisabled();
  await assertPage(page, locale);
});

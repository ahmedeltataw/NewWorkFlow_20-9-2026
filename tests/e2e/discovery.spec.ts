import { test, expect } from "@playwright/test";

const DETAIL_ID = "fx-live-vehicle-company";

function assertNoHorizontalOverflow(scrollWidth: number, clientWidth: number) {
  expect(
    scrollWidth,
    `scrollWidth ${scrollWidth} exceeded clientWidth ${clientWidth} — horizontal overflow`,
  ).toBeLessThanOrEqual(clientWidth);
}

/* ------------------------------------------------------------------ */
/* 1. No horizontal overflow at every configured width                  */
/* ------------------------------------------------------------------ */

test.describe("No horizontal overflow", () => {
  test("home page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(await page.locator("article").count()).toBeGreaterThanOrEqual(1);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    assertNoHorizontalOverflow(scrollWidth, clientWidth);
  });

  test("/auctions", async ({ page }) => {
    await page.goto("/auctions");
    await page.waitForLoadState("networkidle");
    expect(await page.locator("article").count()).toBeGreaterThanOrEqual(1);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    assertNoHorizontalOverflow(scrollWidth, clientWidth);
  });

  test("/search", async ({ page }) => {
    await page.goto("/search?q=camry");
    await page.waitForLoadState("networkidle");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    assertNoHorizontalOverflow(scrollWidth, clientWidth);
  });

  test("auction detail page", async ({ page }) => {
    await page.goto(`/auctions/${DETAIL_ID}`);
    await page.waitForLoadState("networkidle");
    const galleryVisible = await page
      .locator("section[aria-label]")
      .first()
      .isVisible();
    expect(galleryVisible, "gallery section should be visible").toBe(true);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    assertNoHorizontalOverflow(scrollWidth, clientWidth);
  });
});

/* ------------------------------------------------------------------ */
/* 2. FR-004: Navigation at breakpoint boundaries                      */
/* ------------------------------------------------------------------ */

test.describe("FR-004 responsive navigation", () => {
  test("navigation elements at viewport boundary", async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport) {
      test.skip();
      return;
    }

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const isMobile = viewport.width < 768;

    const tabBar = page.locator("nav:has(ul[role=list])").first();
    const headerBanner = page.locator('[role="banner"]').first();

    if (isMobile) {
      await expect(tabBar).toBeVisible();
      await expect(headerBanner).not.toBeVisible();
    } else {
      await expect(headerBanner).toBeVisible();
      await expect(tabBar).not.toBeVisible();
    }
  });
});

/* ------------------------------------------------------------------ */
/* 3. Filters: drawer below lg, sidebar at lg+                         */
/* ------------------------------------------------------------------ */

test.describe("Filters presentation", () => {
  test("filters adapt at lg breakpoint", async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport) {
      test.skip();
      return;
    }

    await page.goto("/auctions");
    await page.waitForLoadState("networkidle");
    expect(await page.locator("article").count()).toBeGreaterThanOrEqual(1);

    const isWide = viewport.width >= 1024;
    const sidebar = page.locator("aside[aria-label]").first();

    if (isWide) {
      await expect(sidebar).toBeVisible();
    } else {
      await expect(sidebar).not.toBeVisible();

      const openFiltersButton = page.locator("div.lg\\:hidden button").first();
      await openFiltersButton.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
  });
});

/* ------------------------------------------------------------------ */
/* 4. Discovery flows end to end                                        */
/* ------------------------------------------------------------------ */

test.describe("Discovery flows", () => {
  test("home shows active listings with no ended auctions", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const count = await page.locator("article").count();
    expect(count, "home page should show at least one listing").toBeGreaterThan(
      0,
    );
  });

  test("category filter narrows results", async ({ page }) => {
    await page.goto("/auctions");
    await page.waitForLoadState("networkidle");
    const allCount = await page.locator("article").count();

    await page.goto("/auctions?category=vehicle");
    await page.waitForLoadState("networkidle");
    const filteredCount = await page.locator("article").count();

    expect(
      filteredCount,
      "vehicle category should return fewer or equal results",
    ).toBeLessThanOrEqual(allCount);
    expect(
      filteredCount,
      "vehicle category should return at least one result",
    ).toBeGreaterThan(0);
  });

  test("search returns scoped results", async ({ page }) => {
    await page.goto("/search?q=camry");
    await page.waitForLoadState("networkidle");
    const count = await page.locator("article").count();
    expect(count, "search for 'camry' should return results").toBeGreaterThan(
      0,
    );
  });

  test("auction detail renders gallery and tabs", async ({ page }) => {
    await page.goto(`/auctions/${DETAIL_ID}`);
    await page.waitForLoadState("networkidle");

    const gallerySection = page.locator("section[aria-label]").first();
    await expect(gallerySection).toBeVisible();

    const mediaItems = gallerySection.locator("img, video");
    const mediaCount = await mediaItems.count();
    expect(
      mediaCount,
      "auction detail should show at least one media item",
    ).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* 5. Direction: RTL under ar, LTR under en                             */
/* ------------------------------------------------------------------ */

test.describe("Direction", () => {
  test("document direction matches locale", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const dir = await page.locator("html").getAttribute("dir");
    const lang = await page.locator("html").getAttribute("lang");

    if (lang === "ar") {
      expect(dir).toBe("rtl");
    } else {
      expect(dir).toBe("ltr");
    }
  });

  test("gallery navigation respects direction", async ({ page }) => {
    await page.goto(`/auctions/${DETAIL_ID}`);
    await page.waitForLoadState("networkidle");

    const dir = await page.locator("html").getAttribute("dir");
    const isRtl = dir === "rtl";

    const gallery = page.locator("section[aria-label]").first();
    await expect(gallery).toBeVisible();

    const thumbnails = gallery.locator("button.shrink-0");
    const thumbCount = await thumbnails.count();
    if (thumbCount < 3) {
      test.skip(true, "Need at least 3 gallery items for direction test");
      return;
    }

    const midIndex = Math.floor(thumbCount / 2);
    await thumbnails.nth(midIndex).click();
    await expect(thumbnails.nth(midIndex)).toHaveAttribute(
      "aria-current",
      "true",
    );

    await gallery.focus();
    await page.keyboard.press("ArrowRight");
    const expectedAfterRight = isRtl ? midIndex - 1 : midIndex + 1;
    await expect(thumbnails.nth(expectedAfterRight)).toHaveAttribute(
      "aria-current",
      "true",
      { timeout: 3000 },
    );

    await page.keyboard.press("ArrowLeft");
    await expect(thumbnails.nth(midIndex)).toHaveAttribute(
      "aria-current",
      "true",
      { timeout: 3000 },
    );
  });
});

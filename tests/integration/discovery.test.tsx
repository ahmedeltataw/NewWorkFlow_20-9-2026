/**
 * T036 RTL/LTR component and integration tests for discovery, filters,
 * search inference, gallery, guest gating, and direction.
 *
 * Every test exercises real production code. Removing or breaking the
 * behaviour under test MUST cause the corresponding test to fail.
 *
 * IMPORTANT: MSW in this vitest+jsdom setup intercepts requests to
 * http://localhost:3000 (matching the jsdom URL), NOT http://localhost (port 80).
 * All fetch calls MUST use the :3000 port.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addMswHandlers } from "../msw";
import { discoveryScenarioHandlers } from "../../src/mocks/handlers/discovery";
import { LocaleProvider, useI18n } from "../../src/lib/i18n/locale-provider";
import { ListingGrid } from "../../src/components/domain/ListingGrid";
import { MarketplaceFilters } from "../../src/features/marketplace/Filters";
import { MediaGallery } from "../../src/components/domain/MediaGallery";
import { hasRequiredAuctionMedia } from "../../src/lib/media";
import { LoginRequired } from "../../src/features/auth/LoginRequired";
import { useLoginIntentRestoration } from "../../src/features/auth/PhoneSignInEntry";
import {
  captureLoginIntent,
  restoreLoginIntent,
} from "../../src/lib/i18n/intent";
import { marketplaceConfig } from "../../src/config/marketplace";
import { translate } from "../../src/lib/i18n";
import { excludeEndedAuctions } from "../../src/lib/home-filter";
import {
  createLiveAuction,
  createEndedAuction,
  createCompanySeller,
  createIndividualSeller,
  createMediaGallery,
  createMediaAsset,
  moneyFromMajor,
} from "../../src/mocks/factories";
import type { Auction, Locale } from "../../src/lib/api/types";
import { inferCategory } from "../../src/config/marketplace";
import { ApiClient } from "../../src/lib/api/api-client";
import { http, HttpResponse } from "msw";

const BASE = "http://localhost:3000";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function activate(
  ...scenarioNames: Array<Parameters<typeof discoveryScenarioHandlers>[0]>
) {
  for (const name of scenarioNames) {
    addMswHandlers(...discoveryScenarioHandlers(name));
  }
}

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
});

function renderWithLocale(locale: Locale, ui: React.ReactElement) {
  return render(<LocaleProvider locale={locale}>{ui}</LocaleProvider>);
}

/* ------------------------------------------------------------------ */
/* 1. Discovery                                                         */
/* ------------------------------------------------------------------ */

describe("1. Discovery", () => {
  it("home feed excludes ended auctions (FR-019)", async () => {
    const activeLive = createLiveAuction({
      id: "home-active-live",
      title: "Active Live Auction",
    });
    const activeUpcoming = createLiveAuction({
      id: "home-active-upcoming",
      title: "Active Upcoming Auction",
    });
    const ended = createEndedAuction({
      id: "home-ended-1",
      title: "Ended Auction Must Not Appear",
    });

    addMswHandlers(
      http.get(`${BASE}/api/home-feed`, () => {
        return HttpResponse.json({
          status: "success",
          data: [activeLive, activeUpcoming, ended],
        });
      }),
    );

    // 1. Fetch the raw feed — it contains ended auctions.
    const client = new ApiClient();
    const result = await client.getHomeFeed();
    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.data).toHaveLength(3);
    expect(result.data.map((a: Auction) => a.id)).toContain("home-ended-1");

    // 2. Apply the production filter (same call page.tsx makes).
    const filtered = excludeEndedAuctions(result.data);

    // 3. Render only the filtered output — ended auction must NOT appear.
    renderWithLocale(
      "ar",
      <ListingGrid
        auctions={filtered}
        locale="ar"
        ariaLabel="home listings"
        emptyTitleKey="home.empty.title"
      />,
    );

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2);

    expect(screen.getByText("Active Live Auction")).toBeInTheDocument();
    expect(screen.getByText("Active Upcoming Auction")).toBeInTheDocument();
    expect(
      screen.queryByText("Ended Auction Must Not Appear"),
    ).not.toBeInTheDocument();
  });

  it.each<[Locale, string, string]>([
    ["ar", "حالي", "تويوتا كامري 2024"],
    ["en", "Live", "Toyota Camry 2024"],
  ])(
    "listing cards render title, status, seller, and formatted price in %s locale",
    async (locale, expectedStatusLabel, expectedTitle) => {
      const liveAuction = createLiveAuction({
        id: "test-discovery-live",
        title: expectedTitle,
        seller: createCompanySeller({
          name: "شركة المزادات الدولية",
        }),
        currentPrice: moneyFromMajor(62000),
      });

      renderWithLocale(
        locale,
        <ListingGrid
          auctions={[liveAuction]}
          locale={locale}
          ariaLabel="test listings"
          emptyTitleKey="home.empty.title"
        />,
      );

      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
      expect(screen.getByText(expectedStatusLabel)).toBeInTheDocument();
      expect(screen.getByText("شركة المزادات الدولية")).toBeInTheDocument();
      expect(screen.getByText(/62/)).toBeInTheDocument();
    },
  );

  it("listing card renders individual seller as private owner", async () => {
    const auction = createLiveAuction({
      id: "test-individual-seller",
      seller: createIndividualSeller(),
    });

    renderWithLocale(
      "en",
      <ListingGrid
        auctions={[auction]}
        locale="en"
        ariaLabel="test listings"
        emptyTitleKey="home.empty.title"
      />,
    );

    expect(screen.getByText("Private owner")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* 2. Filters                                                           */
/* ------------------------------------------------------------------ */

describe("2. Filters", () => {
  const filterLabels = {
    title: "الفلاتر",
    open: "فتح الفلاتر",
    apply: "تطبيق الفلاتر",
  };

  it("renders the configured filter groups with all select controls", () => {
    renderWithLocale(
      "ar",
      <MarketplaceFilters
        groups={marketplaceConfig.filters.groups}
        advancedFilters={[]}
        values={{}}
        locale="ar"
        action="/auctions"
        labels={filterLabels}
      />,
    );

    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(3);

    const categoryLabel = translate("ar", "filters.category");
    const sellerTypeLabel = translate("ar", "filters.sellerType");
    const statusLabel = translate("ar", "filters.auctionStatus");
    expect(screen.getByLabelText(categoryLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(sellerTypeLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(statusLabel)).toBeInTheDocument();
  });

  it("reveals company name filter when seller type is company", async () => {
    const user = userEvent.setup();

    renderWithLocale(
      "en",
      <MarketplaceFilters
        groups={marketplaceConfig.filters.groups}
        advancedFilters={[]}
        values={{}}
        locale="en"
        action="/auctions"
        labels={{
          title: "Filters",
          open: "Open filters",
          apply: "Apply filters",
        }}
      />,
    );

    const sellerTypeLabel = translate("en", "filters.sellerType");
    const sellerTypeSelect = screen.getByLabelText(sellerTypeLabel);

    expect(
      screen.queryByLabelText(translate("en", "filters.companyName")),
    ).not.toBeInTheDocument();

    await user.selectOptions(sellerTypeSelect, "company");

    expect(
      screen.getByLabelText(translate("en", "filters.companyName")),
    ).toBeInTheDocument();
  });

  it("hides company name filter when seller type is cleared", async () => {
    const user = userEvent.setup();

    renderWithLocale(
      "en",
      <MarketplaceFilters
        groups={marketplaceConfig.filters.groups}
        advancedFilters={[]}
        values={{ sellerType: "company" }}
        locale="en"
        action="/auctions"
        labels={{
          title: "Filters",
          open: "Open filters",
          apply: "Apply filters",
        }}
      />,
    );

    expect(
      screen.getByLabelText(translate("en", "filters.companyName")),
    ).toBeInTheDocument();

    const sellerTypeLabel = translate("en", "filters.sellerType");
    const sellerTypeSelect = screen.getByLabelText(sellerTypeLabel);
    await user.selectOptions(sellerTypeSelect, "");

    expect(
      screen.queryByLabelText(translate("en", "filters.companyName")),
    ).not.toBeInTheDocument();
  });

  it("filter form action maps to /auctions URL", () => {
    const { container } = renderWithLocale(
      "en",
      <MarketplaceFilters
        groups={marketplaceConfig.filters.groups}
        advancedFilters={[]}
        values={{}}
        locale="en"
        action="/auctions"
        labels={{
          title: "Filters",
          open: "Open filters",
          apply: "Apply filters",
        }}
      />,
    );

    const forms = container.querySelectorAll("form");
    expect(forms.length).toBeGreaterThanOrEqual(1);
    for (const form of forms) {
      expect(form).toHaveAttribute("action", "/auctions");
    }
  });
});

/* ------------------------------------------------------------------ */
/* 3. Search inference                                                  */
/* ------------------------------------------------------------------ */

describe("3. Search inference", () => {
  it("category-named query infers vehicle and sends category=vehicle (FR-021)", async () => {
    // 1. The production inference function identifies the category.
    const query = "search for a toyota camry vehicle";
    const inferred = inferCategory(query);
    expect(inferred).toBe("vehicle");

    // 2. A handler that honours the category param and returns scoped data.
    const vehicleAuction = createLiveAuction({
      id: "search-vehicle-1",
      category: "vehicle",
      title: "Toyota Camry 2024",
    });
    const realEstateAuction = createLiveAuction({
      id: "search-realestate-1",
      category: "realEstate",
      title: "Luxury Villa",
    });

    let capturedUrl = "";
    addMswHandlers(
      http.get(`${BASE}/api/search`, ({ request }) => {
        capturedUrl = request.url;
        const url = new URL(request.url);
        const category = url.searchParams.get("category");
        const all: Auction[] = [vehicleAuction, realEstateAuction];
        const scoped = category
          ? all.filter((a) => a.category === category)
          : all;
        return HttpResponse.json({ status: "success", data: scoped });
      }),
    );

    // 3. The ApiClient sends the inferred category as a URL parameter.
    const client = new ApiClient();
    const result = await client.searchAuctions(query, inferred);
    expect(result.status).toBe("success");

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("category")).toBe("vehicle");

    // 4. Scoped results contain only vehicle auctions.
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.data).toHaveLength(1);
      const first = result.data[0];
      expect(first?.id).toBe("search-vehicle-1");
      expect(first?.category).toBe("vehicle");
    }
  });

  it("non-category query returns unscoped results (no category param)", async () => {
    // 1. The inference function returns undefined for non-category terms.
    const query = "random search term with no category keywords";
    const inferred = inferCategory(query);
    expect(inferred).toBeUndefined();

    // 2. A handler that returns mixed-category data.
    const vehicleAuction = createLiveAuction({
      id: "search-vehicle-2",
      category: "vehicle",
    });
    const realestateAuction = createLiveAuction({
      id: "search-realestate-2",
      category: "realEstate",
    });

    let capturedUrl = "";
    addMswHandlers(
      http.get(`${BASE}/api/search`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          status: "success",
          data: [vehicleAuction, realestateAuction],
        });
      }),
    );

    // 3. The ApiClient omits the category parameter.
    const client = new ApiClient();
    const result = await client.searchAuctions(query, inferred);
    expect(result.status).toBe("success");

    const url = new URL(capturedUrl);
    expect(url.searchParams.has("category")).toBe(false);

    // 4. Results are unscoped — multiple categories present.
    if (result.status === "success") {
      const categories = new Set(result.data.map((a) => a.category));
      expect(categories.size).toBeGreaterThan(1);
    }
  });

  it("search-no-results renders the empty state", async () => {
    activate("guest-discovery/search-no-results");

    const res = await fetch(`${BASE}/api/search?q=xyznonexistent`);
    const body = (await res.json()) as {
      status: string;
      data: readonly unknown[];
    };

    expect(body.status).toBe("success");
    expect(body.data).toEqual([]);

    renderWithLocale(
      "ar",
      <ListingGrid
        auctions={[]}
        locale="ar"
        ariaLabel="search results"
        emptyTitleKey="search.noResults.title"
      />,
    );

    expect(
      screen.getByText(translate("ar", "search.noResults.title")),
    ).toBeInTheDocument();
  });

  it("search-no-results renders English empty state in en locale", async () => {
    activate("guest-discovery/search-no-results");

    const res = await fetch(`${BASE}/api/search?q=xyznonexistent`);
    const body = (await res.json()) as {
      status: string;
      data: readonly unknown[];
    };

    expect(body.status).toBe("success");
    expect(body.data).toEqual([]);

    renderWithLocale(
      "en",
      <ListingGrid
        auctions={[]}
        locale="en"
        ariaLabel="search results"
        emptyTitleKey="search.noResults.title"
      />,
    );

    expect(
      screen.getByText(translate("en", "search.noResults.title")),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* 4. Gallery (FR-031)                                                  */
/* ------------------------------------------------------------------ */

describe("4. Gallery", () => {
  const validLabels = {
    gallery: "معرض الوسائط",
    previous: "الوسائط السابقة",
    next: "الوسائط التالية",
    videoDescription: "وصف الفيديو: {0}",
    invalid: "تعذر عرض هذا المزاد لأن الوسائط المطلوبة غير مكتملة.",
  };

  const validLabelsEn = {
    gallery: "Media gallery",
    previous: "Previous media",
    next: "Next media",
    videoDescription: "Video description: {0}",
    invalid:
      "This auction cannot be shown because its required media is incomplete.",
  };

  it("renders gallery in sortOrder sequence for complete media", () => {
    const media = createMediaGallery({
      locale: "ar",
      imageCount: 4,
      includeVideo: true,
    });

    expect(hasRequiredAuctionMedia(media)).toBe(true);

    render(<MediaGallery media={media} labels={validLabels} />);

    expect(
      screen.getByRole("region", { name: "معرض الوسائط" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "الوسائط السابقة" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "الوسائط التالية" }),
    ).toBeInTheDocument();

    const thumbnails = screen.getAllByRole("button", {
      name: /صورة لـ|فيديو تعريفي/,
    });
    expect(thumbnails.length).toBeGreaterThanOrEqual(5);

    expect(thumbnails[0]).toHaveAttribute("aria-current", "true");
  });

  it("renders gallery in English with correct labels", () => {
    const media = createMediaGallery({
      locale: "en",
      imageCount: 4,
      includeVideo: true,
    });

    render(<MediaGallery media={media} labels={validLabelsEn} />);

    expect(
      screen.getByRole("region", { name: "Media gallery" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous media" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next media" }),
    ).toBeInTheDocument();
  });

  it("renders error state for incomplete media (FR-031)", () => {
    const incompleteMedia = [
      createMediaAsset({ id: "m1", kind: "image", sortOrder: 1 }),
      createMediaAsset({ id: "m2", kind: "image", sortOrder: 2 }),
    ];

    expect(hasRequiredAuctionMedia(incompleteMedia)).toBe(false);

    render(<MediaGallery media={incompleteMedia} labels={validLabels} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "تعذر عرض هذا المزاد لأن الوسائط المطلوبة غير مكتملة.",
    );
    expect(
      screen.queryByRole("region", { name: "معرض الوسائط" }),
    ).not.toBeInTheDocument();
  });

  it("renders English error state for incomplete media", () => {
    const incompleteMedia = [
      createMediaAsset({ id: "m1", kind: "image", sortOrder: 1 }),
    ];

    render(<MediaGallery media={incompleteMedia} labels={validLabelsEn} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This auction cannot be shown because its required media is incomplete.",
    );
  });

  it("navigates forward and backward through gallery items", async () => {
    const user = userEvent.setup();
    const media = createMediaGallery({
      locale: "ar",
      imageCount: 4,
      includeVideo: true,
    });

    render(<MediaGallery media={media} labels={validLabels} />);

    const thumbnails = screen.getAllByRole("button", {
      name: /صورة لـ|فيديو تعريفي/,
    });
    expect(thumbnails[0]).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "الوسائط التالية" }));
    expect(thumbnails[1]).toHaveAttribute("aria-current", "true");
    expect(thumbnails[0]).not.toHaveAttribute("aria-current");

    await user.click(screen.getByRole("button", { name: "الوسائط السابقة" }));
    expect(thumbnails[0]).toHaveAttribute("aria-current", "true");
  });
});

/* ------------------------------------------------------------------ */
/* 5. Guest gating                                                      */
/* ------------------------------------------------------------------ */

describe("5. Guest gating", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      configurable: true,
    });
  });

  it("captures intent and restores exactly once", async () => {
    const user = userEvent.setup();
    renderWithLocale(
      "en",
      <LoginRequired
        open
        onOpenChange={vi.fn()}
        intent={{ intent: "favorite", returnTo: "/auctions?status=live" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(push).toHaveBeenCalledWith("/auth/phone");
    expect(restoreLoginIntent()).toEqual({
      intent: "favorite",
      returnTo: "/auctions?status=live",
    });
    expect(restoreLoginIntent()).toBeNull();
  });

  it("returns to preserved destination only for first completion", async () => {
    const user = userEvent.setup();
    captureLoginIntent({ intent: "favorite", returnTo: "/auctions/live-1" });

    function SignInCompletion() {
      const restoreAfterSignIn = useLoginIntentRestoration();
      return <button onClick={restoreAfterSignIn}>Complete sign-in</button>;
    }

    render(<SignInCompletion />);

    await user.click(screen.getByRole("button", { name: "Complete sign-in" }));
    await user.click(screen.getByRole("button", { name: "Complete sign-in" }));

    expect(replace).toHaveBeenNthCalledWith(1, "/auctions/live-1");
    expect(replace).toHaveBeenNthCalledWith(2, "/");
  });

  it("captures bid intent from LoginRequired", async () => {
    const user = userEvent.setup();
    renderWithLocale(
      "en",
      <LoginRequired
        open
        onOpenChange={vi.fn()}
        intent={{ intent: "bid", returnTo: "/auctions/live-1" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(restoreLoginIntent()).toEqual({
      intent: "bid",
      returnTo: "/auctions/live-1",
    });
  });
});

/* ------------------------------------------------------------------ */
/* 6. Direction                                                         */
/* ------------------------------------------------------------------ */

describe("6. Direction", () => {
  function DirectionProbe() {
    const { dir, isRtl } = useI18n();
    return <div data-testid="dir" data-dir={dir} data-is-rtl={String(isRtl)} />;
  }

  it("ar locale exposes rtl direction via context", () => {
    renderWithLocale("ar", <DirectionProbe />);

    const probe = screen.getByTestId("dir");
    expect(probe).toHaveAttribute("data-dir", "rtl");
    expect(probe).toHaveAttribute("data-is-rtl", "true");
  });

  it("en locale exposes ltr direction via context", () => {
    renderWithLocale("en", <DirectionProbe />);

    const probe = screen.getByTestId("dir");
    expect(probe).toHaveAttribute("data-dir", "ltr");
    expect(probe).toHaveAttribute("data-is-rtl", "false");
  });

  it("gallery keyboard navigation is direction-aware (rtl: ArrowRight=previous)", async () => {
    const user = userEvent.setup();
    const media = createMediaGallery({
      locale: "ar",
      imageCount: 4,
      includeVideo: true,
    });

    document.documentElement.dir = "rtl";

    render(
      <LocaleProvider locale="ar">
        <MediaGallery
          media={media}
          labels={{
            gallery: "معرض الوسائط",
            previous: "الوسائط السابقة",
            next: "الوسائط التالية",
            videoDescription: "وصف الفيديو: {0}",
            invalid: "خطأ",
          }}
        />
      </LocaleProvider>,
    );

    const gallery = screen.getByRole("region", { name: "معرض الوسائط" });
    const thumbnails = screen.getAllByRole("button", {
      name: /صورة لـ|فيديو تعريفي/,
    });

    expect(thumbnails[0]).toHaveAttribute("aria-current", "true");

    await user.click(thumbnails[0]!);
    fireEvent.keyDown(gallery, { key: "ArrowRight" });

    expect(thumbnails.at(-1)!).toHaveAttribute("aria-current", "true");
  });

  it("gallery keyboard navigation is direction-aware (ltr: ArrowRight=next)", async () => {
    const user = userEvent.setup();
    const media = createMediaGallery({
      locale: "en",
      imageCount: 4,
      includeVideo: true,
    });

    document.documentElement.dir = "ltr";

    render(
      <LocaleProvider locale="en">
        <MediaGallery
          media={media}
          labels={{
            gallery: "Media gallery",
            previous: "Previous media",
            next: "Next media",
            videoDescription: "Video description: {0}",
            invalid: "Error",
          }}
        />
      </LocaleProvider>,
    );

    const gallery = screen.getByRole("region", { name: "Media gallery" });
    const thumbnails = screen.getAllByRole("button", {
      name: /Photo of|Overview video/,
    });

    expect(thumbnails[0]).toHaveAttribute("aria-current", "true");

    await user.click(thumbnails[0]!);
    fireEvent.keyDown(gallery, { key: "ArrowRight" });

    expect(thumbnails[1]).toHaveAttribute("aria-current", "true");
    expect(thumbnails[0]).not.toHaveAttribute("aria-current");
  });

  it("gallery next button navigates forward in both directions", async () => {
    const user = userEvent.setup();
    const media = createMediaGallery({
      locale: "en",
      imageCount: 4,
      includeVideo: true,
    });

    render(
      <LocaleProvider locale="en">
        <MediaGallery
          media={media}
          labels={{
            gallery: "Media gallery",
            previous: "Previous media",
            next: "Next media",
            videoDescription: "Video description: {0}",
            invalid: "Error",
          }}
        />
      </LocaleProvider>,
    );

    const thumbnails = screen.getAllByRole("button", {
      name: /Photo of|Overview video/,
    });

    await user.click(screen.getByRole("button", { name: "Next media" }));
    expect(thumbnails[1]).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "Next media" }));
    expect(thumbnails[2]).toHaveAttribute("aria-current", "true");
  });
});

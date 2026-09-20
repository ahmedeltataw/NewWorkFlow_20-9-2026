import { describe, expect, it } from "vitest";

import { feeDefaults, paymentWindowHours } from "../../src/config/marketplace";
import {
  DEFAULT_LOCALE,
  createAuction,
  createAuctionCoverageMatrix,
  createBySaleWinOutcome,
  createDeposit,
  createIndividualAccount,
  createLiveAuction,
  createMediaGallery,
  createOutcome,
  createParticipant,
  createParticipantCoverageList,
  createSellerOptionApprovedOutcome,
  createSettlement,
  createUpcomingAuction,
  createWallet,
  createWalletCoverageList,
  fixtureValueLists,
  fixtureTimes,
  presets,
} from "../../src/mocks/factories";

describe("T020 fixture factories", () => {
  it("is deterministic across repeated calls", () => {
    expect(createLiveAuction()).toEqual(createLiveAuction());
    expect(createUpcomingAuction()).toEqual(createUpcomingAuction());
    expect(createParticipant()).toEqual(createParticipant());
    expect(createWallet()).toEqual(createWallet());
  });

  it("defaults to Arabic copy and switches to English per call", () => {
    const arabic = createUpcomingAuction({ category: "vehicle" });
    const english = createUpcomingAuction({
      category: "vehicle",
      locale: "en",
    });
    expect(DEFAULT_LOCALE).toBe("ar");
    expect(arabic.title).toBe("تويوتا لاند كروزر GXR 2021");
    expect(english.title).toBe("Toyota Land Cruiser GXR 2021");
    expect(arabic.location.label).toContain("الرياض");
    expect(english.location.label).toContain("Riyadh");
    expect(arabic.seller.kind).toBe("company");
    if (arabic.seller.kind === "company") {
      expect(arabic.seller.name).toContain("شركة");
    }
  });

  it("honours per-call overrides while keeping the remaining defaults", () => {
    const auction = createUpcomingAuction({ saleType: "sellerOption" });
    expect(auction.saleType).toBe("sellerOption");
    expect(auction.status).toBe("upcoming");
    expect(auction.category).toBe("vehicle");
    expect(auction.id).toBe("fx-vehicle-auction-1");
  });

  it("dispatches every status to the correct canonical variant", () => {
    expect(createAuction("upcoming").status).toBe("upcoming");
    expect(createAuction("live").status).toBe("live");
    expect(createAuction("ended").status).toBe("ended");
    const direct = createAuction("directSale");
    expect(direct.status).toBe("directSale");
    if (direct.status === "directSale") {
      expect(direct.transferStatus).toBe("pendingConfirmation");
      expect(direct.buyNowPrice.amountMinor).toBeGreaterThan(0);
    }
    expect(createAuction()).toEqual(createLiveAuction());
  });

  it("builds galleries with at least four images and one video", () => {
    const defaultGallery = createMediaGallery({});
    const vehicleGallery = createLiveAuction({ category: "vehicle" }).gallery;
    for (const gallery of [defaultGallery, vehicleGallery]) {
      const images = gallery.filter((media) => media.kind === "image");
      const videos = gallery.filter((media) => media.kind === "video");
      expect(images.length).toBeGreaterThanOrEqual(4);
      expect(videos.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("derives financial values from dashboard configuration", () => {
    const outcome = createBySaleWinOutcome();
    expect(outcome.saleType).toBe("bySale");
    expect(outcome.type).toBe("won");
    expect(outcome.deposit).toBe("credited");
    const expectedCommission = Math.round(
      (outcome.amountOwed.amountMinor * feeDefaults.commissionPercent) / 100,
    );
    expect(outcome.commission.amountMinor).toBe(expectedCommission);
    expect(outcome.commission.currency).toBe(outcome.amountOwed.currency);

    const approved = createSellerOptionApprovedOutcome();
    expect(approved.saleType).toBe("sellerOption");
    expect(approved.type).toBe("sellerApproved");
    const expectedVat = Math.round(
      (approved.commission.amountMinor * feeDefaults.vatPercent) / 100,
    );
    expect(approved.vat.amountMinor).toBe(expectedVat);
    expect(outcome.paymentDeadline).toBe(
      paymentWindowHoursToIso(outcome.endedAt),
    );
  });

  it("covers every outcome variant through the dispatcher", () => {
    const buyerDeclined = createOutcome({
      saleType: "sellerOption",
      type: "sellerRejected",
    });
    expect(buyerDeclined).toMatchObject({
      saleType: "sellerOption",
      type: "sellerRejected",
      deposit: "refunded",
    });
    const relist = createOutcome({ type: "unpaidRelistOffer" });
    expect(relist).toMatchObject({
      saleType: "bySale",
      type: "unpaidRelistOffer",
      perspective: "seller",
    });
    if (relist.type === "unpaidRelistOffer") {
      expect(relist.relist.editableBuyNowPrice.amountMinor).toBeGreaterThan(0);
      expect(relist.relist.validUntil > relist.endedAt).toBe(true);
    }
  });

  it("produces partial, pending, and fully-settled settlements", () => {
    const partial = createSettlement({ status: "inProgress" });
    expect(partial.status).toBe("inProgress");
    expect(partial.amountPaid.amountMinor).toBeGreaterThan(0);
    expect(partial.amountOutstanding.amountMinor).toBeGreaterThan(0);
    expect(
      partial.amountPaid.amountMinor + partial.amountOutstanding.amountMinor,
    ).toBe(66000 * 100);

    const full = createSettlement({ status: "fullySettled" });
    expect(full.status).toBe("fullySettled");
    expect(full.amountOutstanding.amountMinor).toBe(0);
    expect(full.amountPaid.amountMinor).toBeGreaterThan(0);

    const pending = createSettlement({ status: "pendingConfirmation" });
    expect(pending.status).toBe("pendingConfirmation");
    expect(pending.amountOutstanding.amountMinor).toBe(0);
    expect(pending.transfers).toHaveLength(1);
  });

  it("covers every auction status, category, sale type, and seller combination", () => {
    const matrix = createAuctionCoverageMatrix();
    expect(matrix).toHaveLength(42);
    const ids = new Set(matrix.map((auction) => auction.id));
    expect(ids.size).toBe(matrix.length);
    const statuses = new Set(matrix.map((auction) => auction.status));
    expect(statuses).toEqual(
      new Set(["upcoming", "live", "ended", "directSale"]),
    );
    const categories = new Set(matrix.map((auction) => auction.category));
    expect(categories).toEqual(
      new Set(["vehicle", "realEstate", "licensePlate"]),
    );
    const sellers = new Set(matrix.map((auction) => auction.seller.kind));
    expect(sellers).toEqual(new Set(["individual", "company"]));
    const sales = new Set(
      matrix
        .filter((auction) => auction.status !== "directSale")
        .map((auction) => ("saleType" in auction ? auction.saleType : "")),
    );
    expect(sales).toEqual(new Set(["bySale", "sellerOption"]));

    const rulingWithoutSaleType = matrix.filter(
      (auction) => auction.status === "directSale" && "saleType" in auction,
    );
    expect(rulingWithoutSaleType).toHaveLength(0);
  });

  it("covers deposit, withdrawal, auto-bid, leader, and outcome states", () => {
    const participants = createParticipantCoverageList();
    const depositStatuses = new Set(
      participants.map((participant) => participant.deposit.status),
    );
    expect(depositStatuses).toEqual(
      new Set(["required", "paid", "held", "refunded", "released"]),
    );
    const leaders = new Set(
      participants.map((participant) => participant.highestBidder),
    );
    expect(leaders).toEqual(new Set([true, false]));
    const withdrawals = new Set(
      participants.map((participant) => participant.withdrawal),
    );
    expect(withdrawals).toEqual(
      new Set(["available", "requested", "notEligible"]),
    );
    const autoBidStates = new Set(
      participants
        .map((participant) => participant.autoBid?.state)
        .filter(Boolean),
    );
    expect(autoBidStates).toEqual(
      new Set(["active", "maximumReached", "cancelled"]),
    );
    const outcomes = participants
      .map((participant) => participant.outcome)
      .filter((outcome) => outcome !== null);
    expect(outcomes.length).toBeGreaterThanOrEqual(4);
    for (const outcome of outcomes) {
      expect(outcome).not.toBeNull();
    }
  });

  it("covers account, verification, and company-review states", () => {
    const saudi = createIndividualAccount();
    expect(saudi.type).toBe("individual");
    expect(saudi.nationality).toBe("saudi");
    expect(saudi.nationalId).toMatch(/^1/);
    expect(saudi.dateCalendar).toBe("hijri");

    const saudiGregorian = createIndividualAccount({
      nationalId: "2012345678",
      dateCalendar: "gregorian",
    });
    expect(saudiGregorian.dateCalendar).toBe("gregorian");

    const pending = createIndividualAccount({
      verification: {
        route: "saudiNationalVerification",
        status: "pending",
      },
    });
    expect(pending.verification).toEqual({
      route: "saudiNationalVerification",
      status: "pending",
    });

    const nonSaudi = createIndividualAccount({ nationality: "nonSaudi" });
    expect(nonSaudi.verification).toEqual({
      route: "manual",
      status: "verified",
    });
    expect(nonSaudi.nationalId).toBeUndefined();
  });

  it("covers wallet, transaction, and withdrawal request combinations", () => {
    const wallets = createWalletCoverageList();
    expect(wallets.some((wallet) => wallet.transactions.length === 0)).toBe(
      true,
    );
    expect(
      wallets.some((wallet) => wallet.balanceVisibility === "masked"),
    ).toBe(true);
    expect(
      wallets.some(
        (wallet) =>
          wallet.withdrawals[0] !== undefined &&
          wallet.withdrawals[0].status === "pending",
      ),
    ).toBe(true);
    expect(
      wallets.some(
        (wallet) => wallet.withdrawals[0]?.destination.kind === "international",
      ),
    ).toBe(true);

    const own = createWallet();
    const deposit = own.transactions.find(
      (transaction) => transaction.type === "deposit",
    );
    expect(deposit).toBeDefined();
    expect(deposit?.status).toBe("completed");
  });

  it("keeps named preset fixtures reproducible", () => {
    expect(presets.liveVehicleBySaleCompany()).toEqual(
      presets.liveVehicleBySaleCompany(),
    );
    expect(presets.accountSaudiAwaitingVerification().verification).toEqual({
      route: "saudiNationalVerification",
      status: "pending",
    });
    expect(presets.walletEmpty().transactions).toEqual([]);
    expect(presets.participantLeading().withdrawal).toBe("notEligible");
  });

  it("exposes value lists matching the canonical unions", () => {
    expect(fixtureValueLists.auctionStatuses).toEqual([
      "upcoming",
      "live",
      "ended",
      "directSale",
    ]);
    expect(fixtureValueLists.saleTypes).toEqual(["bySale", "sellerOption"]);
    expect([...fixtureValueLists.auctionCategories].sort()).toEqual(
      ["vehicle", "realEstate", "licensePlate"].sort(),
    );
    expect(fixtureValueLists.auctionOutcomeTypes).toContain(
      "unpaidRelistOffer",
    );
    expect(fixtureValueLists.identityVerificationStatuses).toContain(
      "abandoned",
    );
  });

  it("never relies on the wall clock", () => {
    expect(fixtureTimes.now).toBe("2026-09-20T08:00:00.000Z");
    const auction = createUpcomingAuction();
    expect(auction.schedule).toEqual({
      phase: "scheduled",
      startsAt: fixtureTimes.upcomingStartsAt,
    });
    expect(offerDeadlineUsesFixtureAnchors()).toBe(true);
    expect(
      createDeposit({ status: "required" }).paymentReference,
    ).toBeUndefined();
  });
});

function paymentWindowHoursToIso(endedAt: string): string {
  const millis = paymentWindowHours * 60 * 60 * 1000;
  return new Date(new Date(endedAt).getTime() + millis).toISOString();
}

function offerDeadlineUsesFixtureAnchors(): boolean {
  const relist = createOutcome({ type: "unpaidRelistOffer" });
  return relist.type === "unpaidRelistOffer"
    ? new Date(relist.relist.validUntil) > new Date(fixtureTimes.now)
    : false;
}

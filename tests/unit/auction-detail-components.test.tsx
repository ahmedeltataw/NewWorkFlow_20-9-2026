import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DetailsTabs } from "../../src/components/domain/DetailsTabs";
import { MediaGallery } from "../../src/components/domain/MediaGallery";
import { hasRequiredAuctionMedia } from "../../src/lib/media";
import { createAuction, createMediaAsset } from "../../src/mocks/factories";

const galleryLabels = {
  gallery: "Media gallery",
  previous: "Previous media",
  next: "Next media",
  videoDescription: "Video description: {0}",
  invalid: "Required media is incomplete",
};

describe("MediaGallery", () => {
  it("requires four images and a video before auction media is valid", () => {
    const fourImages = Array.from({ length: 4 }, (_, index) =>
      createMediaAsset({ id: `image-${index}`, kind: "image" }),
    );

    expect(hasRequiredAuctionMedia(fourImages)).toBe(false);
    expect(
      hasRequiredAuctionMedia([
        ...fourImages,
        createMediaAsset({ id: "video", kind: "video" }),
      ]),
    ).toBe(true);
  });

  it("stops an incomplete auction gallery with a recoverable content error", () => {
    render(
      <MediaGallery
        media={[createMediaAsset({ kind: "image" })]}
        labels={galleryLabels}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(galleryLabels.invalid);
    expect(
      screen.queryByRole("button", { name: galleryLabels.next }),
    ).not.toBeInTheDocument();
  });

  it("orders media and navigates its one combined image and video sequence", async () => {
    const user = userEvent.setup();
    const media = [
      createMediaAsset({
        id: "video",
        kind: "video",
        sortOrder: 2,
        alt: "Walkthrough",
        accessibilityDescription: "Walkthrough description",
      }),
      createMediaAsset({
        id: "first-image",
        kind: "image",
        sortOrder: 1,
        alt: "First image",
        accessibilityDescription: "First image description",
      }),
      createMediaAsset({
        id: "second-image",
        kind: "image",
        sortOrder: 3,
        alt: "Second image",
        accessibilityDescription: "Second image description",
      }),
      createMediaAsset({
        id: "third-image",
        kind: "image",
        sortOrder: 4,
        alt: "Third image",
        accessibilityDescription: "Third image description",
      }),
      createMediaAsset({
        id: "fourth-image",
        kind: "image",
        sortOrder: 5,
        alt: "Fourth image",
        accessibilityDescription: "Fourth image description",
      }),
    ];
    render(<MediaGallery media={media} labels={galleryLabels} />);

    expect(
      screen.getByRole("img", { name: "First image" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: galleryLabels.next }));
    expect(
      screen.getByLabelText(
        "Walkthrough. Video description: Walkthrough description",
      ),
    ).toBeInTheDocument();
  });
});

describe("DetailsTabs", () => {
  it("provides roving tab keyboard navigation and only exposes inspection for vehicles", async () => {
    const user = userEvent.setup();
    const auction = createAuction("live", { category: "vehicle" });
    render(
      <DetailsTabs
        details={auction.details}
        labels={{
          specifications: "Specifications",
          features: "Features",
          inspection: "Inspection report",
        }}
      />,
    );

    const specifications = screen.getByRole("tab", { name: "Specifications" });
    expect(specifications).toHaveAttribute("aria-selected", "true");
    await user.click(specifications);
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Features" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("tab", { name: "Inspection report" }),
    ).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      auction.details.category === "vehicle"
        ? auction.details.inspection.summary
        : "",
    );
  });
});

import type { MediaGallery } from "./api/types";

/** FR-031 requires four images and one video before an auction can be presented. */
export function hasRequiredAuctionMedia(media: MediaGallery): boolean {
  return (
    media.filter((asset) => asset.kind === "image").length >= 4 &&
    media.some((asset) => asset.kind === "video")
  );
}

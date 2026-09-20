import type { AuctionStatus } from "../../lib/api/types";

export interface StatusBadgeProps {
  readonly status: AuctionStatus;
  readonly label: string;
}

const STATUS_ICON: Record<AuctionStatus, string> = {
  live: "\u25CF",
  upcoming: "\u25F7",
  ended: "\u2013",
  directSale: "\u26A1",
};

const STATUS_CLASSES: Record<AuctionStatus, string> = {
  live: "bg-success-50 text-status-success",
  upcoming: "bg-blue-50 text-blue-700",
  ended: "bg-neutral-100 text-text-sub-text",
  directSale: "bg-primary-50 text-action-primary",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-badge font-semibold ${STATUS_CLASSES[status]}`}
    >
      <span aria-hidden="true" className="text-micro">
        {STATUS_ICON[status]}
      </span>
      {label}
    </span>
  );
}

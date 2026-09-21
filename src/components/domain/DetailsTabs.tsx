"use client";

import { useRef, useState } from "react";
import type { AuctionDetails } from "../../lib/api/types";
import { FOCUS_RING } from "../primitives/utils";

export interface DetailsTabsLabels {
  readonly specifications: string;
  readonly features: string;
  readonly inspection: string;
}

export interface DetailsTabsProps {
  readonly details: AuctionDetails;
  readonly labels: DetailsTabsLabels;
}

export function DetailsTabs({ details, labels }: DetailsTabsProps) {
  const tabs = [
    { id: "specifications", label: labels.specifications },
    { id: "features", label: labels.features },
    ...(details.category === "vehicle"
      ? [{ id: "inspection", label: labels.inspection }]
      : []),
  ];
  const [selected, setSelected] = useState(tabs[0]?.id ?? "specifications");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectTab = (index: number) => {
    const next = tabs[index];
    if (!next) return;
    setSelected(next.id);
    tabRefs.current[index]?.focus();
  };
  const onKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const isRtl = document.dir === "rtl";
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const offset =
        event.key === "ArrowRight" ? (isRtl ? -1 : 1) : isRtl ? 1 : -1;
      selectTab((index + offset + tabs.length) % tabs.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      selectTab(tabs.length - 1);
    }
  };

  return (
    <section>
      <div
        role="tablist"
        aria-label={labels.specifications}
        className="flex flex-wrap gap-2 border-b border-stroke-light"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={`detail-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected === tab.id}
            aria-controls={`detail-panel-${tab.id}`}
            tabIndex={selected === tab.id ? 0 : -1}
            onClick={() => setSelected(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`border-b-2 px-3 py-2 text-body font-semibold ${selected === tab.id ? "border-action-primary text-action-primary" : "border-transparent text-text-sub-text"} ${FOCUS_RING}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`detail-panel-${selected}`}
        role="tabpanel"
        aria-labelledby={`detail-tab-${selected}`}
        className="pt-4"
      >
        {selected === "specifications" && (
          <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {details.specifications.map((specification) => (
              <div
                key={specification.label}
                className="rounded-md bg-surface-background p-3"
              >
                <dt className="text-body-sm text-text-sub-text">
                  {specification.label}
                </dt>
                <dd className="mt-1 text-body font-semibold text-text-primary">
                  {specification.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {selected === "features" && (
          <ul className="space-y-2 text-body text-text-primary">
            {details.features.map((feature) => (
              <li key={feature.text}>{feature.text}</li>
            ))}
          </ul>
        )}
        {selected === "inspection" && details.category === "vehicle" && (
          <dl className="space-y-2 text-body text-text-primary">
            <div>
              <dt className="text-body-sm text-text-sub-text">
                {details.inspection.provider}
              </dt>
              <dd>{details.inspection.grade}</dd>
            </div>
            <div>
              <dt className="text-body-sm text-text-sub-text">
                {labels.inspection}
              </dt>
              <dd>{details.inspection.summary}</dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}

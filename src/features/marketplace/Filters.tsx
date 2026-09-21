"use client";

import { useState } from "react";

import type {
  AdvancedFilter,
  CompanyNameFilter,
  FilterGroup,
  FilterSelect,
} from "../../config/marketplace";
import type { Locale } from "../../lib/api/types";
import { translate } from "../../lib/i18n";
import { Button } from "../../components/primitives/Button";
import { Sheet } from "../../components/primitives/Sheet";
import { cx, FOCUS_RING } from "../../components/primitives/utils";

type ConfiguredFilter = FilterSelect | CompanyNameFilter | AdvancedFilter;

export interface MarketplaceFiltersProps {
  readonly groups: readonly FilterGroup[];
  readonly advancedFilters: readonly AdvancedFilter[];
  readonly values: Readonly<Record<string, string | undefined>>;
  readonly locale: Locale;
  readonly action: string;
  readonly labels: {
    readonly title: string;
    readonly open: string;
    readonly apply: string;
  };
}

function controllingSelect(
  filter: CompanyNameFilter,
  groups: readonly FilterGroup[],
): FilterSelect | undefined {
  return groups
    .flatMap((group) => group.filters)
    .find(
      (candidate): candidate is FilterSelect =>
        candidate.type === "select" &&
        candidate.options.some(
          (option) => option.value === filter.revealedWhenSellerType,
        ),
    );
}

function isVisible(
  filter: ConfiguredFilter,
  groups: readonly FilterGroup[],
  values: Readonly<Record<string, string | undefined>>,
): boolean {
  if (!("revealedWhenSellerType" in filter)) return true;
  const controller = controllingSelect(filter, groups);
  return (
    controller !== undefined &&
    values[controller.id] === filter.revealedWhenSellerType
  );
}

function FilterControl({
  filter,
  groups,
  values,
  onValueChange,
  locale,
}: {
  readonly filter: ConfiguredFilter;
  readonly groups: readonly FilterGroup[];
  readonly values: Readonly<Record<string, string | undefined>>;
  readonly onValueChange: (id: string, value: string) => void;
  readonly locale: Locale;
}) {
  if (!isVisible(filter, groups, values)) return null;
  const id = `marketplace-filter-${filter.id}`;
  const value = values[filter.id] ?? "";
  const label = translate(locale, filter.labelKey);
  const fieldClassName = cx(
    "w-full rounded-lg border border-stroke-heavy bg-surface-white-bg px-3 py-2 text-body text-text-primary",
    FOCUS_RING,
  );

  if (filter.type === "select") {
    return (
      <div className="grid gap-2">
        <label htmlFor={id} className="text-label text-text-primary">
          {label}
        </label>
        <select
          id={id}
          name={filter.id}
          value={value}
          onChange={(event) => onValueChange(filter.id, event.target.value)}
          className={fieldClassName}
        >
          <option value="">{label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {translate(locale, option.labelKey)}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (filter.type === "range") {
    const displayedValue = value || String(filter.min);
    return (
      <div className="grid gap-2">
        <label htmlFor={id} className="text-label text-text-primary">
          {label}
          {value && filter.unit ? ` (${filter.unit})` : ""}
        </label>
        <input
          id={id}
          type="range"
          name={value ? filter.id : undefined}
          min={filter.min}
          max={filter.max}
          step={filter.step}
          value={displayedValue}
          onChange={(event) => onValueChange(filter.id, event.target.value)}
          className="w-full accent-action-primary"
        />
        <output htmlFor={id} className="text-body-sm text-text-sub-text">
          {value}
        </output>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-label text-text-primary">
        {label}
      </label>
      <input
        id={id}
        name={filter.id}
        type="search"
        value={value}
        placeholder={translate(locale, filter.placeholderKey)}
        onChange={(event) => onValueChange(filter.id, event.target.value)}
        className={fieldClassName}
      />
    </div>
  );
}

function FilterForm(props: MarketplaceFiltersProps) {
  const [values, setValues] = useState(props.values);
  const updateValue = (id: string, value: string) =>
    setValues((current) => ({ ...current, [id]: value }));
  return (
    <form action={props.action} className="grid gap-6">
      {props.groups.map((group) => (
        <fieldset key={group.id} className="grid gap-4 border-0 p-0">
          <legend className="text-h3 text-text-primary">
            {translate(props.locale, group.labelKey)}
          </legend>
          {group.filters.map((filter) => (
            <FilterControl
              key={filter.id}
              filter={filter}
              groups={props.groups}
              values={values}
              onValueChange={updateValue}
              locale={props.locale}
            />
          ))}
        </fieldset>
      ))}
      {props.advancedFilters.map((filter) => (
        <FilterControl
          key={filter.id}
          filter={filter}
          groups={props.groups}
          values={values}
          onValueChange={updateValue}
          locale={props.locale}
        />
      ))}
      <Button type="submit" fullWidth>
        {props.labels.apply}
      </Button>
    </form>
  );
}

export function MarketplaceFilters(props: MarketplaceFiltersProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="lg:hidden">
        <Button variant="outline" onClick={() => setOpen(true)}>
          {props.labels.open}
        </Button>
        <Sheet
          open={open}
          onOpenChange={setOpen}
          placement="bottom"
          responsive={false}
          title={props.labels.title}
          contentClassName="w-full p-5"
        >
          <FilterForm {...props} />
        </Sheet>
      </div>
      <aside
        aria-label={props.labels.title}
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
        className="hidden lg:sticky lg:top-4 lg:block lg:max-h-dvh lg:w-72 lg:overflow-y-auto lg:rounded-xl lg:border lg:border-stroke-heavy lg:bg-surface-white-bg lg:p-5"
      >
        <h2 className="mb-5 text-h2 text-text-primary">{props.labels.title}</h2>
        <FilterForm {...props} />
      </aside>
    </>
  );
}

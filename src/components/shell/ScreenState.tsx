"use client";

import type { ReactNode } from "react";
import type { ScreenState as ScreenStateType } from "../../lib/api/types";
import { Skeleton } from "../primitives/Skeleton";
import { Button } from "../primitives/Button";
import { Icon } from "../primitives/Icon";

export interface ScreenStateProps {
  readonly state: ScreenStateType;
  readonly loading?: ReactNode;
  readonly empty?: ReactNode;
  readonly error?: ReactNode;
  readonly loadingLabel: string;
  readonly emptyLabel: string;
  readonly errorLabel: string;
  readonly retryLabel: string;
  readonly onRetry?: () => void;
  readonly children: ReactNode;
}

function DefaultLoading({ label }: { readonly label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex flex-col items-center gap-4 p-8"
    >
      <Skeleton variant="rectangle" className="h-40 w-full rounded-lg" />
      <Skeleton variant="text" lines={3} className="w-full" />
      <Skeleton variant="text" lines={2} className="w-2/3" />
    </div>
  );
}

function DefaultEmpty({ label }: { readonly label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <Icon name="search" size="lg" className="text-text-placeholder" />
      <p className="text-h3 text-text-sub-text">{label}</p>
    </div>
  );
}

function DefaultError({
  label,
  retryLabel,
  retryEligible,
  onRetry,
}: {
  readonly label: string;
  readonly retryLabel: string;
  readonly retryEligible: boolean;
  readonly onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 p-8 text-center"
    >
      <Icon name="alert" size="lg" className="text-status-error" />
      <p className="text-h3 text-text-primary">{label}</p>
      {retryEligible && onRetry && (
        <Button variant="outline" size="md" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function ScreenState({
  state,
  loading,
  empty,
  error,
  loadingLabel,
  emptyLabel,
  errorLabel,
  retryLabel,
  onRetry,
  children,
}: ScreenStateProps) {
  switch (state.state) {
    case "loading":
      return loading ?? <DefaultLoading label={loadingLabel} />;

    case "empty":
      return empty ?? <DefaultEmpty label={emptyLabel} />;

    case "error":
      return (
        error ?? (
          <DefaultError
            label={errorLabel}
            retryLabel={retryLabel}
            retryEligible={state.retryEligible}
            onRetry={onRetry}
          />
        )
      );

    case "ready":
      return <>{children}</>;

    default:
      return <>{children}</>;
  }
}

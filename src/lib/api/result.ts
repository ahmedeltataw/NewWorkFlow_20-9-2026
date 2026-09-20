export type GatedIntent =
  "bid" | "deposit" | "buy-now" | "favorite" | "personal-area";

export interface PreservedIntent {
  readonly intent: GatedIntent;
  readonly returnTo: string;
}

export type ErrorKind =
  "network" | "timeout" | "server" | "notFound" | "unrecoverable";

export interface SuccessResult<D> {
  readonly status: "success";
  readonly data: D;
}

export interface ValidationFailureResult {
  readonly status: "validationFailure";
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export interface GateRequiredResult {
  readonly status: "gateRequired";
  readonly intent: PreservedIntent;
}

export interface ErrorResult {
  readonly status: "error";
  readonly kind: ErrorKind;
  readonly message: string;
  readonly retryEligible: boolean;
}

export type Result<D> =
  SuccessResult<D> | ValidationFailureResult | GateRequiredResult | ErrorResult;

export type CollectionResult<T> = Result<readonly T[]>;

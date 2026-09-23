import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  choice,
  TypeSafeClient,
  type ChoiceResponse,
  type SystemOneResult,
} from "@typesafe-ai/sdk";

try {
  process.loadEnvFile(".env");
} catch (error: unknown) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

export type Complexity = "simple" | "medium" | "complex";
export type Risk = "low" | "medium" | "high" | "critical";
export type ImpactScope =
  "single_file" | "feature" | "multi_feature" | "global";
export type ReviewLevel = "none" | "light" | "full";
export type ExecutionRoute =
  "fast-path" | "implementation" | "full-review" | "manual-triage";

const questions = {
  complexity: choice(
    "Classify the implementation complexity of `task.description`.",
    {
      simple: "An isolated, low-risk change with a clear implementation path.",
      medium:
        "A related multi-file enhancement or integration needing coordinated changes.",
      complex:
        "A broad feature, refactor, architecture change, or task with material uncertainty.",
    },
  ),
  risk: choice(
    "Classify the risk if `task.description` is implemented incorrectly.",
    {
      low: "Incorrect implementation is easy to detect or reverse and has limited impact.",
      medium:
        "Incorrect implementation could affect a feature or require meaningful repair.",
      high: "Incorrect implementation could break important behavior, contracts, or data integrity.",
      critical:
        "Incorrect implementation could cause security, privacy, financial, or irreversible harm.",
    },
  ),
  impact_scope: choice(
    "Classify the likely codebase impact scope of `task.description`.",
    {
      single_file: "Likely isolated to one source or configuration file.",
      feature: "Likely affects one feature across related files.",
      multi_feature: "Likely affects multiple features or shared modules.",
      global:
        "Likely affects application-wide architecture, shared contracts, or platform behavior.",
    },
  ),
  review_level: choice(
    "Select the minimum review depth warranted by `task.description`.",
    {
      none: "Direct implementation and focused verification are sufficient.",
      light: "A targeted code review and focused verification are warranted.",
      full: "Comprehensive review, integration verification, or specialist review is warranted.",
    },
  ),
} as const;

type ClassificationAnswers = {
  readonly complexity: ChoiceResponse<typeof questions.complexity.criteria>;
  readonly risk: ChoiceResponse<typeof questions.risk.criteria>;
  readonly impact_scope: ChoiceResponse<typeof questions.impact_scope.criteria>;
  readonly review_level: ChoiceResponse<typeof questions.review_level.criteria>;
};

type SystemOneClient = {
  systemOne(request: {
    state: { task: { description: string } };
    questions: typeof questions;
  }): Promise<SystemOneResult<typeof questions>>;
};

export interface ClassificationResult {
  readonly complexity: Complexity;
  readonly risk: Risk;
  readonly impact_scope: ImpactScope;
  readonly review_level: ReviewLevel;
  readonly confidence: {
    readonly complexity: number;
    readonly risk: number;
    readonly impact_scope: number;
    readonly review_level: number;
  };
}

export interface TokenMeasurement {
  readonly typesafe_tokens: number;
  readonly baseline_tokens: number | null;
  readonly tokens_saved: number | null;
  readonly savings_percent: number | null;
}

export interface ClassificationRecord {
  readonly schema_version: 1;
  readonly generated_at: string;
  readonly task: string;
  readonly model: string;
  readonly classification: ClassificationResult;
  readonly route: ExecutionRoute;
  readonly usage: {
    readonly input_tokens: number;
    readonly output_tokens: number;
  };
  readonly token_measurement: TokenMeasurement;
}

export function routeClassification(
  classification: Pick<
    ClassificationResult,
    "complexity" | "risk" | "impact_scope" | "review_level"
  >,
): ExecutionRoute {
  if (classification.risk === "critical") return "manual-triage";
  if (
    classification.risk === "high" ||
    classification.review_level === "full" ||
    classification.impact_scope === "global"
  )
    return "full-review";
  if (
    classification.risk === "medium" ||
    classification.complexity === "complex" ||
    classification.impact_scope === "multi_feature" ||
    classification.review_level === "light"
  )
    return "implementation";
  return "fast-path";
}

export function measureTokenSavings(
  usage: { readonly input_tokens: number; readonly output_tokens: number },
  baselineTokens?: number,
): TokenMeasurement {
  const typesafeTokens = usage.input_tokens + usage.output_tokens;
  if (baselineTokens === undefined)
    return {
      typesafe_tokens: typesafeTokens,
      baseline_tokens: null,
      tokens_saved: null,
      savings_percent: null,
    };
  const tokensSaved = baselineTokens - typesafeTokens;
  return {
    typesafe_tokens: typesafeTokens,
    baseline_tokens: baselineTokens,
    tokens_saved: tokensSaved,
    savings_percent: Number(((tokensSaved / baselineTokens) * 100).toFixed(2)),
  };
}

export async function classifyTask(
  task: string,
  client: SystemOneClient = new TypeSafeClient(),
): Promise<ClassificationRecord> {
  const result = await client.systemOne({
    state: { task: { description: task } },
    questions,
  });
  const answers = result.answers as ClassificationAnswers;
  const classification: ClassificationResult = {
    complexity: answers.complexity.choice as Complexity,
    risk: answers.risk.choice as Risk,
    impact_scope: answers.impact_scope.choice as ImpactScope,
    review_level: answers.review_level.choice as ReviewLevel,
    confidence: {
      complexity: answers.complexity.confidence,
      risk: answers.risk.confidence,
      impact_scope: answers.impact_scope.confidence,
      review_level: answers.review_level.confidence,
    },
  };
  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    task,
    model: result.model,
    classification,
    route: routeClassification(classification),
    usage: result.usage,
    token_measurement: measureTokenSavings(result.usage),
  };
}

/** Write a complete replacement record so readers never see partially written JSON. */
export async function persistClassification(
  record: ClassificationRecord,
  outputPath = ".ai/runtime/classification.json",
): Promise<void> {
  const destination = resolve(outputPath);
  await mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  await rename(temporary, destination);
}

function parseBaseline(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const baseline = Number(value);
  if (!Number.isFinite(baseline) || baseline <= 0)
    throw new Error("Baseline tokens must be a positive number.");
  return baseline;
}

export function parseArguments(args: readonly string[]): {
  task: string;
  baselineTokens: number | undefined;
} {
  const taskParts: string[] = [];
  let baselineTokens = parseBaseline(
    process.env.TASK_CLASSIFICATION_BASELINE_TOKENS,
  );
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--baseline-tokens") {
      baselineTokens = parseBaseline(args[index + 1]);
      index += 1;
    } else taskParts.push(argument ?? "");
  }
  const task = taskParts.join(" ").trim();
  if (!task) throw new Error("Task description required.");
  return { task, baselineTokens };
}

async function main(): Promise<void> {
  const { task, baselineTokens } = parseArguments(process.argv.slice(2));
  const record = await classifyTask(task);
  const measuredRecord: ClassificationRecord = {
    ...record,
    token_measurement: measureTokenSavings(record.usage, baselineTokens),
  };
  await persistClassification(measuredRecord);
  console.log(JSON.stringify(measuredRecord, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  classifyTask,
  measureTokenSavings,
  persistClassification,
  routeClassification,
  type ClassificationRecord,
} from "../../scripts/classify-task";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("TypeSafe task classification", () => {
  it("uses one typed System One request and routes its answers", async () => {
    const systemOne = async () => ({
      model: "jev-test",
      usage: { input_tokens: 36, output_tokens: 8 },
      answers: {
        complexity: {
          type: "choice" as const,
          choice: "medium" as const,
          confidence: 0.91,
          probabilities: { simple: 0.04, medium: 0.91, complex: 0.05 },
        },
        risk: {
          type: "choice" as const,
          choice: "low" as const,
          confidence: 0.88,
          probabilities: { low: 0.88, medium: 0.1, high: 0.01, critical: 0.01 },
        },
        impact_scope: {
          type: "choice" as const,
          choice: "feature" as const,
          confidence: 0.84,
          probabilities: {
            single_file: 0.1,
            feature: 0.84,
            multi_feature: 0.05,
            global: 0.01,
          },
        },
        review_level: {
          type: "choice" as const,
          choice: "light" as const,
          confidence: 0.79,
          probabilities: { none: 0.18, light: 0.79, full: 0.03 },
        },
      },
    });
    const record = await classifyTask("Add a related feature", { systemOne });
    expect(record.classification).toMatchObject({
      complexity: "medium",
      risk: "low",
      impact_scope: "feature",
      review_level: "light",
    });
    expect(record.route).toBe("implementation");
    expect(record.usage).toEqual({ input_tokens: 36, output_tokens: 8 });
  });

  it("routes critical work to manual triage and makes savings auditable", () => {
    expect(
      routeClassification({
        complexity: "simple",
        risk: "critical",
        impact_scope: "single_file",
        review_level: "none",
      }),
    ).toBe("manual-triage");
    expect(
      routeClassification({
        complexity: "simple",
        risk: "medium",
        impact_scope: "single_file",
        review_level: "none",
      }),
    ).toBe("implementation");
    expect(
      measureTokenSavings({ input_tokens: 120, output_tokens: 30 }, 500),
    ).toEqual({
      typesafe_tokens: 150,
      baseline_tokens: 500,
      tokens_saved: 350,
      savings_percent: 70,
    });
  });

  it("persists an independently readable metadata record", async () => {
    const directory = await mkdtemp(join(tmpdir(), "classification-"));
    temporaryDirectories.push(directory);
    const output = join(directory, "runtime", "classification.json");
    const record: ClassificationRecord = {
      schema_version: 1,
      generated_at: "2026-01-01T00:00:00.000Z",
      task: "Test persistence",
      model: "jev-test",
      classification: {
        complexity: "simple",
        risk: "low",
        impact_scope: "single_file",
        review_level: "none",
        confidence: {
          complexity: 1,
          risk: 1,
          impact_scope: 1,
          review_level: 1,
        },
      },
      route: "fast-path",
      usage: { input_tokens: 4, output_tokens: 2 },
      token_measurement: {
        typesafe_tokens: 6,
        baseline_tokens: null,
        tokens_saved: null,
        savings_percent: null,
      },
    };
    await persistClassification(record, output);
    await expect(readFile(output, "utf8")).resolves.toBe(
      `${JSON.stringify(record, null, 2)}\n`,
    );
  });
});

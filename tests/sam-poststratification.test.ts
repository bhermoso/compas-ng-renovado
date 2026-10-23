import { describe, expect, it } from "vitest";
import { computePoststratifiedMean, type PoststratificationInput } from "../src/application/sam/computePoststratifiedMean";

function fixture(): PoststratificationInput {
  return {
    municipalityCode: "test-code",
    sampleId: "synthetic-study",
    sampleFingerprint: "synthetic-fixture-v1",
    reference: {
      municipalityId: "synthetic", municipalityCode: "test-code", source: "Synthetic test, not INE",
      year: 2025, populationTotal: 100, ageGroupLabel: "20-24", extractedAt: "2026-10-23",
      ageSexMatrix: [{ ageBand: "20-24", male: 80, female: 20 }],
    },
    observations: [
      { ageBand: "20-24", sex: "male", value: 100 },
      { ageBand: "20-24", sex: "female", value: 0 },
      { ageBand: "20-24", sex: "female", value: 0 },
      { ageBand: "20-24", sex: "female", value: 0 },
    ],
  };
}

describe("separate poststratified mean", () => {
  it("normalizes per-observation weights, retaining raw counts and means", () => {
    const input = fixture();
    const before = structuredClone(input);
    const result = computePoststratifiedMean(input);
    expect(result.status).toBe("computed");
    if (result.status !== "computed") throw new Error("Expected computed result");
    expect(result.observedMean).toBe(25);
    expect(result.adjustedMean).toBeCloseTo(80, 12);
    expect(result.nValid).toBe(4);
    expect(result.sumWeights).toBeCloseTo(4, 12);
    expect(result.effectiveSampleSize).toBeCloseTo(16 / (3.2 ** 2 + 3 * (0.8 / 3) ** 2), 12);
    expect(result.minWeight).toBeCloseTo(0.8 / 3);
    expect(result.maxWeight).toBeCloseTo(3.2);
    expect(result.requiresHumanValidation).toBe(true);
    expect(input).toEqual(before);
    result.provenance.reference.ageSexMatrix![0].male = 0;
    expect(input.reference.ageSexMatrix![0].male).toBe(80);
  });

  it("recomputes weights when the sample changes", () => {
    const input = fixture();
    input.observations = [input.observations[0], input.observations[1]];
    const result = computePoststratifiedMean(input);
    expect(result.status).toBe("computed");
    if (result.status !== "computed") throw new Error("Expected computed result");
    expect(result.observedMean).toBe(50);
    expect(result.adjustedMean).toBeCloseTo(80);
    expect(result.maxWeight).toBeCloseTo(1.6);
  });

  it.each([
    ["another municipality", (i: PoststratificationInput) => { i.municipalityCode = "other"; }],
    ["missing fingerprint", (i: PoststratificationInput) => { i.sampleFingerprint = ""; }],
    ["missing matrix", (i: PoststratificationInput) => { delete i.reference.ageSexMatrix; }],
    ["wrong population total", (i: PoststratificationInput) => { i.reference.populationTotal = 101; }],
    ["negative population", (i: PoststratificationInput) => { i.reference.ageSexMatrix![0].male = -1; }],
    ["duplicate band", (i: PoststratificationInput) => { i.reference.ageSexMatrix!.push({ ...i.reference.ageSexMatrix![0] }); }],
    ["empty sample", (i: PoststratificationInput) => { i.observations = []; }],
    ["unobserved population cell", (i: PoststratificationInput) => { i.observations = [i.observations[0]]; }],
    ["unknown age band", (i: PoststratificationInput) => { i.observations = [{ ageBand: "unknown", sex: "male", value: 50 }]; }],
    ["nonfinite score", (i: PoststratificationInput) => { i.observations = [{ ageBand: "20-24", sex: "male", value: Infinity }]; }],
    ["zero population with responses", (i: PoststratificationInput) => { i.reference.ageSexMatrix![0] = { ageBand: "20-24", male: 0, female: 100 }; }],
  ] as const)("blocks %s instead of fabricating an adjusted mean", (_name, mutate) => {
    const input = fixture();
    mutate(input);
    const result = computePoststratifiedMean(input);
    expect(result.status).toBe("blocked");
    expect(result).not.toHaveProperty("adjustedMean");
  });
});

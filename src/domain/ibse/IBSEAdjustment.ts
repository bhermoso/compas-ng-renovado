import type { IBSEAggregates } from "./IBSEAggregates";
import type { PopulationReference } from "../sam/PopulationReference";

export type IBSEMeanField = keyof Omit<IBSEAggregates, "n" | "nValid">;
export type IBSEAdjustment =
  | { status: "blocked"; reasons: string[] }
  | {
      status: "computed";
      sampleFingerprint: string;
      reference: PopulationReference;
      method: "age-sex-poststratification-v1";
      requiresHumanValidation: true;
      metrics: Record<IBSEMeanField, {
        observedMean: number;
        adjustedMean: number;
        nValid: number;
        sumWeights: number;
        effectiveSampleSize: number;
      }>;
      cells: Array<{ ageBand: string; sex: "male" | "female"; population: number; observed: number; weight: number }>;
      methodologicalCautions: string[];
    };

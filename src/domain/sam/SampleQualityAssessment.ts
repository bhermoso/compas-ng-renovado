import type { MunicipalityId } from "../municipality";
import type { PopulationReference } from "./PopulationReference";
import type { SampleComposition } from "../../application/sam/computeSampleComposition";

export type SampleQualityLevel = "high" | "medium" | "low";

export interface CochranParams {
  confidence: number;
  marginOfError: number;
  expectedProportion: number;
}

export const DEFAULT_COCHRAN_PARAMS: CochranParams = {
  confidence: 0.95,
  marginOfError: 0.05,
  expectedProportion: 0.5,
};

export interface SampleCapabilities {
  canInferGlobalCoverage: boolean;
  canClassifyQuality: boolean;
}

export interface SampleQualityAssessment {
  instrumentId: string;
  municipalityId: MunicipalityId;
  nObserved: number;
  populationReference: PopulationReference;
  cochranParams: CochranParams;
  nTheoreticalRaw: number;
  nTheoretical: number;
  coverageGlobal: number;
  sampleQuality: SampleQualityLevel;
  sampleQualityRationale: string;
  methodologicalCautions: string[];
  capabilities: SampleCapabilities;
  requiresHumanValidation: true;
  computedAt: string;
  /**
   * Composición por edad y sexo de la muestra frente al padrón. Describe; no
   * califica la representatividad. Solo presente cuando
   * PopulationReference.ageSexMatrix está disponible y se proporciona la
   * distribución observada por celda. Cuando falta, el dictamen de tamaño
   * opera sin cambios.
   */
  composition?: SampleComposition;
}

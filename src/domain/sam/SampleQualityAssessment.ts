import type { MunicipalityId } from "../municipality";
import type { PopulationReference } from "./PopulationReference";
import type { RepresentativenessResult } from "../../application/sam/computeCellRepresentativeness";

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
   * Evaluación de representatividad demográfica por celda (edad × sexo).
   * Solo presente cuando PopulationReference.ageSexMatrix está disponible
   * Y se proporciona la distribución observada por celda (ageSexObserved).
   * Cuando falta, el motor Cochran + cobertura global opera sin cambios.
   */
  representativeness?: RepresentativenessResult;
}

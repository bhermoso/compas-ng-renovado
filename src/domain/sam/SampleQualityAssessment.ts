import type { MunicipalityId } from "../municipality";
import type { PopulationReference } from "./PopulationReference";
import type { SampleComposition } from "../../application/sam/computeSampleComposition";

/** Legacy levels remain readable; SAM v3 never assigns them. */
export type SampleQualityLevel = "high" | "medium" | "low" | "not-evaluable";
export const SAM_METHODOLOGY_VERSION = "SAM-3.0.0";

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
  /** Legacy name: n / theoretical n × 100, never population coverage. */
  coverageGlobal: number;
  /** n / reference N, descriptive ratio, not verified unique-person coverage. */
  populationRatioPercent?: number;
  /** Only with verified unique residents and matching population/time universe. */
  populationCoveragePercent?: number;
  /** Missing on historical assessments. */
  methodologyVersion?: string;
  /** Legacy field; new SAM returns not-evaluable. */
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
   * solo describe su referencia teórica.
   */
  composition?: SampleComposition;
}

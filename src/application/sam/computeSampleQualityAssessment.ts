import type { MunicipalityId } from "../../domain/municipality";
import type { PopulationReference } from "../../domain/sam/PopulationReference";
import {
  type SampleQualityAssessment,
  SAM_METHODOLOGY_VERSION,
  type CochranParams,
  DEFAULT_COCHRAN_PARAMS,
} from "../../domain/sam/SampleQualityAssessment";

// Z-scores para niveles de confianza estándar (tabla normal tipificada)
const Z_SCORES: Readonly<Record<number, number>> = {
  0.90: 1.645,
  0.95: 1.96,
  0.99: 2.576,
};

function getZScore(confidence: number): number {
  const z = Z_SCORES[confidence];
  if (z === undefined) {
    throw new Error(
      `Nivel de confianza no soportado: ${confidence}. Use 0.90, 0.95 o 0.99.`
    );
  }
  return z;
}

function cochranRaw(params: CochranParams): number {
  const z = getZScore(params.confidence);
  const p = params.expectedProportion;
  const e = params.marginOfError;
  return (z * z * p * (1 - p)) / (e * e);
}

// Corrección de población finita (FPC): reduce n0 cuando la muestra
// representa una fracción significativa de la población objetivo.
function applyFPC(n0: number, N: number): number {
  return Math.ceil(n0 / (1 + (n0 - 1) / N));
}

// Cochran is a conditional planning reference, never a confidence classifier.
const RANDOM_SAMPLE_PREMISE =
  "La muestra teórica supone una selección aleatoria. Alcanzar ese tamaño no demuestra " +
  "representatividad estadística ni permite atribuir su margen de error a esta muestra.";

export interface ComputeSAMInput {
  instrumentId: string;
  municipalityId: MunicipalityId;
  nObserved: number;
  populationReference: PopulationReference;
  cochranParams?: Partial<CochranParams>;
  participationBasis?: { uniqueResidents: boolean; matchingPopulationAndPeriod: boolean };
}

export function computeSampleQualityAssessment(
  input: ComputeSAMInput
): SampleQualityAssessment {
  const params: CochranParams = {
    ...DEFAULT_COCHRAN_PARAMS,
    ...input.cochranParams,
  };

  if (!Number.isInteger(input.nObserved) || input.nObserved < 0 ||
      !Number.isInteger(input.populationReference.populationTotal) || input.populationReference.populationTotal <= 0) {
    throw new RangeError("SAM requiere recuentos enteros no negativos y población positiva.");
  }
  if (!(params.marginOfError > 0 && params.marginOfError < 1) ||
      !(params.expectedProportion > 0 && params.expectedProportion < 1)) {
    throw new RangeError("Parámetros Cochran inválidos.");
  }
  const nTheoreticalRaw = cochranRaw(params);
  const nTheoretical = applyFPC(
    nTheoreticalRaw,
    input.populationReference.populationTotal
  );
  const coverageGlobal = (input.nObserved / nTheoretical) * 100;
  const populationRatioPercent = input.nObserved / input.populationReference.populationTotal * 100;

  return {
    instrumentId: input.instrumentId,
    municipalityId: input.municipalityId,
    nObserved: input.nObserved,
    populationReference: input.populationReference,
    cochranParams: params,
    nTheoreticalRaw,
    nTheoretical,
    coverageGlobal,
    methodologyVersion: SAM_METHODOLOGY_VERSION,
    populationRatioPercent,
    ...(input.participationBasis?.uniqueResidents && input.participationBasis.matchingPopulationAndPeriod && populationRatioPercent <= 100
      ? { populationCoveragePercent: populationRatioPercent } : {}),
    sampleQuality: "not-evaluable",
    sampleQualityRationale:
      `La muestra conseguida (n=${input.nObserved}) es el ${coverageGlobal.toLocaleString("es-ES", {maximumFractionDigits: 1})} % de la muestra teórica (n=${nTheoretical}). ` +
      `Cochran + FPC es una referencia para selección aleatoria simple: confianza nominal ${params.confidence * 100} %, error nominal ±${params.marginOfError * 100} %. ` +
      "Confianza metodológica: No evaluable; SAM no dispone de una evaluación verificada del diseño muestral.",
    methodologicalCautions: [
      RANDOM_SAMPLE_PREMISE,
      `Fuente poblacional de referencia: ${input.populationReference.source} (${input.populationReference.year}).`,
      "Una participación muy elevada constituye una fortaleza, pero no elimina posibles sesgos de selección o participación.",
      "No modifica los resultados del instrumento ni sus conclusiones sustantivas.",
    ],
    capabilities: {
      canInferGlobalCoverage: true,
      canClassifyQuality: false,
    },
    requiresHumanValidation: true,
    computedAt: new Date().toISOString(),
  };
}

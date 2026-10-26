import type { MunicipalityId } from "../../domain/municipality";
import type { PopulationReference } from "../../domain/sam/PopulationReference";
import {
  type SampleQualityAssessment,
  type SampleQualityLevel,
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

function classifyQuality(coverage: number): SampleQualityLevel {
  if (coverage >= 100) return "high";
  if (coverage >= 60) return "medium";
  return "low";
}

// La muestra teórica es el tamaño que necesitaría una muestra aleatoria simple de
// la población de referencia. Compararla con la muestra conseguida informa del
// tamaño, no de la representatividad: SAM no conoce cómo se seleccionó la muestra.
const RANDOM_SAMPLE_PREMISE =
  "La muestra teórica supone una selección aleatoria. Si la muestra no es probabilística " +
  "(por ejemplo, de participación voluntaria), alcanzar ese tamaño no la hace representativa " +
  "ni permite calcular un margen de error: quienes responden pueden diferir de quienes no " +
  "responden aunque sean muchos.";

function buildRationale(
  quality: SampleQualityLevel,
  coverage: number,
  nObserved: number,
  nTheoretical: number
): string {
  const pct = coverage.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const base =
    `La muestra conseguida (n=${nObserved}) es el ${pct} % de la muestra teórica ` +
    `(n=${nTheoretical}), el tamaño que necesitaría una muestra aleatoria simple de esta ` +
    `población para estimar una proporción con error ±5 % y confianza del 95 %.`;
  switch (quality) {
    case "high":
      return `${base} Alcanza ese tamaño. El tamaño no informa de cómo se seleccionó la muestra.`;
    case "medium":
      return `${base} No alcanza ese tamaño: aun con selección aleatoria, el error sería mayor de ±5 %.`;
    case "low":
      return (
        `${base} Queda muy por debajo: aun con selección aleatoria, el error superaría ` +
        `con mucho ±5 %. Las conclusiones tienen alcance descriptivo.`
      );
  }
}

function buildCautions(
  quality: SampleQualityLevel,
  populationReference: PopulationReference
): string[] {
  const cautions: string[] = [];

  if (quality === "low") {
    cautions.push(
      "Muestra insuficiente para estimar con error ±5 % y confianza 95 % aun con selección aleatoria. " +
      "Las conclusiones tienen alcance descriptivo, no inferencial."
    );
  } else if (quality === "medium") {
    cautions.push(
      "Tamaño parcial (60–99 % de la muestra teórica): aun con selección aleatoria, el error " +
      "superaría ±5 %. No se extraen inferencias categóricas sobre la población."
    );
  }

  cautions.push(RANDOM_SAMPLE_PREMISE);

  cautions.push(
    `Fuente poblacional de referencia: ${populationReference.source} (${populationReference.year}). ` +
    `El tamaño muestral teórico variará si se utiliza una fuente o año distintos.`
  );

  cautions.push(
    "El dictamen de tamaño informa. " +
    "No modifica los resultados del instrumento ni determina su validez metodológica."
  );

  return cautions;
}

export interface ComputeSAMInput {
  instrumentId: string;
  municipalityId: MunicipalityId;
  nObserved: number;
  populationReference: PopulationReference;
  cochranParams?: Partial<CochranParams>;
}

export function computeSampleQualityAssessment(
  input: ComputeSAMInput
): SampleQualityAssessment {
  const params: CochranParams = {
    ...DEFAULT_COCHRAN_PARAMS,
    ...input.cochranParams,
  };

  const nTheoreticalRaw = cochranRaw(params);
  const nTheoretical = applyFPC(
    nTheoreticalRaw,
    input.populationReference.populationTotal
  );
  const coverageGlobal = (input.nObserved / nTheoretical) * 100;
  const sampleQuality = classifyQuality(coverageGlobal);

  return {
    instrumentId: input.instrumentId,
    municipalityId: input.municipalityId,
    nObserved: input.nObserved,
    populationReference: input.populationReference,
    cochranParams: params,
    nTheoreticalRaw,
    nTheoretical,
    coverageGlobal,
    sampleQuality,
    sampleQualityRationale: buildRationale(
      sampleQuality,
      coverageGlobal,
      input.nObserved,
      nTheoretical
    ),
    methodologicalCautions: buildCautions(
      sampleQuality,
      input.populationReference
    ),
    capabilities: {
      canInferGlobalCoverage: true,
      canClassifyQuality: true,
    },
    requiresHumanValidation: true,
    computedAt: new Date().toISOString(),
  };
}

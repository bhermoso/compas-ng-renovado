import type { PopulationReference } from "../../domain/sam/PopulationReference";

export interface PoststratificationObservation {
  ageBand: string;
  sex: "male" | "female";
  value: number;
}

export interface PoststratificationInput {
  municipalityCode: string;
  sampleId: string;
  sampleFingerprint: string;
  reference: PopulationReference;
  /** Exact cells of the declared target universe, not a subset selected after observing missing cells. */
  observations: readonly PoststratificationObservation[];
}

export type PoststratificationResult =
  | { status: "blocked"; reasons: string[] }
  | {
      status: "computed";
      observedMean: number;
      adjustedMean: number;
      nValid: number;
      sumWeights: number;
      effectiveSampleSize: number;
      minWeight: number;
      maxWeight: number;
      cells: Array<{ ageBand: string; sex: "male" | "female"; population: number; observed: number; weight: number }>;
      provenance: {
        municipalityCode: string;
        sampleId: string;
        sampleFingerprint: string;
        reference: PopulationReference;
        method: "age-sex-poststratification-v1";
      };
      requiresHumanValidation: true;
      methodologicalCautions: string[];
    };

/** Pure calculation for one variable. Does not mutate raw aggregates or certify representativeness. */
export function computePoststratifiedMean(input: PoststratificationInput): PoststratificationResult {
  const { reference, observations } = input;
  const blocked = (reason: string): PoststratificationResult => ({ status: "blocked", reasons: [reason] });
  if (!input.municipalityCode || input.municipalityCode !== reference.municipalityCode) {
    return blocked("La referencia poblacional no corresponde al municipio de la muestra.");
  }
  if (!input.sampleId.trim() || !input.sampleFingerprint.trim() || !reference.source.trim() ||
      !reference.ageGroupLabel.trim() || !reference.extractedAt.trim() || !Number.isInteger(reference.year)) {
    return blocked("Falta identificar la muestra, su huella o la referencia y el universo poblacionales.");
  }
  const matrix = reference.ageSexMatrix;
  if (!matrix?.length || !Number.isSafeInteger(reference.populationTotal) || reference.populationTotal <= 0) {
    return blocked("No hay una matriz poblacional válida para el universo declarado.");
  }
  const labels = new Set<string>();
  const cells: Array<{ ageBand: string; sex: "male" | "female"; population: number; observed: number; sum: number }> = [];
  for (const row of matrix) {
    if (!row.ageBand.trim() || labels.has(row.ageBand) ||
        !Number.isSafeInteger(row.male) || row.male < 0 ||
        !Number.isSafeInteger(row.female) || row.female < 0) {
      return blocked("La matriz contiene bandas duplicadas o recuentos no válidos.");
    }
    labels.add(row.ageBand);
    for (const sex of ["male", "female"] as const) {
      cells.push({ ageBand: row.ageBand, sex, population: row[sex], observed: 0, sum: 0 });
    }
  }
  if (cells.reduce((sum, cell) => sum + cell.population, 0) !== reference.populationTotal) {
    return blocked("Las celdas no suman la población del universo declarado.");
  }
  if (!observations.length) return blocked("No hay respuestas válidas para calcular el ajuste.");
  for (const observation of observations) {
    const cell = cells.find((candidate) => candidate.ageBand === observation.ageBand && candidate.sex === observation.sex);
    if (!cell || !Number.isFinite(observation.value) || cell.population === 0) {
      return blocked("Hay respuestas sin celda compatible, sin valor finito o en celdas de población cero. No se han imputado ni excluido silenciosamente.");
    }
    cell.observed++;
    cell.sum += observation.value;
    if (!Number.isFinite(cell.sum)) return blocked("El cálculo excede el rango numérico admitido.");
  }
  const empty = cells.filter((cell) => cell.population > 0 && cell.observed === 0);
  if (empty.length) {
    return blocked(`No se puede ajustar al universo completo: ${empty.length} celdas con población no tienen respuestas.`);
  }
  const nValid = observations.length;
  const weightedCells = cells.filter((cell) => cell.observed > 0).map((cell) => ({
    ...cell,
    weight: (cell.population / reference.populationTotal) / (cell.observed / nValid),
  }));
  const sumWeights = weightedCells.reduce((sum, cell) => sum + cell.observed * cell.weight, 0);
  const sumSquaredWeights = weightedCells.reduce((sum, cell) => sum + cell.observed * cell.weight ** 2, 0);
  const adjustedMean = weightedCells.reduce((sum, cell) => sum + cell.sum * cell.weight, 0) / sumWeights;
  const observedMean = cells.reduce((sum, cell) => sum + cell.sum, 0) / nValid;
  const effectiveSampleSize = sumWeights ** 2 / sumSquaredWeights;
  if (![sumWeights, adjustedMean, observedMean, effectiveSampleSize].every(Number.isFinite) || sumWeights <= 0) {
    return blocked("El cálculo no produce un resultado numérico finito.");
  }
  return {
    status: "computed",
    observedMean,
    adjustedMean,
    nValid,
    sumWeights,
    effectiveSampleSize,
    minWeight: Math.min(...weightedCells.map((cell) => cell.weight)),
    maxWeight: Math.max(...weightedCells.map((cell) => cell.weight)),
    cells: weightedCells.map(({ ageBand, sex, population, observed, weight }) => ({ ageBand, sex, population, observed, weight })),
    provenance: {
      municipalityCode: input.municipalityCode,
      sampleId: input.sampleId,
      sampleFingerprint: input.sampleFingerprint,
      reference: structuredClone(reference),
      method: "age-sex-poststratification-v1",
    },
    requiresHumanValidation: true,
    methodologicalCautions: [
      "El ajuste equilibra la composición por edad y sexo del universo declarado; no elimina necesariamente el sesgo de selección dentro de cada grupo.",
      "El tamaño efectivo describe la dispersión de los pesos, no acredita representatividad ni permite por sí solo asignar un margen de error a una muestra voluntaria.",
      "Las medias observada y ajustada se conservan separadas. El resultado requiere validación humana y no determina prioridades.",
    ],
  };
}

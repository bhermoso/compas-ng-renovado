import type { IBSEMeanField } from "../../domain/ibse/IBSEAdjustment";
import type { AgeBand } from "../sam/buildAgeSexObserved";
import { computeSampleQualityAssessment } from "../sam/computeSampleQualityAssessment";
import type { SingleAgePopulation } from "../sam/populationReferenceRegistry";
import { parseIBSECSV } from "./IBSECSVParser";

/**
 * Análisis del IBSE en la franja joven, tratándola como una muestra de la
 * población de cada edad. Usa las respuestas del CSV original solo en memoria
 * (no se guardan) y la población por edad simple registrada.
 *
 * Los intervalos de confianza suponen selección aleatoria; el Monitor no lo
 * fue, así que no recogen el sesgo de selección. Se calculan con corrección por
 * población finita y solo con 10 o más respuestas.
 */

export const IBSE_FIELDS: ReadonlyArray<{ field: IBSEMeanField; label: string }> = [
  { field: "meanTotal", label: "IBSE total" },
  { field: "meanFactorVinculo", label: "Vínculo" },
  { field: "meanFactorPersona", label: "Persona" },
  { field: "meanFactorSituacion", label: "Situación" },
  { field: "meanFactorControl", label: "Control" },
];

export const MIN_N_FOR_INTERVAL = 10;
const Z95 = 1.959964;

export interface MeanWithInterval { mean: number; low?: number; high?: number }
export interface YouthAgeRow {
  age: number;
  population: number;
  n: number;
  /** n / población de la edad × 100. */
  ratioPercent: number;
  total: MeanWithInterval;
  women: { n: number; meanTotal?: number };
  men: { n: number; meanTotal?: number };
}
export interface IBSEYouthAnalysis {
  minAge: number;
  maxAge: number;
  populationSource: string;
  ages: YouthAgeRow[];
  group: {
    population: number;
    n: number;
    ratioPercent: number;
    /** Tamaño de referencia de Cochran (95 %, ±5 %, p = 0,5) con corrección finita. */
    nTheoretical: number;
    /** Margen de error de una proporción (p = 0,5) al 95 % con el n conseguido, en puntos. */
    marginPoints: number;
    means: Record<IBSEMeanField, MeanWithInterval>;
  };
  /** Mismas medidas en quienes tienen más edad que la franja, para comparar. */
  older: { n: number; means: Record<IBSEMeanField, number> };
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

export function meanWithInterval(xs: number[], population: number): MeanWithInterval {
  const m = mean(xs);
  if (xs.length < MIN_N_FOR_INTERVAL || population <= 1) return { mean: m };
  const variance = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  const fpc = Math.sqrt(Math.max(0, (population - xs.length) / (population - 1)));
  const half = Z95 * Math.sqrt(variance / xs.length) * fpc;
  return { mean: m, low: m - half, high: m + half };
}

export function analyzeIBSEYouth(input: {
  csvText: string;
  municipalityId: string;
  ageBands: AgeBand[];
  population: SingleAgePopulation;
  minAge: number;
  maxAge: number;
  surveyYear?: number;
}): IBSEYouthAnalysis | undefined {
  const { csvText, population, minAge, maxAge } = input;
  const parsed = parseIBSECSV(csvText, {
    ageBands: input.ageBands, collectAdjustmentRows: true,
    ...(input.surveyYear ? { surveyYear: input.surveyYear } : {}),
  });
  const rows = (parsed.adjustmentRows ?? []).flatMap((r) => {
    const age = /^\d+$/.test(r.age) ? Number(r.age) : NaN;
    if (!Number.isInteger(age)) return [];
    const sex = r.sex === "1" ? "male" as const : r.sex === "2" ? "female" as const : undefined;
    return [{ age, sex, values: r.values }];
  });

  const ages: YouthAgeRow[] = [];
  for (let age = minAge; age <= maxAge; age++) {
    const N = population.counts[age];
    if (N === undefined) return undefined;
    const at = rows.filter((r) => r.age === age);
    if (at.length === 0) continue;
    const women = at.filter((r) => r.sex === "female");
    const men = at.filter((r) => r.sex === "male");
    ages.push({
      age, population: N, n: at.length, ratioPercent: (at.length / N) * 100,
      total: meanWithInterval(at.map((r) => r.values.meanTotal), N),
      women: { n: women.length, ...(women.length ? { meanTotal: mean(women.map((r) => r.values.meanTotal)) } : {}) },
      men: { n: men.length, ...(men.length ? { meanTotal: mean(men.map((r) => r.values.meanTotal)) } : {}) },
    });
  }
  const inGroup = rows.filter((r) => r.age >= minAge && r.age <= maxAge);
  const older = rows.filter((r) => r.age > maxAge);
  if (inGroup.length === 0) return undefined;

  let groupPopulation = 0;
  for (let age = minAge; age <= maxAge; age++) groupPopulation += population.counts[age];
  const nTheoretical = computeSampleQualityAssessment({
    instrumentId: "ibse-youth",
    municipalityId: input.municipalityId,
    nObserved: inGroup.length,
    populationReference: {
      municipalityId: input.municipalityId, municipalityCode: input.municipalityId, source: population.source,
      year: 2025, populationTotal: groupPopulation, ageGroupLabel: `${minAge} a ${maxAge} años`, extractedAt: "",
    },
  }).nTheoretical;
  const n = inGroup.length;
  const marginPoints = 100 * Z95 * Math.sqrt(0.25 / n) * Math.sqrt(Math.max(0, (groupPopulation - n) / (groupPopulation - 1)));

  const groupMeans = Object.fromEntries(IBSE_FIELDS.map(({ field }) => [field, meanWithInterval(inGroup.map((r) => r.values[field]), groupPopulation)])) as Record<IBSEMeanField, MeanWithInterval>;
  const olderMeans = Object.fromEntries(IBSE_FIELDS.map(({ field }) => [field, older.length ? mean(older.map((r) => r.values[field])) : NaN])) as Record<IBSEMeanField, number>;

  return {
    minAge, maxAge, populationSource: population.source, ages,
    group: { population: groupPopulation, n, ratioPercent: (n / groupPopulation) * 100, nTheoretical, marginPoints, means: groupMeans },
    older: { n: older.length, means: olderMeans },
  };
}

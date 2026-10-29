/**
 * assessSample — entrada genérica de SAM.
 *
 * Evalúa cualquier muestra de COMPÁS con el mismo procedimiento, sea cual sea la
 * herramienta que la produjo (encuesta, priorización, Gestor de Encuestas, CSV
 * cargado a mano): tamaño frente a la muestra teórica (Cochran + FPC) y, si hay
 * padrón por edad y sexo y registros con edad y sexo, composición por celda frente
 * al padrón. SAM describe la composición; no califica la representatividad.
 *
 * Reglas:
 *  - Sin referencia poblacional verificada → no evaluable. No se estima nada.
 *  - Sin tamaño de muestra → no evaluable.
 *  - Sin padrón por edad y sexo, o sin edad y sexo en los registros, el dictamen de
 *    tamaño se emite y la representatividad queda como no evaluable, con el motivo.
 *  - Los registros sin sexo o edad reconocibles no se imputan: se cuentan y se declaran.
 *  - SAM informa. No modifica los resultados del estudio.
 */

import type { MunicipalityId } from "../../domain/municipality";
import type {
  AgeSexCell,
  PopulationReference,
} from "../../domain/sam/PopulationReference";
import type { SampleQualityAssessment } from "../../domain/sam/SampleQualityAssessment";
import { computeSampleQualityAssessment } from "./computeSampleQualityAssessment";
import { enrichWithComposition } from "./assessStudies";
import {
  buildAgeSexObserved,
  type AgeBand,
  type AgeSexObservedResult,
} from "./buildAgeSexObserved";
import { getPopulationReferenceSet } from "./populationReferenceRegistry";

export type SampleUniverse = "allAges" | "adult" | "minor";

export interface SampleRecord {
  /** "1"/"hombre"/"male" o "2"/"mujer"/"female". Otro valor: no asignable. */
  sex?: string;
  /** Edad en años cumplidos. Prevalece sobre `birthYear`. */
  age?: number;
  birthYear?: number;
}

export interface SampleInput {
  /** Only set after checking unique residents and matching target population/time. */
  participationBasis?: { uniqueResidents: boolean; matchingPopulationAndPeriod: boolean };
  /** Identifica el origen de la muestra (p. ej. "ibse", "priorizacion", "csv-manual"). */
  instrumentId: string;
  municipalityId: MunicipalityId;
  /** Tamaño de la muestra válida. Si falta, se usa el número de registros. */
  nObserved?: number;
  /** Registros individuales, para describir la composición por edad y sexo. */
  records?: ReadonlyArray<SampleRecord>;
  /**
   * Recuento ya agregado por banda de edad y sexo (alternativa a `records`).
   * Con `ageRange`, las bandas fuera del rango se excluyen y se declaran, y el
   * tamaño evaluado es el de las bandas conservadas.
   */
  observedCells?: ReadonlyArray<AgeSexCell>;
  /** Año de referencia para la ruta `birthYear`. */
  referenceYear?: number;
  /** Referencia explícita. Si falta, se toma del registro del municipio según `universe`. */
  populationReference?: PopulationReference;
  /** Universo de referencia en el registro. Por defecto, todas las edades. */
  universe?: SampleUniverse;
  /**
   * Restringe el padrón a un rango de edad, solo con bandas completas. Es la
   * comparación correcta para una encuesta que no incluye a toda la población
   * (p. ej. adultos de 20 a 99 años). Si el rango corta una banda, no es evaluable.
   */
  ageRange?: { min: number; max: number };
}

export type SampleAssessmentResult =
  | {
      status: "evaluable";
      assessment: SampleQualityAssessment;
      observed?: AgeSexObservedResult;
      /** Motivo por el que no se describió la composición por edad y sexo. */
      compositionNote?: string;
      notes: string[];
    }
  | {
      status: "not-evaluable";
      reasons: string[];
    };

/**
 * Cota de validez del dato, no un criterio estadístico: una edad por encima de
 * este valor no es una edad (p. ej. un año de nacimiento escrito en el campo de
 * edad) y la banda abierta («100+») no la absorbe. Esos registros se declaran como
 * fuera de banda y no se corrigen ni se imputan.
 */
export const MAX_VALID_AGE = 120;

export function parseAgeBandLabel(label: string): AgeBand | null {
  const range = /^(\d+)\s*-\s*(\d+)$/.exec(label.trim());
  if (range) return { label, min: Number(range[1]), max: Number(range[2]) };
  const open = /^(\d+)\s*\+$/.exec(label.trim());
  if (open) return { label, min: Number(open[1]), max: MAX_VALID_AGE };
  return null;
}

export function restrictReferenceToAgeRange(
  ref: PopulationReference,
  range: { min: number; max: number }
): { reference: PopulationReference } | { reason: string } {
  const matrix = ref.ageSexMatrix;
  if (!matrix) {
    return { reason: "El padrón de referencia no está desglosado por edad y sexo." };
  }
  const kept: AgeSexCell[] = [];
  for (const cell of matrix) {
    const band = parseAgeBandLabel(cell.ageBand);
    if (!band) {
      return { reason: `La banda de edad «${cell.ageBand}» no tiene un formato reconocible.` };
    }
    const inside = band.min >= range.min && band.max <= range.max;
    const outside = band.max < range.min || band.min > range.max;
    if (!inside && !outside) {
      return {
        reason: `El rango ${range.min}-${range.max} años corta la banda ${cell.ageBand} del padrón; solo se admiten rangos con bandas completas.`,
      };
    }
    if (inside) kept.push(cell);
  }
  if (kept.length === 0) {
    return { reason: `Ninguna banda del padrón cae dentro de ${range.min}-${range.max} años.` };
  }
  const total = kept.reduce((s, c) => s + c.male + c.female, 0);
  const first = kept[0].ageBand;
  const last = kept[kept.length - 1].ageBand;
  return {
    reference: {
      ...ref,
      source: `${ref.source} — bandas completas de ${first} a ${last}`,
      populationTotal: total,
      ageGroupLabel: `bandas ${first} a ${last}`,
      ageSexMatrix: kept,
    },
  };
}

function resolveReference(
  input: SampleInput
): { reference: PopulationReference } | { reason: string } {
  let base = input.populationReference;
  if (!base) {
    const set = getPopulationReferenceSet(input.municipalityId);
    base = set[input.universe ?? "allAges"];
  }
  if (!base) {
    return {
      reason:
        "No hay referencia poblacional verificada para este municipio y universo. SAM no estima la población.",
    };
  }
  if (input.ageRange) return restrictReferenceToAgeRange(base, input.ageRange);
  return { reference: base };
}

const fmt = (n: number) => n.toLocaleString("es-ES");

/**
 * Alinea el recuento observado con las bandas del padrón de referencia, por
 * etiqueta. Las bandas observadas que el padrón no incluye (p. ej. por un rango
 * de edad) se excluyen y se declaran. Si al padrón le falta alguna banda en lo
 * observado, no hay comparación posible: no se rellenan ceros.
 */
function alignObservedCells(
  observed: ReadonlyArray<AgeSexCell>,
  matrix: AgeSexCell[] | undefined
):
  | { cells: AgeSexCell[]; retainedTotal: number; excludedTotal: number; excludedBands: string[] }
  | { reason: string } {
  if (!matrix) {
    return { reason: "El padrón de referencia no está desglosado por edad y sexo." };
  }
  const byLabel = new Map(observed.map((c) => [c.ageBand, c]));
  const cells: AgeSexCell[] = [];
  for (const m of matrix) {
    const o = byLabel.get(m.ageBand);
    if (!o) {
      return {
        reason: `Las bandas de edad de la muestra no coinciden con las del padrón (falta ${m.ageBand}).`,
      };
    }
    cells.push({ ageBand: m.ageBand, male: o.male, female: o.female });
  }
  const kept = new Set(matrix.map((m) => m.ageBand));
  const excluded = observed.filter((c) => !kept.has(c.ageBand));
  const retainedTotal = cells.reduce((s, c) => s + c.male + c.female, 0);
  if (retainedTotal <= 0) {
    return { reason: "Ningún participante cae dentro de las bandas comparadas." };
  }
  return {
    cells,
    retainedTotal,
    excludedTotal: excluded.reduce((s, c) => s + c.male + c.female, 0),
    excludedBands: excluded.filter((c) => c.male + c.female > 0).map((c) => c.ageBand),
  };
}

export function assessSample(input: SampleInput): SampleAssessmentResult {
  const resolved = resolveReference(input);
  if ("reason" in resolved) {
    return { status: "not-evaluable", reasons: [resolved.reason] };
  }
  const reference = resolved.reference;
  const demographicCells = [...(reference.ageSexMatrix ?? []), ...(input.observedCells ?? [])];
  if (demographicCells.some(c => [c.male, c.female].some(n => !Number.isInteger(n) || n < 0))) {
    return { status: "not-evaluable", reasons: ["Los recuentos demográficos deben ser enteros no negativos."] };
  }
  if (!Number.isInteger(reference.populationTotal) || reference.populationTotal <= 0) {
    return { status: "not-evaluable", reasons: ["La población de referencia no es un recuento entero positivo."] };
  }
  if (input.ageRange && input.records) {
    const { min, max } = input.ageRange;
    const ages = input.records.map(r => r.age ?? (r.birthYear !== undefined && input.referenceYear !== undefined ? input.referenceYear - r.birthYear : NaN));
    if (ages.some(age => !Number.isInteger(age) || age < 0 || age > MAX_VALID_AGE)) {
      return { status: "not-evaluable", reasons: ["No se puede verificar la pertenencia al intervalo: hay registros sin edad válida."] };
    }
    if (ages.some(age => age < min || age > max)) {
      const records = input.records.filter((_, i) => ages[i] >= min && ages[i] <= max);
      const result = assessSample({ ...input, records, nObserved: records.length });
      if (result.status === "evaluable") result.notes.push(`${input.records.length - records.length} registros fuera del intervalo quedan excluidos del tamaño y de la composición.`);
      return result;
    }
  }

  const aligned = input.observedCells
    ? alignObservedCells(input.observedCells, reference.ageSexMatrix)
    : undefined;
  if (aligned && "reason" in aligned) {
    return { status: "not-evaluable", reasons: [aligned.reason] };
  }

  const nObserved = aligned
    ? aligned.retainedTotal
    : input.nObserved ?? input.records?.length;
  if (nObserved === undefined || !Number.isInteger(nObserved) || nObserved <= 0) {
    return {
      status: "not-evaluable",
      reasons: ["No hay tamaño de muestra: ni n válido ni registros individuales."],
    };
  }

  let assessment = computeSampleQualityAssessment({
    instrumentId: input.instrumentId,
    municipalityId: input.municipalityId,
    nObserved,
    populationReference: reference,
    participationBasis: input.participationBasis,
  });

  const notes: string[] = [];
  const matrix = reference.ageSexMatrix;

  if (aligned) {
    if (aligned.excludedTotal > 0) {
      notes.push(
        `${fmt(aligned.excludedTotal)} participantes de bandas de edad fuera del rango comparado (${aligned.excludedBands.join(", ")}) quedan fuera de este dictamen. El tamaño evaluado es el de las bandas conservadas (${fmt(aligned.retainedTotal)}).`
      );
    }
    assessment = enrichWithComposition(assessment, aligned.cells);
    return { status: "evaluable", assessment, notes };
  }

  if (!matrix) {
    return {
      status: "evaluable",
      assessment,
      compositionNote:
        "No evaluable por edad y sexo: el padrón de referencia no está desglosado por edad y sexo.",
      notes,
    };
  }
  if (!input.records || input.records.length === 0) {
    return {
      status: "evaluable",
      assessment,
      compositionNote:
        "No evaluable por edad y sexo: no se dispone de registros individuales con edad y sexo.",
      notes,
    };
  }

  const bands: AgeBand[] = [];
  for (const cell of matrix) {
    const band = parseAgeBandLabel(cell.ageBand);
    if (!band) {
      return {
        status: "evaluable",
        assessment,
        compositionNote: `No evaluable por edad y sexo: la banda «${cell.ageBand}» del padrón no tiene un formato reconocible.`,
        notes,
      };
    }
    bands.push(band);
  }

  const observed = buildAgeSexObserved(input.records, input.referenceYear ?? 0, bands);
  if (observed.assignedCount === 0) {
    return {
      status: "evaluable",
      assessment,
      observed,
      compositionNote:
        "No evaluable por edad y sexo: ningún registro tiene sexo y edad reconocibles dentro de las bandas del padrón.",
      notes,
    };
  }
  if (observed.unassignableCount > 0) {
    const b = observed.unassignableBreakdown;
    notes.push(
      `${observed.unassignableCount} de ${input.records.length} registros no se pueden asignar a una celda y quedan fuera de la comparación por edad y sexo (sin sexo reconocible: ${b.noSex}; sin edad: ${b.noBirthYear + b.noAge}; fuera de las bandas del padrón: ${b.outOfBand}). No se imputan.`
    );
  }

  assessment = enrichWithComposition(assessment, observed.cells);
  return { status: "evaluable", assessment, observed, notes };
}

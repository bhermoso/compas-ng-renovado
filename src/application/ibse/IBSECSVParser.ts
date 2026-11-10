import type { IBSEAggregates } from "../../domain/ibse";
import type { IBSEMeanField } from "../../domain/ibse/IBSEAdjustment";
import { getMethodologicalModule } from "../../domain/methodology";
import { splitRow } from "../csv-utils/splitRow";
import {
  buildAgeSexObserved,
  type AgeBand,
  type AgeSexObservedResult,
} from "../sam/buildAgeSexObserved";

// Nota: las columnas `sexo` y `edad` del export REDCap IBSE NO están en el mapeo
// del adaptador redcap de ibse.ts (que solo mapea puntuaciones calculadas). Se leen
// directamente por nombre de cabecera: "sexo" y "edad".

const IBSE_MODULE_ID = "ibse";

const ibseModule = getMethodologicalModule(IBSE_MODULE_ID);
if (!ibseModule?.adapters?.redcap) {
  throw new Error("Módulo metodológico IBSE sin adaptador REDCap configurado.");
}

const redcapAdapter = ibseModule.adapters.redcap;
const colByField = new Map(redcapAdapter.columns.map((c) => [c.outputField, c.redcapColumn]));

const COLS = {
  total:           colByField.get("meanTotal")!,
  factorVinculo:   colByField.get("meanFactorVinculo")!,
  factorSituacion: colByField.get("meanFactorSituacion")!,
  factorControl:   colByField.get("meanFactorControl")!,
  factorPersona:   colByField.get("meanFactorPersona")!,
  completed:       redcapAdapter.completedColumn,
  completedValue:  redcapAdapter.completedValue,
};

/**
 * Puntuación por ítems (algoritmo canónico del módulo IBSE: `inputLevel: individual-responses`).
 *
 * Cada ítem se lleva a una escala 0–100 en la que más es mejor; cada factor es la
 * media de sus dos ítems y el índice total, la media de los cuatro factores.
 *   - Frecuencia 1–4, emoción negativa (deprimido, solo):      (4 − x) / 3 × 100
 *   - Frecuencia 1–4, emoción positiva (feliz, disfrutar,
 *     energía, tranquilo):                                     (x − 1) / 3 × 100
 *   - Acuerdo 1–5, 1 = muy de acuerdo (optimista, bien
 *     conmigo mismo):                                          (5 − x) / 4 × 100
 *
 * Motivo: las fórmulas calculadas del proyecto REDCap Monitor IBSE Atarfe 2026 no
 * dejan los factores en la escala 0–100 que declaran. Vínculo solo alcanza 0–75 y
 * Situación y Control parten de 25 (25–100); Persona sí recorre 0–100. Con esas
 * puntuaciones, la comparación entre factores es un artefacto de las fórmulas.
 * Cuando el CSV trae los ocho ítems, el parser recalcula desde ellos y no usa las
 * columnas calculadas de REDCap.
 */
const IBSE_ITEM_SCORING: ReadonlyArray<{ column: string; factor: "vinculo" | "situacion" | "control" | "persona"; score: (x: number) => number; min: number; max: number }> = [
  { column: "ibse_deprimido", factor: "vinculo",   score: (x) => ((4 - x) / 3) * 100, min: 1, max: 4 },
  { column: "ibse_solo",      factor: "vinculo",   score: (x) => ((4 - x) / 3) * 100, min: 1, max: 4 },
  { column: "ibse_feliz",     factor: "situacion", score: (x) => ((x - 1) / 3) * 100, min: 1, max: 4 },
  { column: "ibse_disfrutar", factor: "situacion", score: (x) => ((x - 1) / 3) * 100, min: 1, max: 4 },
  { column: "ibse_energia",   factor: "control",   score: (x) => ((x - 1) / 3) * 100, min: 1, max: 4 },
  { column: "ibse_tranquilo", factor: "control",   score: (x) => ((x - 1) / 3) * 100, min: 1, max: 4 },
  { column: "ibse_optimista", factor: "persona",   score: (x) => ((5 - x) / 4) * 100, min: 1, max: 5 },
  { column: "ibse_bienmismo", factor: "persona",   score: (x) => ((5 - x) / 4) * 100, min: 1, max: 5 },
];

export const IBSE_ITEM_SCORING_CAUTION =
  "Factores e índice recalculados desde los ocho ítems en una escala común 0–100 (más es mejor). " +
  "No se usan las puntuaciones calculadas por REDCap porque sus fórmulas no comparten escala " +
  "(Vínculo 0–75; Situación y Control 25–100; Persona 0–100).";

/** Puntuaciones de un registro desde sus ítems, o `undefined` si falta o es inválido algún ítem. */
export function scoreIBSEItems(
  raw: Record<string, string | undefined>
): { total: number; vinculo: number; situacion: number; control: number; persona: number } | undefined {
  const sums = { vinculo: 0, situacion: 0, control: 0, persona: 0 };
  for (const item of IBSE_ITEM_SCORING) {
    const v = Number((raw[item.column] ?? "").trim());
    if ((raw[item.column] ?? "").trim() === "" || !Number.isInteger(v) || v < item.min || v > item.max) {
      return undefined;
    }
    sums[item.factor] += item.score(v);
  }
  const vinculo = sums.vinculo / 2;
  const situacion = sums.situacion / 2;
  const control = sums.control / 2;
  const persona = sums.persona / 2;
  return { total: (vinculo + situacion + control + persona) / 4, vinculo, situacion, control, persona };
}

/**
 * Conversión exacta de las puntuaciones calculadas por las fórmulas defectuosas de
 * REDCap a la escala común 0–100, para exports que no traen los ítems:
 *   Vínculo  0–75   → × 4/3
 *   Situación y Control 25–100 → (x − 25) × 4/3
 *   Persona  0–100  → sin cambio
 * La conversión es lineal y reproduce al decimal la puntuación por ítems (verificado
 * con los 811 registros válidos de Atarfe). Solo se aplica si los datos llevan la firma
 * de esas fórmulas: todas las puntuaciones son múltiplos de 12,5, Vínculo no pasa de 75
 * y Situación y Control no bajan de 25.
 */
export const IBSE_REDCAP_SCALE_CONVERSION_CAUTION =
  "Factores e índice convertidos a una escala común 0–100 desde las puntuaciones de REDCap, " +
  "cuyas fórmulas no comparten escala (Vínculo 0–75; Situación y Control 25–100; Persona 0–100). " +
  "La conversión es lineal y exacta.";

function convertRedcapScores(v: { vinculo: number; situacion: number; control: number; persona: number }) {
  const vinculo = (v.vinculo * 4) / 3;
  const situacion = ((v.situacion - 25) * 4) / 3;
  const control = ((v.control - 25) * 4) / 3;
  const persona = v.persona;
  return { vinculo, situacion, control, persona, total: (vinculo + situacion + control + persona) / 4 };
}

const EMPTY_AGGREGATES: IBSEAggregates = {
  n: 0,
  nValid: 0,
  meanTotal: 0,
  meanFactorVinculo: 0,
  meanFactorSituacion: 0,
  meanFactorControl: 0,
  meanFactorPersona: 0,
};

/** Opciones demográficas opcionales para el parser IBSE.
 *  Solo se calculan si el CSV contiene las columnas `sexo` y `edad`
 *  (leídas por nombre de cabecera; no están en el adaptador REDCap).
 *  Sin opciones o sin esas columnas, la salida es idéntica a la versión sin opciones.
 *  No se pasa referenceYear porque IBSE exporta `edad` como años cumplidos directamente.
 */
export interface IBSECSVParseOptions {
  ageBands: AgeBand[];
  collectAdjustmentRows?: boolean;
}

export interface IBSECSVParseResult {
  adjustmentRows?: Array<{ age: string; sex: string; values: Record<IBSEMeanField, number> }>;
  aggregates: IBSEAggregates;
  methodologicalCautions: string[];
  warnings: string[];
  /**
   * Distribución observada edad×sexo de la muestra.
   * Solo presente si el CSV incluye columnas `sexo` y `edad`
   * Y se pasaron `ageBands` en las opciones.
   * Solo incluye filas válidas: monitor_ibse_complete=2 y puntuaciones numéricas (misma exclusión que los agregados; suma nValid).
   */
  ageSexObserved?: AgeSexObservedResult;
}

export function parseIBSECSV(
  csvText: string,
  options?: IBSECSVParseOptions
): IBSECSVParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      aggregates: EMPTY_AGGREGATES,
      methodologicalCautions: ["CSV vacío o sin registros de datos. Verifica el formato y las columnas esperadas."],
      warnings: ["CSV vacío o sin registros de datos."],
    };
  }

  const warnings: string[] = [];
  const header = splitRow(lines[0]);

  const idx = {
    total:           header.indexOf(COLS.total),
    factorVinculo:   header.indexOf(COLS.factorVinculo),
    factorSituacion: header.indexOf(COLS.factorSituacion),
    factorControl:   header.indexOf(COLS.factorControl),
    factorPersona:   header.indexOf(COLS.factorPersona),
    completed:       header.indexOf(COLS.completed),
  };

  // Columnas demográficas: leídas por nombre de cabecera (no en el adaptador REDCap).
  const idxSexo = header.indexOf("sexo");
  const idxEdad = header.indexOf("edad");
  const hasDemographics = idxSexo !== -1 && idxEdad !== -1;

  // Ítems individuales: si están los ocho, se puntúa desde ellos (algoritmo canónico).
  const itemIdx = IBSE_ITEM_SCORING.map((it) => header.indexOf(it.column));
  const scoreFromItems = itemIdx.every((i) => i !== -1);

  const missing = Object.entries(idx)
    .filter(([, v]) => v === -1)
    .map(([k]) => k);

  if (missing.length > 0 && !scoreFromItems) {
    warnings.push(`Columnas no encontradas: ${missing.join(", ")}.`);
  }

  let n = 0;
  let nValid = 0;
  let sumTotal = 0;
  let sumVinculo = 0;
  let sumSituacion = 0;
  let sumControl = 0;
  let sumPersona = 0;
  const demographicRows: Array<{ sex?: string; age?: number }> = [];
  // Rango observado de las columnas calculadas (solo sin ítems), para detectar las
  // fórmulas de REDCap con escalas distintas.
  let maxVinculo = -Infinity;
  let minSituacion = Infinity;
  let minControl = Infinity;
  // Firma de las fórmulas de REDCap: todas las puntuaciones son múltiplos de 12,5.
  let onRedcapGrid = true;
  const onGrid = (x: number) => Math.abs(x / 12.5 - Math.round(x / 12.5)) < 1e-9;
  const adjustmentRows: NonNullable<IBSECSVParseResult["adjustmentRows"]> = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitRow(lines[i]);
    n++;

    if (idx.completed !== -1 && row[idx.completed] !== COLS.completedValue) {
      continue;
    }

    let total: number, vinculo: number, situacion: number, control: number, persona: number;
    if (scoreFromItems) {
      const raw: Record<string, string | undefined> = {};
      IBSE_ITEM_SCORING.forEach((it, k) => { raw[it.column] = row[itemIdx[k]]; });
      const scored = scoreIBSEItems(raw);
      if (!scored) continue;
      ({ total, vinculo, situacion, control, persona } = scored);
    } else {
      total     = parseFloat(row[idx.total]           ?? "");
      vinculo   = parseFloat(row[idx.factorVinculo]   ?? "");
      situacion = parseFloat(row[idx.factorSituacion] ?? "");
      control   = parseFloat(row[idx.factorControl]   ?? "");
      persona   = parseFloat(row[idx.factorPersona]   ?? "");
    }

    if (
      isNaN(total) || isNaN(vinculo) ||
      isNaN(situacion) || isNaN(control) || isNaN(persona)
    ) {
      continue;
    }

    // Recoger datos demográficos solo de filas válidas: completas y con todas las
    // puntuaciones numéricas (misma exclusión que los agregados, de modo que el recuento
    // por edad y sexo suma nValid).
    if (hasDemographics && options?.ageBands) {
      const rawEdad = row[idxEdad]?.trim();
      const parsedAge = rawEdad ? parseInt(rawEdad, 10) : undefined;
      demographicRows.push({
        sex: row[idxSexo]?.trim() || undefined,
        age: parsedAge !== undefined && Number.isFinite(parsedAge) ? parsedAge : undefined,
      });
    }

    nValid++;
    if (options?.collectAdjustmentRows) {
      adjustmentRows.push({
        age: idxEdad >= 0 ? row[idxEdad]?.trim() ?? "" : "",
        sex: idxSexo >= 0 ? row[idxSexo]?.trim() ?? "" : "",
        // Con puntuación por ítems, los valores ya están validados ítem a ítem. Sin ítems,
        // se conserva la lectura estricta (Number) para no reparar sufijos no numéricos.
        values: scoreFromItems ? {
          meanTotal: total, meanFactorVinculo: vinculo,
          meanFactorSituacion: situacion, meanFactorControl: control, meanFactorPersona: persona,
        } : {
          meanTotal: Number(row[idx.total]), meanFactorVinculo: Number(row[idx.factorVinculo]),
          meanFactorSituacion: Number(row[idx.factorSituacion]), meanFactorControl: Number(row[idx.factorControl]), meanFactorPersona: Number(row[idx.factorPersona]),
        },
      });
    }
    if (!scoreFromItems) {
      maxVinculo = Math.max(maxVinculo, vinculo);
      minSituacion = Math.min(minSituacion, situacion);
      minControl = Math.min(minControl, control);
      if (!onGrid(vinculo) || !onGrid(situacion) || !onGrid(control) || !onGrid(persona)) onRedcapGrid = false;
    }
    sumTotal     += total;
    sumVinculo   += vinculo;
    sumSituacion += situacion;
    sumControl   += control;
    sumPersona   += persona;
  }

  const avg = (sum: number): number =>
    nValid > 0 ? Math.round((sum / nValid) * 10) / 10 : 0;

  // Sin ítems: si las columnas calculadas tienen los rangos de las fórmulas de REDCap,
  // se convierten exactamente a la escala común (la conversión es lineal: vale para medias).
  const convertFromRedcap =
    !scoreFromItems && nValid > 0 && onRedcapGrid &&
    maxVinculo <= 75 && minSituacion >= 25 && minControl >= 25;
  if (convertFromRedcap) {
    const m = convertRedcapScores({
      vinculo: sumVinculo / nValid,
      situacion: sumSituacion / nValid,
      control: sumControl / nValid,
      persona: sumPersona / nValid,
    });
    sumVinculo = m.vinculo * nValid;
    sumSituacion = m.situacion * nValid;
    sumControl = m.control * nValid;
    sumPersona = m.persona * nValid;
    sumTotal = m.total * nValid;
    for (const r of adjustmentRows) {
      const c = convertRedcapScores({
        vinculo: r.values.meanFactorVinculo,
        situacion: r.values.meanFactorSituacion,
        control: r.values.meanFactorControl,
        persona: r.values.meanFactorPersona,
      });
      r.values = {
        meanTotal: c.total, meanFactorVinculo: c.vinculo, meanFactorSituacion: c.situacion,
        meanFactorControl: c.control, meanFactorPersona: c.persona,
      };
    }
  }

  const cautions: string[] = [];

  if (nValid === 0) {
    cautions.push("CSV sin registros válidos. Verifica el formato y las columnas esperadas.");
  } else {
    if (nValid < 30) {
      cautions.push(`Muestra pequeña (${nValid} registros válidos). Interpretar con precaución.`);
    }
    const incompleteRate = n > 0 ? ((n - nValid) / n) * 100 : 0;
    if (incompleteRate > 10) {
      cautions.push(
        `${incompleteRate.toFixed(1)} % de registros excluidos por incompletos. Posible sesgo de no respuesta.`
      );
    }
    if (scoreFromItems) {
      cautions.push(IBSE_ITEM_SCORING_CAUTION);
    } else if (convertFromRedcap) {
      cautions.push(IBSE_REDCAP_SCALE_CONVERSION_CAUTION);
    }
    cautions.push("Los resultados son medias de la muestra disponible, no estimaciones poblacionales.");
    cautions.push("No se ha aplicado ponderación demográfica: cada respuesta válida contribuye por igual a las medias.");
    if (!hasDemographics) {
      cautions.push("El archivo no contiene ambas columnas de edad y sexo; no permite calcular pesos individuales por edad y sexo.");
    }
  }

  let ageSexObserved: AgeSexObservedResult | undefined;
  if (hasDemographics && options?.ageBands && demographicRows.length > 0) {
    // referenceYear=0 porque IBSE exporta edad directa (no año de nacimiento).
    ageSexObserved = buildAgeSexObserved(demographicRows, 0, options.ageBands);
    const bd = ageSexObserved.unassignableBreakdown;
    const unassigned = ageSexObserved.unassignableCount;
    if (unassigned > 0) {
      const parts: string[] = [];
      if (bd.noSex > 0) parts.push(`${bd.noSex} sin sexo reconocible`);
      if (bd.noAge > 0) parts.push(`${bd.noAge} con edad no numérica`);
      if (bd.noBirthYear > 0) parts.push(`${bd.noBirthYear} sin edad`);
      if (bd.outOfBand > 0) parts.push(`${bd.outOfBand} con edad fuera de bandas`);
      warnings.push(
        `Distribución edad×sexo: ${unassigned} de ${demographicRows.length} registros no asignados a celda (${parts.join("; ")}).`
      );
    }
  }

  return {
    aggregates: {
      n,
      nValid,
      meanTotal:           avg(sumTotal),
      meanFactorVinculo:   avg(sumVinculo),
      meanFactorSituacion: avg(sumSituacion),
      meanFactorControl:   avg(sumControl),
      meanFactorPersona:   avg(sumPersona),
    },
    methodologicalCautions: cautions,
    warnings,
    ageSexObserved,
    ...(options?.collectAdjustmentRows ? { adjustmentRows } : {}),
  };
}

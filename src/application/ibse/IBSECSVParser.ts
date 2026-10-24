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

  const missing = Object.entries(idx)
    .filter(([, v]) => v === -1)
    .map(([k]) => k);

  if (missing.length > 0) {
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
  const adjustmentRows: NonNullable<IBSECSVParseResult["adjustmentRows"]> = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitRow(lines[i]);
    n++;

    if (idx.completed !== -1 && row[idx.completed] !== COLS.completedValue) {
      continue;
    }

    const total     = parseFloat(row[idx.total]           ?? "");
    const vinculo   = parseFloat(row[idx.factorVinculo]   ?? "");
    const situacion = parseFloat(row[idx.factorSituacion] ?? "");
    const control   = parseFloat(row[idx.factorControl]   ?? "");
    const persona   = parseFloat(row[idx.factorPersona]   ?? "");

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
        values: {
          meanTotal: Number(row[idx.total]), meanFactorVinculo: Number(row[idx.factorVinculo]),
          meanFactorSituacion: Number(row[idx.factorSituacion]), meanFactorControl: Number(row[idx.factorControl]), meanFactorPersona: Number(row[idx.factorPersona]),
        },
      });
    }
    sumTotal     += total;
    sumVinculo   += vinculo;
    sumSituacion += situacion;
    sumControl   += control;
    sumPersona   += persona;
  }

  const avg = (sum: number): number =>
    nValid > 0 ? Math.round((sum / nValid) * 10) / 10 : 0;

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

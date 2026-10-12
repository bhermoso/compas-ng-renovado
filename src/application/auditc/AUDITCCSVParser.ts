import type { AUDITCAggregates } from "../../domain/auditc";
import { getMethodologicalModule } from "../../domain/methodology";
import { splitRow } from "../csv-utils/splitRow";
import {
  buildAgeSexObserved,
  type AgeBand,
  type AgeSexObservedResult,
} from "../sam/buildAgeSexObserved";

// ── Configuración derivada de AUDITC_MODULE ───────────────────────────────────
// Los campos canónicos se obtienen del módulo metodológico (adapters.redcap.columns).

const _rawModule = getMethodologicalModule("auditc");
if (!_rawModule) {
  throw new Error(
    "[AUDITCCSVParser] Módulo 'auditc' no encontrado en el registro metodológico. " +
    "Verifica que AUDITC_MODULE esté registrado en domain/methodology/registry.ts."
  );
}
const _redcap = _rawModule.adapters?.redcap;
if (!_redcap) {
  throw new Error(
    "[AUDITCCSVParser] AUDITC_MODULE no tiene adaptador REDCap configurado."
  );
}

const _colByField = new Map(_redcap.columns.map((c) => [c.outputField, c.redcapColumn]));

const COL_Q1 = _colByField.get("q1")!;  // auditc_q1
const COL_Q2 = _colByField.get("q2")!;  // auditc_q2
const COL_Q3 = _colByField.get("q3")!;  // auditc_q3

const VALID_VALUES = new Set([0, 1, 2, 3, 4]);

const EMPTY_AGGREGATES: AUDITCAggregates = {
  n: 0, nValid: 0, missing: 0,
  meanScore: 0,
  nPositive: 0, pctPositive: 0,
  nScore0: 0, nScore1to3: 0, nScore4to7: 0, nScore8to12: 0,
};

/** Opciones demográficas opcionales para el parser.
 *  Solo se calculan si el CSV contiene las columnas `sexo` y `anio_nacimiento`.
 *  Si no se proporcionan, la salida es idéntica a la versión sin opciones.
 */
export interface AUDITCCSVParseOptions {
  ageBands: AgeBand[];
  /** Año de referencia para calcular la edad. Por defecto: año actual. */
  referenceYear?: number;
}

export interface AUDITCCSVParseResult {
  aggregates: AUDITCAggregates;
  methodologicalCautions: string[];
  warnings: string[];
  /**
   * Distribución observada edad×sexo de la muestra.
   * Solo presente si el CSV incluye columnas `sexo` y `anio_nacimiento`
   * Y se pasaron `ageBands` en las opciones.
   * Para usarla con enrichWithRepresentativeness se requiere además que
   * PopulationReference.ageSexMatrix esté disponible en la referencia poblacional.
   */
  ageSexObserved?: AgeSexObservedResult;
}

function parseItem(raw: string | undefined): number | null {
  const t = raw?.trim();
  if (t === undefined || t === "") return null;
  const v = Number(t);
  if (!Number.isInteger(v) || !VALID_VALUES.has(v)) return null;
  return v;
}

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

function buildCautions(aggregates: AUDITCAggregates): string[] {
  const cautions: string[] = [
    "El AUDIT-C mide el patrón actual de consumo autorreferido de alcohol. " +
      "Los resultados son estimaciones de la muestra y requieren validación técnica " +
      "antes de alimentar interpretación territorial o planificación.",
    "Punto de corte aplicado: score ≥ 4 (punto simplificado de uso general). " +
      "El corte diferenciado por sexo (≥3 mujeres / ≥4 hombres, Bush et al. 1998) " +
      "no se calcula en esta versión por ausencia del dato de sexo por participante. " +
      "Si la muestra tiene alta proporción de mujeres, la prevalencia real de consumo " +
      "de riesgo puede estar subestimada.",
    "Un score 0 no equivale necesariamente a abstemia total: puede reflejar consumo " +
      "ocasional muy esporádico que no activa los ítems Q2 y Q3.",
    "Sin referencia provincial ni autonómica disponible para comparación territorial.",
  ];

  if (aggregates.n === 0) {
    return [
      `CSV vacío o sin registros de datos. Verifica que incluya las columnas ${COL_Q1}, ${COL_Q2} y ${COL_Q3}.`,
      ...cautions,
    ];
  }

  if (aggregates.nValid === 0) {
    cautions.unshift(
      `CSV sin registros con los 3 ítems completos (${COL_Q1}, ${COL_Q2}, ${COL_Q3}). ` +
      "Verifica que las columnas contengan valores enteros 0–4."
    );
  } else if (aggregates.nValid < 30) {
    cautions.push(
      `Muestra reducida (${aggregates.nValid} registros válidos). ` +
      "Interpretar con precaución: los porcentajes tienen alta incertidumbre."
    );
  }

  if (aggregates.missing > 0) {
    cautions.push(
      `${aggregates.missing} de ${aggregates.n} registros excluidos por datos incompletos o inválidos.`
    );
  }

  if (aggregates.nValid > 0 && aggregates.nPositive < 10 && aggregates.nPositive > 0) {
    cautions.push(
      `Prevalencia de riesgo muy baja (n=${aggregates.nPositive} positivos). ` +
      "Los porcentajes deben interpretarse con extrema precaución por el tamaño de celda."
    );
  }

  return cautions;
}

export function parseAUDITCCSV(
  csvText: string,
  options?: AUDITCCSVParseOptions
): AUDITCCSVParseResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      aggregates: EMPTY_AGGREGATES,
      methodologicalCautions: buildCautions(EMPTY_AGGREGATES),
      warnings: ["CSV vacío o sin registros de datos."],
    };
  }

  const header = splitRow(lines[0]).map((v) => v.trim());
  const idxQ1 = header.indexOf(COL_Q1);
  const idxQ2 = header.indexOf(COL_Q2);
  const idxQ3 = header.indexOf(COL_Q3);

  // Columnas demográficas opcionales: presentes en exports REDCap completos.
  const idxSexo = header.indexOf("sexo");
  const idxAnio = header.indexOf("anio_nacimiento");
  const hasDemographics = idxSexo !== -1 && idxAnio !== -1;

  const warnings: string[] = [];
  if (idxQ1 === -1) warnings.push(`Columna "${COL_Q1}" no encontrada.`);
  if (idxQ2 === -1) warnings.push(`Columna "${COL_Q2}" no encontrada.`);
  if (idxQ3 === -1) warnings.push(`Columna "${COL_Q3}" no encontrada.`);

  if (idxQ1 === -1 && idxQ2 === -1 && idxQ3 === -1) {
    return {
      aggregates: EMPTY_AGGREGATES,
      methodologicalCautions: buildCautions(EMPTY_AGGREGATES),
      warnings,
    };
  }

  let n = 0, nValid = 0, missing = 0;
  let scoreSum = 0;
  let nPositive = 0;
  let nScore0 = 0, nScore1to3 = 0, nScore4to7 = 0, nScore8to12 = 0;
  const demographicRows: Array<{ sex?: string; birthYear?: number }> = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitRow(lines[i]);
    n++;

    const q1 = idxQ1 !== -1 ? parseItem(row[idxQ1]) : null;
    const q2 = idxQ2 !== -1 ? parseItem(row[idxQ2]) : null;
    const q3 = idxQ3 !== -1 ? parseItem(row[idxQ3]) : null;

    if (hasDemographics && options?.ageBands) {
      const rawAnio = row[idxAnio]?.trim();
      const birthYear = rawAnio ? parseInt(rawAnio, 10) : undefined;
      demographicRows.push({
        sex: row[idxSexo]?.trim() || undefined,
        birthYear: birthYear !== undefined && Number.isFinite(birthYear) ? birthYear : undefined,
      });
    }

    if (q1 === null || q2 === null || q3 === null) {
      missing++;
      continue;
    }

    const score = q1 + q2 + q3;
    nValid++;
    scoreSum += score;

    if (score >= 4) nPositive++;

    if (score === 0) nScore0++;
    else if (score <= 3) nScore1to3++;
    else if (score <= 7) nScore4to7++;
    else nScore8to12++;
  }

  const aggregates: AUDITCAggregates = {
    n,
    nValid,
    missing,
    meanScore: nValid > 0 ? Math.round((scoreSum / nValid) * 100) / 100 : 0,
    nPositive,
    pctPositive: pct(nPositive, nValid),
    nScore0,
    nScore1to3,
    nScore4to7,
    nScore8to12,
  };

  let ageSexObserved: AgeSexObservedResult | undefined;
  if (hasDemographics && options?.ageBands && demographicRows.length > 0) {
    const refYear = options.referenceYear ?? new Date().getFullYear();
    ageSexObserved = buildAgeSexObserved(demographicRows, refYear, options.ageBands);
  }

  return { aggregates, methodologicalCautions: buildCautions(aggregates), warnings, ageSexObserved };
}

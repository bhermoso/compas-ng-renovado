/**
 * computeCellRepresentativeness
 *
 * Evalúa la representatividad demográfica de la muestra conseguida respecto
 * a la muestra teórica (afijación Hamilton), celda a celda.
 *
 * Algoritmo (fuente: depurado/auditoria_sam_tripiramide_ibse.txt:16-72,
 * reproducido en analisis/F5/01-sam.md § Casos de prueba):
 *
 *   pct[s][g] = (celda[s][g] / total) × 100   ← % sobre el total de ambos sexos
 *   diff_pct  = pct_conseguido − pct_teorico
 *   MAE       = media(|diff_pct|) sobre todas las semi-celdas
 *   pctDentro = % de semi-celdas con |diff_pct| ≤ tolerance (inclusivo)
 *
 * Las etiquetas (alta/moderada/baja) son CONVENCIÓN, no umbral canónico.
 * Se exponen como parámetro QualityThresholds para que el equipo pueda
 * ajustarlos sin tocar el algoritmo. Los valores por defecto (1,5 / 3,5)
 * provienen del histórico (auditoria_sam:52) y se documentan como tal.
 *
 * Celda con población teórica cero: diff_pct se reporta como null (no evaluable).
 */

import type { AllocatedCell } from "./computeHamiltonAllocation";

export interface CellDeviation {
  ageBand: string;
  sex: "male" | "female";
  /** Porcentaje teórico de esta semi-celda sobre el total (%). */
  pctTheorical: number;
  /** Porcentaje conseguido de esta semi-celda sobre el total (%). */
  pctAchieved: number;
  /**
   * Desviación en puntos porcentuales: pctAchieved − pctTheorical.
   * null cuando la semi-celda teórica tiene población cero (no evaluable).
   */
  diffPp: number | null;
  /** true si |diffPp| ≤ tolerance (y diffPp !== null). */
  withinTolerance: boolean | null;
}

export interface RepresentativenessResult {
  /** Desviación por semi-celda (2 × número de bandas de edad). */
  cells: CellDeviation[];
  /** Error Absoluto Medio en puntos porcentuales (sobre celdas evaluables). */
  maePp: number;
  /** Porcentaje de semi-celdas evaluables dentro de la tolerancia. */
  pctWithinTolerance: number;
  /** Etiqueta de calidad (convención parametrizable). */
  qualityLabel: "alta" | "moderada" | "baja";
  /** Tolerancia usada (pp, inclusiva). Por defecto 2 pp. */
  tolerancePp: number;
}

/**
 * Umbrales de etiqueta de calidad (convención, no umbral canónico).
 * Valores por defecto del histórico (auditoria_sam_tripiramide_ibse.txt:52).
 */
export interface QualityThresholds {
  /** MAE ≤ highThreshold → "alta". Por defecto 1,5 pp. */
  highThreshold: number;
  /** MAE ≤ moderateThreshold → "moderada". Por defecto 3,5 pp. */
  moderateThreshold: number;
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  highThreshold: 1.5,
  moderateThreshold: 3.5,
};

/**
 * Calcula la representatividad celda a celda de la muestra conseguida respecto
 * a la distribución teórica (Hamilton).
 *
 * @param theoretical  Distribución teórica por celda (salida de Hamilton).
 * @param achieved     Distribución conseguida por celda (mismas bandas en mismo orden).
 * @param tolerancePp  Tolerancia en pp para considerar una celda "dentro" (por defecto 2 pp).
 * @param thresholds   Umbrales de etiqueta (por defecto: alta≤1,5 / moderada≤3,5).
 */
export function computeCellRepresentativeness(
  theoretical: AllocatedCell[],
  achieved: AllocatedCell[],
  tolerancePp = 2,
  thresholds: QualityThresholds = DEFAULT_QUALITY_THRESHOLDS
): RepresentativenessResult {
  if (theoretical.length !== achieved.length) {
    throw new RangeError(
      `theoretical y achieved deben tener el mismo número de bandas ` +
        `(${theoretical.length} vs ${achieved.length})`
    );
  }

  const theoreticalTotal = theoretical.reduce(
    (s, c) => s + c.male + c.female,
    0
  );
  const achievedTotal = achieved.reduce((s, c) => s + c.male + c.female, 0);

  const cells: CellDeviation[] = [];

  for (let i = 0; i < theoretical.length; i++) {
    for (const sex of ["male", "female"] as const) {
      const th = theoretical[i][sex];
      const ac = achieved[i][sex];

      const pctTheorical =
        theoreticalTotal > 0 ? (th / theoreticalTotal) * 100 : 0;
      const pctAchieved =
        achievedTotal > 0 ? (ac / achievedTotal) * 100 : 0;

      // La desviación solo es significativa cuando la semi-celda teórica tiene
      // población > 0. Si es cero, no hay referencia para esa celda concreta.
      // Contrato: "celda sin padrón = no evaluable; no se estima."
      const diffPp =
        theoreticalTotal > 0 && th > 0 ? pctAchieved - pctTheorical : null;
      const withinTolerance =
        diffPp !== null ? Math.abs(diffPp) <= tolerancePp : null;

      cells.push({
        ageBand: theoretical[i].ageBand,
        sex,
        pctTheorical,
        pctAchieved,
        diffPp,
        withinTolerance,
      });
    }
  }

  // Solo las celdas evaluables (diffPp !== null) entran en el indicador.
  const evaluable = cells.filter((c) => c.diffPp !== null);
  const maePp =
    evaluable.length > 0
      ? evaluable.reduce((s, c) => s + Math.abs(c.diffPp!), 0) /
        evaluable.length
      : 0;

  const pctWithinTolerance =
    evaluable.length > 0
      ? (evaluable.filter((c) => c.withinTolerance === true).length /
          evaluable.length) *
        100
      : 0;

  const qualityLabel: "alta" | "moderada" | "baja" =
    maePp <= thresholds.highThreshold
      ? "alta"
      : maePp <= thresholds.moderateThreshold
        ? "moderada"
        : "baja";

  return { cells, maePp, pctWithinTolerance, qualityLabel, tolerancePp };
}

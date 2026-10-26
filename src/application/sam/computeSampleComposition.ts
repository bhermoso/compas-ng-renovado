/**
 * computeSampleComposition
 *
 * Describe la composición por edad y sexo de la muestra conseguida frente al
 * padrón de referencia, semi-celda a semi-celda. No califica la
 * representatividad.
 *
 * Por qué no hay etiqueta ni índice resumen (revisión 2026-10-26):
 *  - SAM no conoce cómo se seleccionó la muestra. En una muestra no
 *    probabilística, coincidir en edad y sexo con la población no demuestra que
 *    quienes responden representen a quienes no responden.
 *  - El índice anterior (error absoluto medio en puntos sobre todas las
 *    semi-celdas, con etiquetas alta ≤ 1,5 / moderada ≤ 3,5) diluía los grupos
 *    ausentes entre muchas celdas pequeñas y sus umbrales no tenían fuente.
 *
 * Lo que se calcula son hechos verificables:
 *   pctPopulation = población de la semi-celda / población total × 100
 *   pctAchieved   = respuestas de la semi-celda / respuestas totales × 100
 *   diffPp        = pctAchieved − pctPopulation (null si la semi-celda no tiene población)
 * y, a partir de ellos, las bandas y semi-celdas sin respuestas, el reparto por
 * sexo y las bandas extremas con respuestas.
 */

import type { AgeSexCell } from "../../domain/sam/PopulationReference";

export type Sex = "male" | "female";

export interface CompositionCell {
  ageBand: string;
  sex: Sex;
  /** Habitantes de la semi-celda en el padrón de referencia. */
  populationCount: number;
  /** Respuestas de la semi-celda en la muestra. */
  observedCount: number;
  /** Porcentaje de la semi-celda sobre la población total (%). */
  pctPopulation: number;
  /** Porcentaje de la semi-celda sobre el total de respuestas (%). */
  pctAchieved: number;
  /**
   * Diferencia en puntos porcentuales: pctAchieved − pctPopulation.
   * null cuando la semi-celda no tiene población en el padrón.
   */
  diffPp: number | null;
}

export interface SexShare {
  pctPopulation: number;
  pctAchieved: number;
}

export interface SampleComposition {
  /** Semi-celdas en el orden del padrón: por banda, hombres y luego mujeres. */
  cells: CompositionCell[];
  populationTotal: number;
  observedTotal: number;
  /** Bandas con población en las que no respondió nadie de ningún sexo. */
  bandsWithoutResponses: string[];
  /**
   * Semi-celdas con población y sin respuestas, fuera de las bandas anteriores
   * (p. ej. mujeres de 35-39 cuando sí respondieron hombres de esa edad).
   */
  cellsWithoutResponses: Array<{ ageBand: string; sex: Sex }>;
  /** Reparto por sexo en la población y en la muestra. */
  sex: Record<Sex, SexShare>;
  /** Primera y última banda con alguna respuesta; null si no hay respuestas. */
  observedBandSpan: { first: string; last: string } | null;
}

const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

/**
 * @param population  Padrón por banda de edad y sexo.
 * @param observed    Respuestas por banda de edad y sexo, mismas bandas y mismo orden.
 */
export function computeSampleComposition(
  population: ReadonlyArray<AgeSexCell>,
  observed: ReadonlyArray<AgeSexCell>
): SampleComposition {
  if (population.length !== observed.length) {
    throw new RangeError(
      `population y observed deben tener el mismo número de bandas ` +
        `(${population.length} vs ${observed.length})`
    );
  }
  population.forEach((p, i) => {
    if (p.ageBand !== observed[i].ageBand) {
      throw new RangeError(
        `Las bandas no coinciden en la posición ${i}: «${p.ageBand}» frente a «${observed[i].ageBand}»`
      );
    }
  });

  const populationTotal = population.reduce((s, c) => s + c.male + c.female, 0);
  const observedTotal = observed.reduce((s, c) => s + c.male + c.female, 0);

  const cells: CompositionCell[] = [];
  const bandsWithoutResponses: string[] = [];
  const cellsWithoutResponses: Array<{ ageBand: string; sex: Sex }> = [];

  population.forEach((p, i) => {
    const o = observed[i];
    const bandPopulation = p.male + p.female;
    const bandEmpty = bandPopulation > 0 && o.male + o.female === 0;
    if (bandEmpty) bandsWithoutResponses.push(p.ageBand);

    for (const sex of ["male", "female"] as const) {
      const populationCount = p[sex];
      const observedCount = o[sex];
      const pctPopulation = pct(populationCount, populationTotal);
      const pctAchieved = pct(observedCount, observedTotal);
      cells.push({
        ageBand: p.ageBand,
        sex,
        populationCount,
        observedCount,
        pctPopulation,
        pctAchieved,
        diffPp: populationCount > 0 ? pctAchieved - pctPopulation : null,
      });
      if (!bandEmpty && populationCount > 0 && observedCount === 0) {
        cellsWithoutResponses.push({ ageBand: p.ageBand, sex });
      }
    }
  });

  const sexTotal = (rows: ReadonlyArray<AgeSexCell>, sex: Sex) =>
    rows.reduce((s, c) => s + c[sex], 0);
  const sexShare = (sex: Sex): SexShare => ({
    pctPopulation: pct(sexTotal(population, sex), populationTotal),
    pctAchieved: pct(sexTotal(observed, sex), observedTotal),
  });

  const withResponses = observed.filter((c) => c.male + c.female > 0);
  const observedBandSpan =
    withResponses.length > 0
      ? { first: withResponses[0].ageBand, last: withResponses[withResponses.length - 1].ageBand }
      : null;

  return {
    cells,
    populationTotal,
    observedTotal,
    bandsWithoutResponses,
    cellsWithoutResponses,
    sex: { male: sexShare("male"), female: sexShare("female") },
    observedBandSpan,
  };
}

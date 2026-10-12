/**
 * computeHamiltonAllocation
 *
 * Afijación proporcional con método de restos mayores (Hamilton / largest remainder).
 * Dado un desglose de población por celdas (ageSexMatrix) y un N teórico entero,
 * distribuye N exactamente entre las celdas proporcionalmente al peso poblacional
 * de cada una, asignando los enteros restantes a las celdas con mayor parte decimal.
 *
 * Propiedad garantizada: sum(male + female) de todas las CeldaAsignada === N.
 *
 * Fuente del método: historico/index.html:51545-51560 — sam_generarPiramideTeorica /
 * compas_hamilton. Método estándar de teoría de representación proporcional,
 * sin umbral ni peso heurístico.
 *
 * Celdas con población total cero: se asignan 0 observaciones. No se estima nada.
 * N < número de celdas con población: las primeras celdas (por orden de peso
 * proporcional, mayor a menor) reciben 1; el resto, 0.
 * N === 0: todas las celdas reciben 0.
 */

import type { AgeSexCell } from "../../domain/sam/PopulationReference";

/** Resultado de la afijación: observaciones teóricas por celda. */
export interface AllocatedCell {
  ageBand: string;
  male: number;
  female: number;
}

/** Resultado completo de la afijación Hamilton. */
export interface HamiltonAllocationResult {
  /** Asignación teórica por celda (suma exacta === nTheoretical). */
  cells: AllocatedCell[];
  /** N distribuido (idéntico a nTheoretical si la entrada es válida). */
  nTheoretical: number;
  /** Suma verificada — debe coincidir con nTheoretical. */
  checksum: number;
}

/**
 * Distribuye nTheoretical entre las celdas de ageSexMatrix de forma proporcional,
 * usando el método de restos mayores para garantizar suma exacta = N.
 *
 * @param ageSexMatrix  Desglose de población por banda y sexo.
 * @param nTheoretical  Tamaño muestral teórico entero a repartir (≥0).
 */
export function computeHamiltonAllocation(
  ageSexMatrix: AgeSexCell[],
  nTheoretical: number
): HamiltonAllocationResult {
  if (nTheoretical < 0) {
    throw new RangeError(`nTheoretical debe ser ≥ 0 (recibido: ${nTheoretical})`);
  }

  // Cada banda se descompone en dos semi-celdas independientes: hombre y mujer.
  // El peso de cada semi-celda es su población / población total.
  const populationTotal = ageSexMatrix.reduce(
    (s, c) => s + c.male + c.female,
    0
  );

  // Caso especial: sin población, todas las asignaciones son 0.
  if (populationTotal === 0 || nTheoretical === 0) {
    return {
      cells: ageSexMatrix.map((c) => ({ ageBand: c.ageBand, male: 0, female: 0 })),
      nTheoretical,
      checksum: 0,
    };
  }

  // Construimos la lista de semi-celdas con su cuota exacta (real).
  type SemiCell = {
    bandIdx: number;
    sex: "male" | "female";
    population: number;
    quota: number;      // parte entera
    remainder: number;  // parte decimal
    allocated: number;  // resultado final
  };

  const semis: SemiCell[] = [];
  for (let i = 0; i < ageSexMatrix.length; i++) {
    for (const sex of ["male", "female"] as const) {
      const pop = ageSexMatrix[i][sex];
      const exact = (pop / populationTotal) * nTheoretical;
      semis.push({
        bandIdx: i,
        sex,
        population: pop,
        quota: Math.floor(exact),
        remainder: exact - Math.floor(exact),
        allocated: Math.floor(exact),
      });
    }
  }

  // Cuántas unidades quedan por repartir tras asignar los enteros inferiores.
  const assigned = semis.reduce((s, sc) => s + sc.quota, 0);
  let remaining = nTheoretical - assigned;

  // Repartir los restos en orden decreciente de parte decimal (largest remainder).
  // Empate: orden de aparición (estable).
  const byRemainder = semis
    .map((sc, idx) => ({ idx, remainder: sc.remainder }))
    .sort((a, b) => b.remainder - a.remainder || a.idx - b.idx);

  for (let k = 0; k < remaining; k++) {
    semis[byRemainder[k].idx].allocated += 1;
  }

  // Recomponer en AllocatedCell por banda.
  const cellMap = new Map<number, AllocatedCell>();
  for (const sc of semis) {
    if (!cellMap.has(sc.bandIdx)) {
      cellMap.set(sc.bandIdx, {
        ageBand: ageSexMatrix[sc.bandIdx].ageBand,
        male: 0,
        female: 0,
      });
    }
    cellMap.get(sc.bandIdx)![sc.sex] = sc.allocated;
  }

  const cells = ageSexMatrix.map((_, i) =>
    cellMap.get(i) ?? { ageBand: ageSexMatrix[i].ageBand, male: 0, female: 0 }
  );

  const checksum = cells.reduce((s, c) => s + c.male + c.female, 0);

  return { cells, nTheoretical, checksum };
}

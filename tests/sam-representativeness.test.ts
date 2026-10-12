/**
 * tests/sam-representativeness.test.ts
 *
 * Pieza 3: computeCellRepresentativeness.
 *
 * Los casos de prueba son 4 casos de 2 bandas × 2 sexos = 4 semi-celdas,
 * con aritmética exacta y verificable a mano (autocontenidos en este fichero).
 *
 * Algoritmo verificado:
 *   pct[s][g] = celda[s][g] / total × 100   (% sobre total de ambos sexos)
 *   diffPp    = pctAchieved − pctTheorical
 *   MAE       = media(|diffPp|) sobre semi-celdas evaluables
 *   pctDentro = % de semi-celdas con |diffPp| ≤ 2 (inclusivo)
 */

import { describe, it, expect } from "vitest";
import {
  computeCellRepresentativeness,
  DEFAULT_QUALITY_THRESHOLDS,
} from "../src/application/sam/computeCellRepresentativeness";
import type { AllocatedCell } from "../src/application/sam/computeHamiltonAllocation";

// ── Casos del F5/01-sam.md ────────────────────────────────────────────────────
//
// Teórico en todos los casos: { A: m=250,f=250 ; B: m=250,f=250 }
// total teórico = 1000 → pctTheorical c/u = 25 %
// diff_pct = pctAchieved − 25
//
// C1 "alta"    — conseguido H:A=26,H:B=24,M:A=25,M:B=25   (tot=100) → diff ±1, 0, 0
// C2 "moderada"— conseguido H:A=30,H:B=20,M:A=25,M:B=25   (tot=100) → diff ±5, 0, 0
// C3 "baja"    — conseguido H:A=40,H:B=10,M:A=30,M:B=20   (tot=100) → diff ±15, ±5
// C4 borde ±2  — conseguido H:A=27,H:B=23,M:A=25,M:B=25   (tot=100) → diff ±2, 0, 0

const THEORETICAL: AllocatedCell[] = [
  { ageBand: "A", male: 250, female: 250 },
  { ageBand: "B", male: 250, female: 250 },
];

const C1_ACHIEVED: AllocatedCell[] = [
  { ageBand: "A", male: 26, female: 25 },
  { ageBand: "B", male: 24, female: 25 },
];

const C2_ACHIEVED: AllocatedCell[] = [
  { ageBand: "A", male: 30, female: 25 },
  { ageBand: "B", male: 20, female: 25 },
];

const C3_ACHIEVED: AllocatedCell[] = [
  { ageBand: "A", male: 40, female: 30 },
  { ageBand: "B", male: 10, female: 20 },
];

const C4_ACHIEVED: AllocatedCell[] = [
  { ageBand: "A", male: 27, female: 25 },
  { ageBand: "B", male: 23, female: 25 },
];

describe("computeCellRepresentativeness — casos F5/01-sam.md", () => {
  it("C1 alta: MAE=0,5 pp; 100% dentro ±2; etiqueta alta", () => {
    const r = computeCellRepresentativeness(THEORETICAL, C1_ACHIEVED);
    expect(r.maePp).toBeCloseTo(0.5, 5);
    expect(r.pctWithinTolerance).toBe(100);
    expect(r.qualityLabel).toBe("alta");
  });

  it("C2 moderada: MAE=2,5 pp; 50% dentro ±2; etiqueta moderada", () => {
    const r = computeCellRepresentativeness(THEORETICAL, C2_ACHIEVED);
    expect(r.maePp).toBeCloseTo(2.5, 5);
    expect(r.pctWithinTolerance).toBe(50);
    expect(r.qualityLabel).toBe("moderada");
  });

  it("C3 baja: MAE=10,0 pp; 0% dentro ±2; etiqueta baja", () => {
    const r = computeCellRepresentativeness(THEORETICAL, C3_ACHIEVED);
    expect(r.maePp).toBeCloseTo(10.0, 5);
    expect(r.pctWithinTolerance).toBe(0);
    expect(r.qualityLabel).toBe("baja");
  });

  it("C4 borde ±2: MAE=1,0 pp; 100% dentro ±2 (|2|≤2 incluido); etiqueta alta", () => {
    const r = computeCellRepresentativeness(THEORETICAL, C4_ACHIEVED);
    expect(r.maePp).toBeCloseTo(1.0, 5);
    expect(r.pctWithinTolerance).toBe(100);
    expect(r.qualityLabel).toBe("alta");
    // verificar explícitamente que la tolerancia es inclusiva
    const cell = r.cells.find((c) => c.ageBand === "A" && c.sex === "male")!;
    expect(Math.abs(cell.diffPp!)).toBe(2);
    expect(cell.withinTolerance).toBe(true);
  });
});

describe("computeCellRepresentativeness — estructura del resultado", () => {
  it("devuelve una celda por semi-celda (2 bandas × 2 sexos = 4)", () => {
    const r = computeCellRepresentativeness(THEORETICAL, C1_ACHIEVED);
    expect(r.cells).toHaveLength(4);
  });

  it("preserva el ageBand y sex en cada celda de resultado", () => {
    const r = computeCellRepresentativeness(THEORETICAL, C1_ACHIEVED);
    const bandas = r.cells.map((c) => c.ageBand);
    expect(bandas).toContain("A");
    expect(bandas).toContain("B");
    const sexos = r.cells.map((c) => c.sex);
    expect(sexos.filter((s) => s === "male")).toHaveLength(2);
    expect(sexos.filter((s) => s === "female")).toHaveLength(2);
  });

  it("reporta la tolerancePp usada", () => {
    const r = computeCellRepresentativeness(THEORETICAL, C1_ACHIEVED);
    expect(r.tolerancePp).toBe(2);
  });
});

describe("computeCellRepresentativeness — umbrales parametrizables", () => {
  it("umbrales más estrictos cambian la etiqueta sin cambiar el MAE", () => {
    const strict = { highThreshold: 0.2, moderateThreshold: 0.8 };
    const r = computeCellRepresentativeness(THEORETICAL, C1_ACHIEVED, 2, strict);
    // MAE = 0,5 > 0,2 → ya no es "alta" con umbrales estrictos
    expect(r.maePp).toBeCloseTo(0.5, 5);
    expect(r.qualityLabel).toBe("moderada");
  });

  it("tolerancia 0 hace que ninguna celda esté dentro cuando todas tienen diff≠0", () => {
    // C3 tiene diffs +15, −15, +5, −5 — ninguna es cero — así que 0% dentro con tolerancia 0.
    // (C2 tiene dos celdas con diff=0; |0|≤0 es true, así que no sirve para este caso.)
    const r = computeCellRepresentativeness(THEORETICAL, C3_ACHIEVED, 0);
    expect(r.pctWithinTolerance).toBe(0);
  });

  it("tolerancia 100 hace que todas las celdas estén dentro", () => {
    const r = computeCellRepresentativeness(THEORETICAL, C3_ACHIEVED, 100);
    expect(r.pctWithinTolerance).toBe(100);
  });
});

describe("computeCellRepresentativeness — casos borde", () => {
  it("muestra conseguida idéntica a la teórica → MAE=0, 100% dentro", () => {
    const identical: AllocatedCell[] = [
      { ageBand: "A", male: 250, female: 250 },
      { ageBand: "B", male: 250, female: 250 },
    ];
    const r = computeCellRepresentativeness(THEORETICAL, identical);
    expect(r.maePp).toBe(0);
    expect(r.pctWithinTolerance).toBe(100);
    expect(r.qualityLabel).toBe("alta");
  });

  it("número de bandas distinto → RangeError", () => {
    const short: AllocatedCell[] = [{ ageBand: "A", male: 50, female: 50 }];
    expect(() =>
      computeCellRepresentativeness(THEORETICAL, short)
    ).toThrow(RangeError);
  });

  it("celda teórica cero → diffPp=null, withinTolerance=null", () => {
    const thWithZero: AllocatedCell[] = [
      { ageBand: "A", male: 0, female: 0 },
      { ageBand: "B", male: 500, female: 500 },
    ];
    const acWithZero: AllocatedCell[] = [
      { ageBand: "A", male: 10, female: 10 },
      { ageBand: "B", male: 40, female: 40 },
    ];
    const r = computeCellRepresentativeness(thWithZero, acWithZero);
    const cellA_male = r.cells.find(
      (c) => c.ageBand === "A" && c.sex === "male"
    )!;
    expect(cellA_male.diffPp).toBeNull();
    expect(cellA_male.withinTolerance).toBeNull();
  });
});

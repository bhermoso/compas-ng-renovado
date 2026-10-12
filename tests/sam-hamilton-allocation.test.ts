/**
 * tests/sam-hamilton-allocation.test.ts
 *
 * Pieza 2: afijación proporcional por método de restos mayores (Hamilton).
 *
 * Criterios de aceptación:
 *   - checksum === nTheoretical (suma exacta garantizada).
 *   - Proporcionalidad respetada (las celdas mayores reciben más).
 *   - Casos borde: N=0, N<nCeldas, celdas con población cero.
 */

import { describe, it, expect } from "vitest";
import { computeHamiltonAllocation } from "../src/application/sam/computeHamiltonAllocation";
import type { AgeSexCell } from "../src/domain/sam/PopulationReference";

// Matriz de 2 bandas × 2 sexos = 4 semi-celdas (igual peso, fácil de verificar)
const EQUAL_MATRIX: AgeSexCell[] = [
  { ageBand: "A", male: 250, female: 250 },
  { ageBand: "B", male: 250, female: 250 },
];

// Matriz de 5 bandas × 2 sexos (proporcional distinto)
const UNEQUAL_MATRIX: AgeSexCell[] = [
  { ageBand: "16-29", male: 290, female: 280 },
  { ageBand: "30-44", male: 410, female: 400 },
  { ageBand: "45-64", male: 480, female: 510 },
  { ageBand: "65-74", male: 200, female: 260 },
  { ageBand: "75+",   male: 150, female: 195 },
];

describe("computeHamiltonAllocation — suma exacta", () => {
  it("suma exacta = N para pesos iguales (N divisible)", () => {
    const r = computeHamiltonAllocation(EQUAL_MATRIX, 100);
    expect(r.checksum).toBe(100);
    expect(r.checksum).toBe(r.nTheoretical);
  });

  it("suma exacta = N para pesos iguales (N no divisible entre 4)", () => {
    const r = computeHamiltonAllocation(EQUAL_MATRIX, 101);
    expect(r.checksum).toBe(101);
  });

  it("suma exacta = N para pesos distintos", () => {
    const r = computeHamiltonAllocation(UNEQUAL_MATRIX, 385);
    expect(r.checksum).toBe(385);
  });

  it("suma exacta = N para pesos distintos y N impar", () => {
    const r = computeHamiltonAllocation(UNEQUAL_MATRIX, 333);
    expect(r.checksum).toBe(333);
  });

  it("todas las celdas son enteros no negativos", () => {
    const r = computeHamiltonAllocation(UNEQUAL_MATRIX, 385);
    for (const c of r.cells) {
      expect(Number.isInteger(c.male)).toBe(true);
      expect(Number.isInteger(c.female)).toBe(true);
      expect(c.male).toBeGreaterThanOrEqual(0);
      expect(c.female).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("computeHamiltonAllocation — proporcionalidad", () => {
  it("la banda con más población recibe más observaciones", () => {
    const r = computeHamiltonAllocation(UNEQUAL_MATRIX, 385);
    // 45-64 es la banda más grande (480+510=990); 16-29 es la más pequeña (290+280=570)
    const band4564 = r.cells.find((c) => c.ageBand === "45-64")!;
    const band1629 = r.cells.find((c) => c.ageBand === "16-29")!;
    expect(band4564.male + band4564.female).toBeGreaterThan(
      band1629.male + band1629.female
    );
  });

  it("las bandas proporcionales iguales reciben exactamente el mismo total", () => {
    // Con EQUAL_MATRIX y N=100, las 4 semi-celdas tienen igual peso → 25 c/u.
    const r = computeHamiltonAllocation(EQUAL_MATRIX, 100);
    for (const c of r.cells) {
      expect(c.male).toBe(25);
      expect(c.female).toBe(25);
    }
  });
});

describe("computeHamiltonAllocation — casos borde", () => {
  it("N=0 → todas las asignaciones son 0", () => {
    const r = computeHamiltonAllocation(EQUAL_MATRIX, 0);
    expect(r.checksum).toBe(0);
    for (const c of r.cells) {
      expect(c.male).toBe(0);
      expect(c.female).toBe(0);
    }
  });

  it("N < número de semi-celdas → solo las más pesadas reciben 1", () => {
    // EQUAL_MATRIX tiene 4 semi-celdas (igual peso). Con N=2:
    // los 2 primeros en orden de aparición con mayor decimal (0.5 c/u) reciben 1.
    const r = computeHamiltonAllocation(EQUAL_MATRIX, 2);
    expect(r.checksum).toBe(2);
    const total = r.cells.reduce((s, c) => s + c.male + c.female, 0);
    expect(total).toBe(2);
  });

  it("celda con población cero recibe 0 aunque N sea grande", () => {
    const withZero: AgeSexCell[] = [
      { ageBand: "A", male: 500, female: 500 },
      { ageBand: "B", male: 0,   female: 0   }, // sin población
    ];
    const r = computeHamiltonAllocation(withZero, 100);
    expect(r.checksum).toBe(100);
    const cellB = r.cells.find((c) => c.ageBand === "B")!;
    expect(cellB.male).toBe(0);
    expect(cellB.female).toBe(0);
  });

  it("población total cero → todas las asignaciones son 0", () => {
    const allZero: AgeSexCell[] = [
      { ageBand: "A", male: 0, female: 0 },
      { ageBand: "B", male: 0, female: 0 },
    ];
    const r = computeHamiltonAllocation(allZero, 50);
    expect(r.checksum).toBe(0);
  });

  it("nTheoretical negativo lanza RangeError", () => {
    expect(() => computeHamiltonAllocation(EQUAL_MATRIX, -1)).toThrow(RangeError);
  });

  it("N=1 con pesos iguales → exactamente 1 semi-celda recibe 1", () => {
    const r = computeHamiltonAllocation(EQUAL_MATRIX, 1);
    expect(r.checksum).toBe(1);
  });

  it("preserva el orden y los nombres de banda en el resultado", () => {
    const r = computeHamiltonAllocation(UNEQUAL_MATRIX, 100);
    const resultBands = r.cells.map((c) => c.ageBand);
    const inputBands = UNEQUAL_MATRIX.map((c) => c.ageBand);
    expect(resultBands).toEqual(inputBands);
  });
});

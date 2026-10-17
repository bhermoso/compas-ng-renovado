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

// ── Test con cifras grandes (escala ciudad) ────────────────────────────────────
//
// Total = 500.000 adultos, N = 385 (Cochran 95 % ±5 % sobre ~15.000).
// Con aritmética entera: resto_i = (pop_i × 385) % 500.000 — exacto.
// Con coma flotante: los restos de 65+/female (0,86) y 45-64/male (0,85) difieren
// en 0,01 pp; la comparación entera (430.000 vs 425.000) es inequívoca.
//
// Valores esperados calculados y verificados con Node.js (autocontenidos):
//   band 16-44: male=125000→96, female=120000→92
//   band 45-64: male=105000→81, female=110000→85
//   band 65+:   male= 22000→17, female= 18000→14
//   sum = 385 ✓
describe("computeHamiltonAllocation — cifras grandes (escala ciudad)", () => {
  const CITY_MATRIX: AgeSexCell[] = [
    { ageBand: "16-44", male: 125_000, female: 120_000 },
    { ageBand: "45-64", male: 105_000, female: 110_000 },
    { ageBand: "65+",   male:  22_000, female:  18_000 },
  ];
  const N = 385;

  it("suma exacta = N = 385", () => {
    const r = computeHamiltonAllocation(CITY_MATRIX, N);
    expect(r.checksum).toBe(N);
  });

  it("asignación correcta por banda verificada con restos enteros", () => {
    const r = computeHamiltonAllocation(CITY_MATRIX, N);

    const band1644 = r.cells.find((c) => c.ageBand === "16-44")!;
    expect(band1644.male).toBe(96);
    expect(band1644.female).toBe(92);

    const band4564 = r.cells.find((c) => c.ageBand === "45-64")!;
    expect(band4564.male).toBe(81);
    expect(band4564.female).toBe(85);

    const band65 = r.cells.find((c) => c.ageBand === "65+")!;
    expect(band65.male).toBe(17);
    expect(band65.female).toBe(14);
  });

  it("las 4 unidades extra van a las celdas de mayor resto entero", () => {
    // Restos enteros: 65+/male=470000 > 65+/female=430000 > 45-64/male=425000
    //   > 45-64/female=350000 > 16-44/female=200000 > 16-44/male=125000.
    // Las celdas que reciben +1 son las primeras 4: 65+, 45-64 (ambos sexos).
    const r = computeHamiltonAllocation(CITY_MATRIX, N);
    const band65 = r.cells.find((c) => c.ageBand === "65+")!;
    const band4564 = r.cells.find((c) => c.ageBand === "45-64")!;
    const band1644 = r.cells.find((c) => c.ageBand === "16-44")!;

    // 65+ recibió +1 en ambos sexos (restos 470000 y 430000)
    expect(band65.male   - Math.floor(22_000 * N / 500_000)).toBe(1);
    expect(band65.female - Math.floor(18_000 * N / 500_000)).toBe(1);
    // 45-64 recibió +1 en ambos sexos (restos 425000 y 350000)
    expect(band4564.male   - Math.floor(105_000 * N / 500_000)).toBe(1);
    expect(band4564.female - Math.floor(110_000 * N / 500_000)).toBe(1);
    // 16-44 no recibió extras (restos 200000 y 125000, fuera del top-4)
    expect(band1644.male   - Math.floor(125_000 * N / 500_000)).toBe(0);
    expect(band1644.female - Math.floor(120_000 * N / 500_000)).toBe(0);
  });

  it("todas las celdas son enteros no negativos (cifras grandes)", () => {
    const r = computeHamiltonAllocation(CITY_MATRIX, N);
    for (const c of r.cells) {
      expect(Number.isInteger(c.male)).toBe(true);
      expect(Number.isInteger(c.female)).toBe(true);
      expect(c.male).toBeGreaterThanOrEqual(0);
      expect(c.female).toBeGreaterThanOrEqual(0);
    }
  });
});

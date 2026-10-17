/**
 * tests/sam-population-reference.test.ts
 *
 * Pieza 1: extensión de PopulationReference con ageSexMatrix opcional.
 *
 * Verifica:
 * - El campo ageSexMatrix es aditivo: referencias sin él siguen compilando y
 *   funcionando sin cambios (compatibilidad hacia atrás).
 * - Una referencia CON ageSexMatrix es válida y su suma coincide con populationTotal.
 * - El campo es opcional: su ausencia no invalida el objeto.
 * - Los fixtures de Atarfe existentes siguen siendo válidos (no regresión).
 */

import { describe, it, expect } from "vitest";
import type { PopulationReference, AgeSexCell } from "../src/domain/sam/PopulationReference";
import { ATARFE_POPULATION_2022 } from "../fixtures/population/atarfe-population-2022";
import { ATARFE_UNDER16_POPULATION_2025 } from "../fixtures/population/atarfe-under16-population-2025";

// Referencia sintética con desglose por sexo (datos inventados solo para el test,
// coherentes internamente: sum(male+female) == populationTotal).
const SYNTHETIC_WITH_MATRIX: PopulationReference = {
  municipalityId: "00001",
  municipalityCode: "00001",
  source: "Padrón Municipal — INE, test sintético",
  year: 2022,
  populationTotal: 1_000,
  ageGroupLabel: "16 años y más",
  extractedAt: "2026-01-01",
  ageSexMatrix: [
    { ageBand: "16-29", male: 130, female: 120 },
    { ageBand: "30-44", male: 145, female: 155 },
    { ageBand: "45-64", male: 160, female: 165 },
    { ageBand: "65-74", male:  60, female:  65 },
  ],
};

describe("PopulationReference — ageSexMatrix (pieza 1)", () => {
  it("referencia SIN ageSexMatrix compila y es válida", () => {
    expect(ATARFE_POPULATION_2022.populationTotal).toBe(15_472);
    expect(ATARFE_POPULATION_2022.ageSexMatrix).toBeUndefined();
  });

  it("referencia CON ageSexMatrix es válida y la suma coincide con populationTotal", () => {
    const matrix = SYNTHETIC_WITH_MATRIX.ageSexMatrix!;
    const total = matrix.reduce((s, c) => s + c.male + c.female, 0);
    expect(total).toBe(SYNTHETIC_WITH_MATRIX.populationTotal);
  });

  it("cada celda AgeSexCell tiene ageBand no vacío y valores no negativos", () => {
    for (const cell of SYNTHETIC_WITH_MATRIX.ageSexMatrix!) {
      expect(cell.ageBand.length).toBeGreaterThan(0);
      expect(cell.male).toBeGreaterThanOrEqual(0);
      expect(cell.female).toBeGreaterThanOrEqual(0);
    }
  });

  it("el campo es opcional: fixtures existentes de Atarfe siguen siendo válidos", () => {
    // Ningún fixture existente incluye ageSexMatrix — eso está documentado.
    expect(ATARFE_POPULATION_2022.ageSexMatrix).toBeUndefined();
    expect(ATARFE_UNDER16_POPULATION_2025.ageSexMatrix).toBeUndefined();
  });

  it("populationTotal de los fixtures existentes no ha cambiado", () => {
    expect(ATARFE_POPULATION_2022.populationTotal).toBe(15_472);
    expect(ATARFE_UNDER16_POPULATION_2025.populationTotal).toBe(2_323);
  });

  it("la interfaz acepta una referencia con celdas a cero en algún sexo", () => {
    const ref: PopulationReference = {
      ...SYNTHETIC_WITH_MATRIX,
      ageSexMatrix: [
        { ageBand: "16-29", male: 250, female: 250 },
        { ageBand: "90+",   male: 0,   female: 0   }, // celda vacía — es válida
      ],
      populationTotal: 500, // solo cuenta las no vacías en la práctica
    };
    expect(ref.ageSexMatrix![1].male).toBe(0);
    expect(ref.ageSexMatrix![1].female).toBe(0);
  });
});

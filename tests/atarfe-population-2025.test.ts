/**
 * tests/atarfe-population-2025.test.ts
 *
 * Pruebas del fixture ATARFE_POPULATION_2025:
 *   1. Coherencia interna: male + female = total del CSV por banda.
 *   2. Suma de todas las celdas === populationTotal (20.952).
 *   3. Concordancia con el CSV fuente (si está disponible).
 *   4. computeHamiltonAllocation(ageSexMatrix, 811) → checksum === 811.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { ATARFE_POPULATION_2025 } from "../fixtures/population/atarfe-population-2025";
import { computeHamiltonAllocation } from "../src/application/sam/computeHamiltonAllocation";

const CSV_PATH =
  "C:/Users/blash/compas-analisis/analisis/datos/atarfe_padron_2025_quinquenal_sexo.csv";

// Totales del CSV fuente (banda → total del CSV, para verificación interna)
const CSV_TOTALS: Record<string, { male: number; female: number; total: number }> = {
  "0-4":   { male:   533, female:   482, total: 1_015 },
  "5-9":   { male:   683, female:   648, total: 1_331 },
  "10-14": { male:   733, female:   668, total: 1_401 },
  "15-19": { male:   667, female:   652, total: 1_319 },
  "20-24": { male:   559, female:   521, total: 1_080 },
  "25-29": { male:   548, female:   562, total: 1_110 },
  "30-34": { male:   738, female:   708, total: 1_446 },
  "35-39": { male:   794, female:   816, total: 1_610 },
  "40-44": { male:   937, female: 1_000, total: 1_937 },
  "45-49": { male:   991, female:   931, total: 1_922 },
  "50-54": { male:   810, female:   727, total: 1_537 },
  "55-59": { male:   660, female:   630, total: 1_290 },
  "60-64": { male:   559, female:   587, total: 1_146 },
  "65-69": { male:   447, female:   513, total:   960 },
  "70-74": { male:   344, female:   366, total:   710 },
  "75-79": { male:   227, female:   262, total:   489 },
  "80-84": { male:   141, female:   190, total:   331 },
  "85-89": { male:    64, female:   117, total:   181 },
  "90-94": { male:    35, female:    81, total:   116 },
  "95-99": { male:     4, female:    14, total:    18 },
  "100+":  { male:     2, female:     1, total:     3 },
};

const matrix = ATARFE_POPULATION_2025.ageSexMatrix!;

describe("ATARFE_POPULATION_2025 — coherencia interna", () => {
  it("tiene exactamente 21 bandas", () => {
    expect(matrix.length).toBe(21);
  });

  it("para cada banda: male + female === total del CSV", () => {
    for (const cell of matrix) {
      const expected = CSV_TOTALS[cell.ageBand];
      expect(expected, `Banda desconocida en fixture: ${cell.ageBand}`).toBeDefined();
      expect(cell.male + cell.female).toBe(expected.total);
    }
  });

  it("suma de todas las celdas === populationTotal (20.952)", () => {
    const sum = matrix.reduce((s, c) => s + c.male + c.female, 0);
    expect(sum).toBe(20_952);
    expect(sum).toBe(ATARFE_POPULATION_2025.populationTotal);
  });

  it("hombres totales === 10.476", () => {
    const totalMale = matrix.reduce((s, c) => s + c.male, 0);
    expect(totalMale).toBe(10_476);
  });

  it("mujeres totales === 10.476", () => {
    const totalFemale = matrix.reduce((s, c) => s + c.female, 0);
    expect(totalFemale).toBe(10_476);
  });
});

describe("ATARFE_POPULATION_2025 — concordancia con CSV fuente", () => {
  const csvAvailable = existsSync(CSV_PATH);

  it.skipIf(!csvAvailable)(
    "cada celda del fixture coincide exactamente con el CSV fuente",
    () => {
      const raw = readFileSync(CSV_PATH, "utf-8");
      const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
      // Omitir cabecera
      const csvRows = lines.slice(1).map((line) => {
        const [banda, hombres, mujeres, total] = line.split(",");
        return {
          banda: banda.trim(),
          male: parseInt(hombres, 10),
          female: parseInt(mujeres, 10),
          total: parseInt(total, 10),
        };
      });

      expect(csvRows.length).toBe(21);

      for (const row of csvRows) {
        const cell = matrix.find((c) => c.ageBand === row.banda);
        expect(cell, `Banda ${row.banda} del CSV no encontrada en el fixture`).toBeDefined();
        expect(cell!.male).toBe(row.male);
        expect(cell!.female).toBe(row.female);
      }
    }
  );

  it.skipIf(csvAvailable)(
    "CSV fuente no disponible — test de concordancia omitido",
    () => {
      // Si el CSV no existe, se omite con mensaje claro.
      expect.fail(
        `CSV fuente no encontrado en ${CSV_PATH}. Test de concordancia omitido intencionalmente.`
      );
    }
  );
});

describe("ATARFE_POPULATION_2025 — afijación Hamilton (n = 811)", () => {
  it("computeHamiltonAllocation(ageSexMatrix, 811) → checksum === 811", () => {
    const result = computeHamiltonAllocation(matrix, 811);
    expect(result.checksum).toBe(811);
    expect(result.nTheoretical).toBe(811);
    expect(result.cells.length).toBe(matrix.length);
  });

  it("todas las asignaciones son enteros no negativos", () => {
    const result = computeHamiltonAllocation(matrix, 811);
    for (const cell of result.cells) {
      expect(Number.isInteger(cell.male)).toBe(true);
      expect(Number.isInteger(cell.female)).toBe(true);
      expect(cell.male).toBeGreaterThanOrEqual(0);
      expect(cell.female).toBeGreaterThanOrEqual(0);
    }
  });

  it("la suma de cada banda (male + female) es coherente con el checksum total", () => {
    const result = computeHamiltonAllocation(matrix, 811);
    const bandSums = result.cells.map((c) => c.male + c.female);
    const total = bandSums.reduce((s, v) => s + v, 0);
    expect(total).toBe(811);
  });
});

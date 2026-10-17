/**
 * tests/sam-representativeness-integration.test.ts
 *
 * Pieza 4: integración de representatividad en SampleQualityAssessment.
 *
 * Verifica:
 * - enrichWithRepresentativeness añade el campo representativeness solo cuando
 *   ageSexMatrix está presente en la referencia.
 * - Sin ageSexMatrix, el dictamen sale idéntico (no regresión).
 * - Con ageSexMatrix, el campo representativeness es coherente con
 *   computeCellRepresentativeness (mismo resultado que la función pura).
 * - Los tests SAM existentes (sam.test.ts, sam-integration.test.ts) no se ven
 *   afectados — se comprueba aquí via reutilización directa del motor.
 */

import { describe, it, expect } from "vitest";
import { enrichWithRepresentativeness } from "../src/application/sam/assessStudies";
import { computeSampleQualityAssessment } from "../src/application/sam/computeSampleQualityAssessment";
import { computeHamiltonAllocation } from "../src/application/sam/computeHamiltonAllocation";
import { computeCellRepresentativeness } from "../src/application/sam/computeCellRepresentativeness";
import type { PopulationReference } from "../src/domain/sam/PopulationReference";
import type { AgeSexCell } from "../src/domain/sam/PopulationReference";

// ── Referencia SIN ageSexMatrix (comportamiento actual no cambia) ─────────────
const REF_SCALAR: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "Padrón Municipal de Habitantes — INE, 1 de enero de 2022",
  year: 2022,
  populationTotal: 15_472,
  ageGroupLabel: "16 años y más",
  extractedAt: "2026-06-29",
};

// ── Referencia CON ageSexMatrix (sintética, suma = 1000) ─────────────────────
const MATRIX: AgeSexCell[] = [
  { ageBand: "16-29", male: 130, female: 120 },
  { ageBand: "30-44", male: 145, female: 155 },
  { ageBand: "45-64", male: 160, female: 165 },
  { ageBand: "65-74", male:  60, female:  65 },
];

const REF_WITH_MATRIX: PopulationReference = {
  ...REF_SCALAR,
  populationTotal: 1_000,
  ageSexMatrix: MATRIX,
};

// Muestra observada desigual (para tener algo que comparar con la teórica).
const OBSERVED: AgeSexCell[] = [
  { ageBand: "16-29", male: 14, female: 13 },
  { ageBand: "30-44", male: 18, female: 17 },
  { ageBand: "45-64", male: 22, female: 21 },
  { ageBand: "65-74", male:  7, female:  8 },
];

const BASE_ASSESSMENT = computeSampleQualityAssessment({
  instrumentId: "test-instrument",
  municipalityId: "18022",
  nObserved: 120,
  populationReference: REF_SCALAR,
});

describe("enrichWithRepresentativeness — sin ageSexMatrix", () => {
  it("devuelve el dictamen sin representativeness cuando no hay ageSexMatrix", () => {
    const enriched = enrichWithRepresentativeness(BASE_ASSESSMENT, OBSERVED);
    expect(enriched.representativeness).toBeUndefined();
  });

  it("todos los campos del dictamen original permanecen intactos", () => {
    const enriched = enrichWithRepresentativeness(BASE_ASSESSMENT, OBSERVED);
    expect(enriched.instrumentId).toBe(BASE_ASSESSMENT.instrumentId);
    expect(enriched.nObserved).toBe(BASE_ASSESSMENT.nObserved);
    expect(enriched.nTheoretical).toBe(BASE_ASSESSMENT.nTheoretical);
    expect(enriched.coverageGlobal).toBe(BASE_ASSESSMENT.coverageGlobal);
    expect(enriched.sampleQuality).toBe(BASE_ASSESSMENT.sampleQuality);
    expect(enriched.requiresHumanValidation).toBe(true);
  });
});

describe("enrichWithRepresentativeness — con ageSexMatrix", () => {
  const ASSESSMENT_WITH_MATRIX = computeSampleQualityAssessment({
    instrumentId: "test-instrument",
    municipalityId: "18022",
    nObserved: 120,
    populationReference: REF_WITH_MATRIX,
  });

  it("añade representativeness cuando hay ageSexMatrix", () => {
    const enriched = enrichWithRepresentativeness(
      ASSESSMENT_WITH_MATRIX,
      OBSERVED
    );
    expect(enriched.representativeness).toBeDefined();
  });

  it("representativeness.cells tiene 2 celdas × 4 bandas = 8 semi-celdas", () => {
    const enriched = enrichWithRepresentativeness(
      ASSESSMENT_WITH_MATRIX,
      OBSERVED
    );
    expect(enriched.representativeness!.cells).toHaveLength(8);
  });

  it("representativeness coincide con el cálculo directo de las funciones puras", () => {
    const enriched = enrichWithRepresentativeness(
      ASSESSMENT_WITH_MATRIX,
      OBSERVED
    );
    // Reproducimos el mismo cálculo manualmente.
    const hamilton = computeHamiltonAllocation(
      MATRIX,
      ASSESSMENT_WITH_MATRIX.nTheoretical
    );
    const expected = computeCellRepresentativeness(hamilton.cells, OBSERVED);

    expect(enriched.representativeness!.maePp).toBeCloseTo(expected.maePp, 8);
    expect(enriched.representativeness!.pctWithinTolerance).toBe(
      expected.pctWithinTolerance
    );
    expect(enriched.representativeness!.qualityLabel).toBe(
      expected.qualityLabel
    );
  });

  it("los campos originales del dictamen permanecen intactos", () => {
    const enriched = enrichWithRepresentativeness(
      ASSESSMENT_WITH_MATRIX,
      OBSERVED
    );
    expect(enriched.instrumentId).toBe(ASSESSMENT_WITH_MATRIX.instrumentId);
    expect(enriched.nTheoretical).toBe(ASSESSMENT_WITH_MATRIX.nTheoretical);
    expect(enriched.sampleQuality).toBe(ASSESSMENT_WITH_MATRIX.sampleQuality);
    expect(enriched.requiresHumanValidation).toBe(true);
  });
});

describe("no-regresión: motor Cochran + cobertura no se modifica", () => {
  it("computeSampleQualityAssessment con referencia sin matriz produce salida idéntica a master", () => {
    const result = computeSampleQualityAssessment({
      instrumentId: "duke-eas",
      municipalityId: "18022",
      nObserved: 3028,
      populationReference: REF_SCALAR,
    });
    // nTheoretical = 375 (Cochran + FPC sobre N=15.472), coverageGlobal > 100
    expect(result.nTheoretical).toBe(375);
    expect(result.coverageGlobal).toBeGreaterThan(100);
    expect(result.sampleQuality).toBe("high");
    expect(result.representativeness).toBeUndefined();
  });
});

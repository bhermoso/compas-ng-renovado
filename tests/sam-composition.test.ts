/**
 * tests/sam-composition.test.ts
 *
 * computeSampleComposition y enrichWithComposition: SAM describe la composición
 * por edad y sexo de la muestra frente al padrón y no la califica.
 */

import { describe, it, expect } from "vitest";
import { computeSampleComposition } from "../src/application/sam/computeSampleComposition";
import { enrichWithComposition } from "../src/application/sam/assessStudies";
import { computeSampleQualityAssessment } from "../src/application/sam/computeSampleQualityAssessment";
import type { AgeSexCell, PopulationReference } from "../src/domain/sam/PopulationReference";

// Padrón de 1.000 habitantes; la muestra no tiene a nadie de 0-14 ni mujeres de 65-74.
const POP: AgeSexCell[] = [
  { ageBand: "0-14", male: 50, female: 50 },
  { ageBand: "15-44", male: 200, female: 200 },
  { ageBand: "45-64", male: 150, female: 150 },
  { ageBand: "65-74", male: 100, female: 100 },
];
const OBS: AgeSexCell[] = [
  { ageBand: "0-14", male: 0, female: 0 },
  { ageBand: "15-44", male: 10, female: 30 },
  { ageBand: "45-64", male: 10, female: 40 },
  { ageBand: "65-74", male: 10, female: 0 },
];

describe("computeSampleComposition", () => {
  const c = computeSampleComposition(POP, OBS);

  it("calcula porcentajes sobre cada total y la diferencia en puntos", () => {
    const f1544 = c.cells.find((x) => x.ageBand === "15-44" && x.sex === "female")!;
    expect(f1544.populationCount).toBe(200);
    expect(f1544.observedCount).toBe(30);
    expect(f1544.pctPopulation).toBeCloseTo(20, 10);
    expect(f1544.pctAchieved).toBeCloseTo(30, 10);
    expect(f1544.diffPp).toBeCloseTo(10, 10);
    expect(c.populationTotal).toBe(1000);
    expect(c.observedTotal).toBe(100);
  });

  it("declara las bandas con población y sin respuestas", () => {
    expect(c.bandsWithoutResponses).toEqual(["0-14"]);
  });

  it("declara aparte las semi-celdas vacías de bandas con respuestas", () => {
    expect(c.cellsWithoutResponses).toEqual([{ ageBand: "65-74", sex: "female" }]);
  });

  it("da el reparto por sexo de población y muestra", () => {
    expect(c.sex.female.pctAchieved).toBeCloseTo(70, 10);
    expect(c.sex.female.pctPopulation).toBeCloseTo(50, 10);
    expect(c.sex.male.pctAchieved).toBeCloseTo(30, 10);
  });

  it("da la primera y la última banda con respuestas", () => {
    expect(c.observedBandSpan).toEqual({ first: "15-44", last: "65-74" });
  });

  it("no emite etiqueta ni índice resumen de representatividad", () => {
    const keys = Object.keys(c);
    for (const k of ["qualityLabel", "maePp", "pctWithinTolerance", "tolerancePp"]) {
      expect(keys).not.toContain(k);
    }
  });

  it("semi-celda sin población: diferencia null y no se declara vacía", () => {
    const r = computeSampleComposition(
      [{ ageBand: "A", male: 0, female: 10 }],
      [{ ageBand: "A", male: 0, female: 5 }]
    );
    expect(r.cells[0].diffPp).toBeNull();
    expect(r.cellsWithoutResponses).toEqual([]);
    expect(r.bandsWithoutResponses).toEqual([]);
  });

  it("sin respuestas: porcentajes a cero y sin bandas con respuesta", () => {
    const r = computeSampleComposition(POP, POP.map((p) => ({ ...p, male: 0, female: 0 })));
    expect(r.observedBandSpan).toBeNull();
    expect(r.bandsWithoutResponses).toHaveLength(4);
  });

  it("rechaza bandas desalineadas", () => {
    expect(() => computeSampleComposition(POP, OBS.slice(1))).toThrow(RangeError);
    expect(() =>
      computeSampleComposition(POP, OBS.map((o, i) => (i === 1 ? { ...o, ageBand: "x" } : o)))
    ).toThrow(RangeError);
  });
});

describe("enrichWithComposition", () => {
  const REF: PopulationReference = {
    municipalityId: "18999",
    municipalityCode: "18999",
    source: "Fuente de prueba",
    year: 2025,
    populationTotal: 1000,
    ageGroupLabel: "todas las edades",
    extractedAt: "2026-10-26",
  };
  const base = computeSampleQualityAssessment({
    instrumentId: "t",
    municipalityId: "18999",
    nObserved: 100,
    populationReference: { ...REF, ageSexMatrix: POP },
  });

  it("añade la composición y conserva el dictamen de tamaño", () => {
    const e = enrichWithComposition(base, OBS);
    expect(e.composition).toEqual(computeSampleComposition(POP, OBS));
    expect(e.nTheoretical).toBe(base.nTheoretical);
    expect(e.sampleQuality).toBe(base.sampleQuality);
  });

  it("sin padrón por edad y sexo devuelve el dictamen sin composición", () => {
    const plain = computeSampleQualityAssessment({
      instrumentId: "t",
      municipalityId: "18999",
      nObserved: 100,
      populationReference: REF,
    });
    expect(enrichWithComposition(plain, OBS).composition).toBeUndefined();
  });
});

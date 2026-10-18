/**
 * SamTriPyramid — presentación de población, afijación ideal y muestra conseguida.
 * Casos: con datos completos, sin padrón por edad y sexo, sin edad y sexo en la
 * muestra, bandas incoherentes y ausencia de evaluación.
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SamTriPyramid } from "../src/ui/components/SamTriPyramid";
import { buildSamTriPyramidRows } from "../src/ui/components/samTriPyramidRows";
import { enrichWithRepresentativeness } from "../src/application/sam/assessStudies";
import { computeSampleQualityAssessment } from "../src/application/sam/computeSampleQualityAssessment";
import type { AgeSexCell, PopulationReference } from "../src/domain/sam/PopulationReference";

const MATRIX: AgeSexCell[] = [
  { ageBand: "16-29", male: 130, female: 120 },
  { ageBand: "30-44", male: 145, female: 155 },
  { ageBand: "45-64", male: 160, female: 165 },
  { ageBand: "65-74", male: 60, female: 65 },
];
const OBSERVED: AgeSexCell[] = [
  { ageBand: "16-29", male: 14, female: 13 },
  { ageBand: "30-44", male: 18, female: 17 },
  { ageBand: "45-64", male: 22, female: 21 },
  { ageBand: "65-74", male: 7, female: 8 },
];
const REF: PopulationReference = {
  municipalityId: "18022",
  municipalityCode: "18022",
  source: "Fuente de prueba",
  year: 2025,
  populationTotal: 1_000,
  ageGroupLabel: "16 a 74 años",
  extractedAt: "2026-10-18",
};
const render = (a: Parameters<typeof SamTriPyramid>[0]["assessment"]) =>
  renderToStaticMarkup(createElement(SamTriPyramid, { assessment: a }));
const base = (ref: PopulationReference) =>
  computeSampleQualityAssessment({
    instrumentId: "t",
    municipalityId: "18022",
    nObserved: 120,
    populationReference: ref,
  });

describe("SamTriPyramid", () => {
  it("con padrón y muestra por edad y sexo dibuja tres pirámides y el detalle", () => {
    const a = enrichWithRepresentativeness(base({ ...REF, ageSexMatrix: MATRIX }), OBSERVED);
    const html = render(a);
    expect(html).toContain("Población");
    expect(html).toContain("Afijación ideal");
    expect(html).toContain("Muestra conseguida");
    expect(html).toContain("16-29");
    expect(html).toContain("Requiere validación humana");
    expect(html).not.toContain("No evaluable");
  });

  it("las filas reproducen el padrón y la afijación Hamilton sin alterarlos", () => {
    const a = enrichWithRepresentativeness(base({ ...REF, ageSexMatrix: MATRIX }), OBSERVED);
    const built = buildSamTriPyramidRows(a);
    if (!("rows" in built)) throw new Error("debía ser evaluable");
    expect(built.rows.map((r) => [r.popMale, r.popFemale])).toEqual(
      MATRIX.map((m) => [m.male, m.female])
    );
    const idealTotal = built.rows.reduce((s, r) => s + r.idealMale + r.idealFemale, 0);
    expect(idealTotal).toBe(a.nTheoretical);
  });

  it("sin padrón por edad y sexo muestra «No evaluable» y no dibuja pirámides", () => {
    const html = render(base(REF));
    expect(html).toContain("No evaluable");
    expect(html).toContain("padrón");
    expect(html).not.toContain("sam-tripyramid__bars");
  });

  it("con padrón pero sin edad y sexo en la muestra muestra «No evaluable»", () => {
    const html = render(base({ ...REF, ageSexMatrix: MATRIX }));
    expect(html).toContain("No evaluable");
    expect(html).toContain("edad y sexo de los participantes");
    expect(html).not.toContain("sam-tripyramid__bars");
  });

  it("sin evaluación muestra «No evaluable»", () => {
    expect(render(null)).toContain("No evaluable");
    expect(render(undefined)).toContain("No evaluable");
  });

  it("bandas de la muestra que no coinciden con el padrón: no evaluable", () => {
    const a = enrichWithRepresentativeness(base({ ...REF, ageSexMatrix: MATRIX }), OBSERVED);
    const tampered = {
      ...a,
      representativeness: {
        ...a.representativeness!,
        cells: a.representativeness!.cells.map((c) => ({ ...c, ageBand: "x-" + c.ageBand })),
      },
    };
    expect("notEvaluable" in buildSamTriPyramidRows(tampered)).toBe(true);
  });

  it("una desviación que redondea a cero no lleva signo", () => {
    const a = enrichWithRepresentativeness(base({ ...REF, ageSexMatrix: MATRIX }), OBSERVED);
    const html = renderToStaticMarkup(createElement(SamTriPyramid, { assessment: a }));
    expect(html).not.toMatch(/[−+]0,0 pp/);
  });

  it("no usa colores literales en el CSS del componente", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("src/ui/components/SamTriPyramid.css", "utf8");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgba?\(/);
  });
});

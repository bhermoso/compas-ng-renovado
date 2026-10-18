/**
 * assessSample + SamAssessmentPanel: SAM aplicado a cualquier muestra.
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import {
  assessSample,
  parseAgeBandLabel,
  restrictReferenceToAgeRange,
  type SampleRecord,
} from "../src/application/sam/assessSample";
import { SamAssessmentPanel } from "../src/ui/components/SamAssessmentPanel";
import { ATARFE_POPULATION_2025 } from "../fixtures/population/atarfe-population-2025";
import type { PopulationReference } from "../src/domain/sam/PopulationReference";

const MATRIX = ATARFE_POPULATION_2025.ageSexMatrix!;

/** Registros que reproducen exactamente la distribución del padrón a escala 1/50. */
function recordsProportional(): SampleRecord[] {
  const out: SampleRecord[] = [];
  for (const c of MATRIX) {
    const band = parseAgeBandLabel(c.ageBand)!;
    const age = band.min;
    for (let i = 0; i < Math.round(c.male / 50); i++) out.push({ sex: "1", age });
    for (let i = 0; i < Math.round(c.female / 50); i++) out.push({ sex: "2", age });
  }
  return out;
}
const render = (r: ReturnType<typeof assessSample>) =>
  renderToStaticMarkup(createElement(SamAssessmentPanel, { result: r, title: "Prueba" }));

describe("parseAgeBandLabel", () => {
  it("reconoce rangos y bandas abiertas", () => {
    expect(parseAgeBandLabel("15-19")).toMatchObject({ min: 15, max: 19 });
    expect(parseAgeBandLabel("100+")).toMatchObject({ min: 100, max: Infinity });
    expect(parseAgeBandLabel("adultos")).toBeNull();
  });
});

describe("restrictReferenceToAgeRange", () => {
  it("suma solo bandas completas dentro del rango", () => {
    const r = restrictReferenceToAgeRange(ATARFE_POPULATION_2025, { min: 20, max: 99 });
    if (!("reference" in r)) throw new Error(r.reason);
    const expected = MATRIX.filter((c) => {
      const b = parseAgeBandLabel(c.ageBand)!;
      return b.min >= 20 && b.max <= 99;
    }).reduce((s, c) => s + c.male + c.female, 0);
    expect(r.reference.populationTotal).toBe(expected);
    expect(r.reference.ageSexMatrix!.length).toBe(16);
  });
  it("rechaza un rango que corta una banda", () => {
    const r = restrictReferenceToAgeRange(ATARFE_POPULATION_2025, { min: 16, max: 99 });
    expect("reason" in r && r.reason).toContain("15-19");
  });
});

describe("assessSample", () => {
  it("muestra proporcional al padrón: evaluable, con representatividad", () => {
    const records = recordsProportional();
    const r = assessSample({ instrumentId: "t", municipalityId: "atarfe", records });
    expect(r.status).toBe("evaluable");
    if (r.status !== "evaluable") return;
    expect(r.assessment.nObserved).toBe(records.length);
    expect(r.assessment.representativeness).toBeDefined();
    expect(r.assessment.representativeness!.maePp).toBeLessThan(0.5);
    expect(r.representativenessNote).toBeUndefined();
  });

  it("solo n, sin registros: dictamen de tamaño y representatividad no evaluable", () => {
    const r = assessSample({ instrumentId: "t", municipalityId: "atarfe", nObserved: 400 });
    if (r.status !== "evaluable") throw new Error("debía ser evaluable");
    expect(r.assessment.representativeness).toBeUndefined();
    expect(r.representativenessNote).toContain("registros individuales");
  });

  it("municipio sin referencia: no evaluable, sin estimar", () => {
    const r = assessSample({ instrumentId: "t", municipalityId: "loja", nObserved: 400 });
    expect(r.status).toBe("not-evaluable");
    expect(render(r)).toContain("No evaluable");
  });

  it("sin n ni registros: no evaluable", () => {
    const r = assessSample({ instrumentId: "t", municipalityId: "atarfe" });
    expect(r.status).toBe("not-evaluable");
  });

  it("registros sin sexo se declaran y no se imputan", () => {
    const records: SampleRecord[] = [...recordsProportional(), { age: 40 }, { age: 41, sex: "9" }];
    const r = assessSample({ instrumentId: "t", municipalityId: "atarfe", records });
    if (r.status !== "evaluable") throw new Error("debía ser evaluable");
    expect(r.observed!.unassignableBreakdown.noSex).toBe(2);
    expect(r.notes.join(" ")).toContain("2 de");
    expect(r.assessment.nObserved).toBe(records.length);
  });

  it("registros sin edad ni sexo reconocibles: representatividad no evaluable", () => {
    const r = assessSample({
      instrumentId: "t",
      municipalityId: "atarfe",
      records: [{ sex: "x" }, { sex: "y" }],
    });
    if (r.status !== "evaluable") throw new Error("debía ser evaluable");
    expect(r.representativenessNote).toContain("ningún registro");
  });

  it("rango de edad con bandas completas compara con el padrón recortado", () => {
    const records = recordsProportional().filter((x) => (x.age as number) >= 20);
    const r = assessSample({
      instrumentId: "t",
      municipalityId: "atarfe",
      records,
      ageRange: { min: 20, max: 99 },
    });
    if (r.status !== "evaluable") throw new Error("debía ser evaluable");
    expect(r.assessment.populationReference.ageSexMatrix!.length).toBe(16);
    expect(r.assessment.representativeness!.maePp).toBeLessThan(1);
  });

  it("referencia explícita sin desglose: solo dictamen de tamaño", () => {
    const ref: PopulationReference = { ...ATARFE_POPULATION_2025, ageSexMatrix: undefined };
    const r = assessSample({
      instrumentId: "t",
      municipalityId: "atarfe",
      nObserved: 300,
      populationReference: ref,
    });
    if (r.status !== "evaluable") throw new Error("debía ser evaluable");
    expect(r.representativenessNote).toContain("padrón");
  });
});

describe("SamAssessmentPanel", () => {
  it("con datos completos muestra cifras, tripirámide y aviso de validación humana", () => {
    const r = assessSample({ instrumentId: "t", municipalityId: "atarfe", records: recordsProportional() });
    const html = render(r);
    expect(html).toContain("Muestra teórica");
    expect(html).toContain("Tripirámide muestral");
    expect(html).toContain("Requiere validación humana");
    expect(html).not.toContain("No evaluable");
  });
  it("sin registros muestra las cifras y declara la representatividad no evaluable", () => {
    const html = render(assessSample({ instrumentId: "t", municipalityId: "atarfe", nObserved: 400 }));
    expect(html).toContain("Muestra teórica");
    expect(html).toContain("No evaluable por edad y sexo");
    expect(html).not.toContain("sam-tripyramid__bars");
  });
  it("el CSS del panel no usa colores literales", () => {
    const css = readFileSync("src/ui/components/SamAssessmentPanel.css", "utf8");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

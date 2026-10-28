import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { assessSample, computeSampleQualityAssessment, enrichWithComposition, describeSAM, samAssessmentToEvidenceAtom, planSAMEvidenceMigration } from "../src/application/sam";
import { profileSAMNotes } from "../src/application/sam/profileSAMNotes";
import { getEvidenceAtomsByConfidence } from "../src/domain/evidence";
import { runEvidenceStoreIntegrityGuard } from "../src/application/evidence";
import { generateLT1 } from "../src/application/lt1";
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import type { PopulationReference } from "../src/domain/sam";
import { ZAGRA_POPULATION_2025 } from "../fixtures/population/zagra-population-2025";
import { SamAssessmentPanel } from "../src/ui/components/SamAssessmentPanel";

const ref: PopulationReference = {
  municipalityId: "test", municipalityCode: "00000", source: "SINTÉTICO — solo pruebas", year: 2025,
  extractedAt: "2026-10-28", ageGroupLabel: "20-29", populationTotal: 1000,
  ageSexMatrix: [{ ageBand: "20-24", male: 250, female: 250 }, { ageBand: "25-29", male: 250, female: 250 }],
};
const compute = (nObserved: number) => computeSampleQualityAssessment({ municipalityId: "test", instrumentId: "test", nObserved, populationReference: ref });

describe("SAM v3 — confianza independiente del tamaño", () => {
  const nTheory = compute(1).nTheoretical;
  it.each([Math.ceil(.6 * nTheory) - 1, Math.ceil(.6 * nTheory), Math.ceil(.6 * nTheory) + 1, nTheory - 1, nTheory, nTheory + 1, 999])("n=%i no asigna nivel por los antiguos umbrales", n => {
    const a = compute(n);
    expect(a.sampleQuality).toBe("not-evaluable");
    expect(a.capabilities.canClassifyQuality).toBe(false);
    expect(samAssessmentToEvidenceAtom(a).confidence).toBe("not-evaluable");
    expect(a.coverageGlobal).toBeCloseTo(n / nTheory * 100);
    expect(a.populationRatioPercent).toBeCloseTo(n / 1000 * 100);
  });
  it("gran muestra desequilibrada conserva ausencias y ambas direcciones de diferencia", () => {
    const a = enrichWithComposition(compute(900), [{ ageBand: "20-24", male: 900, female: 0 }, { ageBand: "25-29", male: 0, female: 0 }]);
    const summary = describeSAM(a);
    expect(summary).toContain("sobrerrepresentación");
    expect(summary).toContain("infrarrepresentación");
    expect(summary).toContain("sin participantes");
    expect(a.composition?.bandsWithoutResponses).toEqual(["25-29"]);
    expect(samAssessmentToEvidenceAtom(a).confidence).toBe("not-evaluable");
  });
  it("pequeña muestra proporcional conserva composición, sin inferir confianza", () => {
    const a = enrichWithComposition(compute(4), ref.ageSexMatrix!.map(c => ({ ...c, male: 1, female: 1 })));
    expect(describeSAM(a)).toContain("La composición coincide");
    expect(a.sampleQuality).toBe("not-evaluable");
  });
  it("cobertura del 98 % verificada se reconoce sin certificar representatividad", () => {
    const a = computeSampleQualityAssessment({ municipalityId: "test", instrumentId: "test", nObserved: 980, populationReference: ref, participationBasis: { uniqueResidents: true, matchingPopulationAndPeriod: true } });
    expect(a.populationCoveragePercent).toBe(98);
    expect(describeSAM(a)).toContain("980 de 1000");
    expect(describeSAM(a)).toContain("constituye una fortaleza");
    expect(describeSAM(a)).toContain("sesgos de selección");
    expect(a.sampleQuality).toBe("not-evaluable");
  });
  it("n/N elevado y n>N sin verificación nunca se presentan como cobertura", () => {
    for (const n of [980, 1100]) {
      const a = compute(n);
      expect(a.populationCoveragePercent).toBeUndefined();
      expect(describeSAM(a)).toContain("Cobertura poblacional: No evaluable");
    }
  });
  it("parámetros personalizados se explican con sus valores efectivos", () => {
    const a = computeSampleQualityAssessment({ municipalityId: "test", instrumentId: "test", nObserved: 50, populationReference: ref, cochranParams: { confidence: .99, marginOfError: .1 } });
    expect(a.sampleQualityRationale).toContain("99 %");
    expect(a.sampleQualityRationale).toContain("±10 %");
  });
  it("sin padrón o con población inválida no inventa resultados", () => {
    expect(assessSample({ instrumentId: "test", municipalityId: "sin-padron", nObserved: 20 }).status).toBe("not-evaluable");
    expect(assessSample({ instrumentId: "test", municipalityId: "test", nObserved: 20, populationReference: { ...ref, populationTotal: 0 } }).status).toBe("not-evaluable");
  });
  it("recuentos demográficos inválidos se explican sin romper la interfaz", () => {
    const r = assessSample({ municipalityId: "test", instrumentId: "test", populationReference: ref, observedCells: [{ ageBand: "20-24", male: -1, female: 1 }] });
    expect(r.status).toBe("not-evaluable");
  });
  it("el intervalo de registros y el denominador deben coincidir", () => {
    const r = assessSample({ instrumentId: "test", municipalityId: "test", populationReference: ref, records: [{ age: 21, sex: "male" }, { age: 26, sex: "female" }], ageRange: { min: 20, max: 24 } });
    expect(r.status).toBe("evaluable");
    if (r.status === "evaluable") {
      expect(r.assessment.nObserved).toBe(1);
      expect(r.assessment.populationReference.populationTotal).toBe(500);
      expect(r.notes.join(" ")).toContain("1 registros fuera");
    }
  });
});

describe("Zagra — límites exactos de los datos reales versionados", () => {
  it("verifica 843 habitantes y no interpola 15–83 desde 80–84", () => {
    const matrix = ZAGRA_POPULATION_2025.ageSexMatrix!;
    const total = (min: number, max: number) => matrix.filter(c => { const age = Number(c.ageBand.split("-")[0]); return age >= min && age <= max; }).reduce((s,c) => s+c.male+c.female, 0);
    expect(total(15, 75)).toBe(692);
    expect(total(15, 80)).toBe(716);
    const r = assessSample({ municipalityId: "zagra", instrumentId: "test", nObserved: 1, ageRange: { min: 15, max: 83 } });
    expect(r.status).toBe("not-evaluable");
    if (r.status === "not-evaluable") expect(r.reasons.join()).toContain("corta la banda 80-84");
  });
});

describe("SAM histórico y filtros", () => {
  it("migración explícita archiva el original y no transfiere su nivel ni su texto", () => {
    const a = { ...compute(100), methodologyVersion: undefined, sampleQuality: "high" as const, sampleQualityRationale: "LEGACY: representatividad moderada" };
    const old = { ...samAssessmentToEvidenceAtom(a), confidence: "high" as const, content: a.sampleQualityRationale, methodology: { description: "legacy", limitations: [], requiresHumanValidation: true } };
    const before = structuredClone(old);
    const plan = planSAMEvidenceMigration(old, a);
    expect(old).toEqual(before);
    expect(plan.previous).toEqual(before);
    expect(plan.replacement.confidence).toBe("not-evaluable");
    expect(plan.replacement.content).not.toContain("LEGACY");
    expect(plan.replacement.methodology.version).toBe("SAM-3.0.0");
    const store = { municipalityId: "test", atoms: [old], createdAt: old.createdAt, updatedAt: old.updatedAt };
    const migrated = { ...store, atoms: [plan.replacement] };
    expect(getEvidenceAtomsByConfidence(store, "high")).toHaveLength(1);
    expect(getEvidenceAtomsByConfidence(migrated, "high")).toHaveLength(0);
    expect(getEvidenceAtomsByConfidence(migrated, "not-evaluable")).toHaveLength(1);
    expect(runEvidenceStoreIntegrityGuard(migrated).valid).toBe(true);
    expect(generateLT1(migrated).supportingEvidenceIds).toEqual(generateLT1(store).supportingEvidenceIds);
  });
  it("interfaz explica confianza y composición separadamente", () => {
    const r = assessSample({ municipalityId: "test", instrumentId: "test", populationReference: ref, observedCells: ref.ageSexMatrix });
    const html = renderToStaticMarkup(createElement(SamAssessmentPanel, { result: r }));
    expect(html).toContain("Confianza metodológica");
    expect(html).toContain("La composición coincide");
    expect(html).not.toContain("representatividad moderada");
  });
});

describe("perfiles reales — sin cambios en datos y conclusiones guardadas", () => {
  it.each([
    ["public/seeds/compas-ng-workspace-atarfe.json", 11],
    ["municipalities/atarfe/exports/compas-ng-workspace-atarfe.json", 11],
    ["public/seeds/compas-ng-workspace-granada-zaidin.json", 56],
    ["municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin.json", 56],
    ["municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin-MANUAL-56-92.json", 56],
    ["municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin-reproducible-minimo.json", 15],
  ] as const)("%s conserva %i evidencias sin átomos SAM ocultos", (path, count) => {
    const raw = readFileSync(path, "utf8");
    const w = JSON.parse(raw) as MunicipalityWorkspace;
    const before = structuredClone(w);
    expect(w.evidenceStore.atoms).toHaveLength(count);
    expect(w.evidenceStore.atoms.filter(a => a.provenance.origin === "sam")).toHaveLength(0);
    const lt1 = generateLT1(w.evidenceStore);
    const notes = profileSAMNotes(w);
    if (path.includes("atarfe")) expect(notes.join()).toContain("No evaluable");
    expect(w).toEqual(before);
    expect(generateLT1(w.evidenceStore)).toEqual(lt1);
    expect(readFileSync(path, "utf8")).toBe(raw);
  });
});

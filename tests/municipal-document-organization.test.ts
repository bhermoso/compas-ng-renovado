import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { organizeMunicipalDocuments, municipalDocumentSection } from "../src/application/municipal-document-organization";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const loadSeed = (municipality: "atarfe"|"loja"): MunicipalityWorkspace =>
  JSON.parse(readFileSync(new URL(`../fixtures/seeds/compas-ng-workspace-${municipality}.json`, import.meta.url), "utf8")) as MunicipalityWorkspace;

describe("Organización real de Atarfe y Loja, sin modificar expedientes", () => {
  it("Atarfe conserva informe, IBSE y activos sin marcos comunes duplicados", () => {
    const w=loadSeed("atarfe");
    const before=JSON.stringify(w);
    const sections=organizeMunicipalDocuments(w.repository.documents);
    const counts=Object.fromEntries(sections.map(s=>[s.id,s.documents.length]));
    expect(counts).toMatchObject({health:1,studies:1,assets:1,plans:0,strategic:0,profile:0});
    expect(sections.flatMap(s=>s.documents.map(d=>d.id))).toHaveLength(3);
    expect(w.ibseStudy).toBeDefined();
    expect(w.evidenceStore.atoms.length).toBeGreaterThan(0);
    expect(JSON.stringify(w)).toBe(before);
  });
  it("Loja conserva ambos informes, los estudios, la priorización y el plan municipal", () => {
    const w=loadSeed("loja");
    const before=JSON.stringify(w);
    const sections=organizeMunicipalDocuments(w.repository.documents);
    const counts=Object.fromEntries(sections.map(s=>[s.id,s.documents.length]));
    expect(counts).toMatchObject({health:1,profile:1,studies:2,prioritization:1,plans:1,strategic:0});
    const plan=w.repository.documents.find(d=>d.id==="doc-action-plan-loja-2022");
    expect(plan?.kind).toBe("strategic-framework"); // clasificación histórica del seed
    expect(municipalDocumentSection(plan!)).toBe("plans"); // lectura municipal, sin migrarlo
    expect(sections.flatMap(s=>s.documents.map(d=>d.id))).toHaveLength(6);
    expect(JSON.stringify(w)).toBe(before);
  });
  it("la organización no oculta ni cambia documentos municipales desconocidos", () => {
    const w=loadSeed("loja");
    const ids=w.repository.documents.map(d=>d.id).sort();
    const grouped=organizeMunicipalDocuments(w.repository.documents).flatMap(s=>s.documents.map(d=>d.id)).sort();
    expect(grouped).toEqual(ids);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import { normalizeKnownMunicipalDocumentKinds, validateHistoricalNormalization } from "../src/application/workspace/normalizeKnownMunicipalDocuments";
import { loadMunicipalitySeed } from "../src/infrastructure/seeds/municipalitySeeds";
import { municipalDocumentSection } from "../src/application/municipal-document-organization";

function source(id: "loja" | "atarfe"): MunicipalityWorkspace {
  return JSON.parse(readFileSync(new URL(`../public/seeds/compas-ng-workspace-${id}.json`,import.meta.url),"utf8")) as MunicipalityWorkspace;
}

describe("Normalización no destructiva de documentos de Loja y Atarfe",()=>{
  it("cambia únicamente el tipo del Plan de Acción municipal de Loja",()=>{
    const initial=source("loja");
    const original=JSON.stringify(initial);
    const result=normalizeKnownMunicipalDocumentKinds(initial);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({
      documentId:"doc-action-plan-loja-2022",fromKind:"strategic-framework",toKind:"territorial-documentation",
    });
    expect(validateHistoricalNormalization(initial,result.workspace)).toBe(true);
    const plan=result.workspace.repository.documents.find(d=>d.id==="doc-action-plan-loja-2022");
    expect(plan?.kind).toBe("territorial-documentation");
    expect(municipalDocumentSection(plan!)).toBe("plans");
    expect(result.workspace.repository.documents).toHaveLength(6);
    expect(JSON.stringify(initial)).toBe(original);
    expect(result.workspace.repository.documents.find(d=>d.id==="doc-prioritisation-loja-2022")?.kind).toBe("qualitative-material");
  });
  it("es idempotente y no clasifica falsos positivos",()=>{
    const corrected=normalizeKnownMunicipalDocumentKinds(source("loja")).workspace;
    const again=normalizeKnownMunicipalDocumentKinds(corrected);
    expect(again.changes).toHaveLength(0);
    expect(again.workspace).toBe(corrected);
    const deceptive=source("loja");
    deceptive.repository.documents.find(d=>d.id==="doc-action-plan-loja-2022")!.sourceFileName="Otro plan.odt";
    expect(normalizeKnownMunicipalDocumentKinds(deceptive).changes).toHaveLength(0);
  });
  it("Atarfe se conserva íntegro, incluidos IBSE y evidencias",()=>{
    const atarfe=source("atarfe");
    const before=JSON.stringify(atarfe);
    const result=normalizeKnownMunicipalDocumentKinds(atarfe);
    expect(result.changes).toHaveLength(0);
    expect(result.workspace).toBe(atarfe);
    expect(JSON.stringify(result.workspace)).toBe(before);
    expect(result.workspace.ibseStudy).toBeDefined();
  });
  it("el loader incorpora la corrección al seed de Loja sin tocar el JSON original",async()=>{
    const loaded=await loadMunicipalitySeed("loja",{baseUrl:"/"});
    expect(loaded?.repository.documents.find(d=>d.id==="doc-action-plan-loja-2022")?.kind).toBe("territorial-documentation");
    expect(source("loja").repository.documents.find(d=>d.id==="doc-action-plan-loja-2022")?.kind).toBe("strategic-framework");
  });
});

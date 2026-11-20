import { describe, expect, it } from "vitest";
import { createMunicipalityContext } from "../src/domain/municipality";
import { createMunicipalityWorkspace } from "../src/domain/workspace";
import { createEvidenceStore } from "../src/domain/evidence";
import { createMunicipalDocumentRepository, addMunicipalDocument } from "../src/domain/repository";
import { auditStrategicMigration } from "../src/application/strategic-migration-audit";
import { STRATEGIC_REFERENCES } from "../src/application/strategic-reference-library";

const municipality=createMunicipalityContext({id:"atarfe",name:"Atarfe",province:"Granada",ineCode:"18022"});
function fixture() {
  let repository=createMunicipalDocumentRepository({municipalityId:"atarfe"});
  repository=addMunicipalDocument(repository,{id:"shared",kind:"strategic-framework",title:"Marco autonómico",source:{url:STRATEGIC_REFERENCES[0].sourcePath}});
  repository=addMunicipalDocument(repository,{id:"local",kind:"strategic-framework",title:"Plan de Salud municipal",territorialScale:"municipio"});
  repository=addMunicipalDocument(repository,{id:"ambiguous",kind:"strategic-framework",title:"Estrategia de Salud Comunitaria de Andalucía",source:{url:"https://example.org/otra-version.pdf"}});
  repository=addMunicipalDocument(repository,{id:"report",kind:"health-report",title:"Informe de Salud"});
  repository=addMunicipalDocument(repository,{id:"revision",kind:"strategic-framework",title:"Versión posterior"});
  repository.documents[4].revisionOf="shared";
  repository.conciliations=[{
    id:"c1",topic:"tema",relation:"not-comparable",
    historical:{documentId:"shared",statement:"histórico"},current:{documentId:"report",statement:"actual"},
    declaredAt:"2026-11-20",
  }];
  const workspace=createMunicipalityWorkspace(municipality,repository,createEvidenceStore("atarfe"));
  workspace.documentOriginals=[{documentId:"shared",sha256:"abcdef"}] as typeof workspace.documentOriginals;
  return workspace;
}

describe("Auditoría reversible de referencias estratégicas",()=>{
  it("distingue coincidencia exacta, marco local y título ambiguo",()=>{
    const workspace=fixture();
    const before=JSON.stringify(workspace);
    const audit=auditStrategicMigration(workspace,"2026-11-20T13:00:00Z");
    expect(audit.mode).toBe("read-only");
    expect(audit.records).toHaveLength(4);
    expect(audit.records.find(r=>r.documentId==="shared")).toMatchObject({
      disposition:"referencia-exacta",
      matchedReferenceId:STRATEGIC_REFERENCES[0].id,
      originalRegistered:true,
      conciliationLinks:1,
      revisionLinks:1,
    });
    expect(audit.records.find(r=>r.documentId==="local")?.disposition).toBe("mantener-municipal");
    expect(audit.records.find(r=>r.documentId==="ambiguous")?.disposition).toBe("revisar-posible-comun");
    expect(audit.records.find(r=>r.documentId==="ambiguous")?.matchedReferenceId).toBeUndefined();
    expect(audit.records.some(r=>r.documentId==="report")).toBe(false);
    expect(audit.totals).toMatchObject({strategic:4,exactReference:1,requiresReview:2,municipal:1,withDependencies:2,withOriginalRecord:1});
    expect(JSON.stringify(workspace)).toBe(before);
  });
  it("no convierte una misma denominación en prueba de identidad",()=>{
    const workspace=fixture();
    const doc=workspace.repository.documents.find(d=>d.id==="ambiguous")!;
    doc.source.url=undefined;
    doc.title=STRATEGIC_REFERENCES[1].title;
    expect(auditStrategicMigration(workspace).records.find(r=>r.documentId==="ambiguous")?.disposition).toBe("revisar-posible-comun");
  });
  it("el informe generado no contiene originales ni textos fuente",()=>{
    const audit=auditStrategicMigration(fixture());
    const json=JSON.stringify(audit);
    expect(json).not.toContain("sourceText");
    expect(json).not.toContain("fileData");
    expect(json).not.toContain("base64");
    expect(json).toContain("repositoryVersion");
  });
});

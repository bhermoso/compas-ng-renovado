import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createMunicipalityWorkspace } from "../src/domain/workspace";
import { createMunicipalDocumentRepository, addMunicipalDocument } from "../src/domain/repository";
import { createEvidenceStore } from "../src/domain/evidence";
import { STRATEGIC_REFERENCES } from "../src/application/strategic-reference-library";
import { createCleanWorkspaceExample, inspectWorkspaceSeparation } from "../src/application/clean-workspace-example";
import { StrategicReferenceLibrary } from "../src/ui/components/StrategicReferenceLibrary";
import type { MunicipalityContext } from "../src/domain/municipality";

const municipality = {
  identity: {id:"atarfe",name:"Atarfe",ineCode:"18022",province:"Granada"},
} as MunicipalityContext;

function sourceWorkspace() {
  const repo=createMunicipalDocumentRepository({municipalityId:"atarfe"});
  const withReference=addMunicipalDocument(repo,{id:"strategic",kind:"strategic-framework",title:"Estrategia comunitaria",source:{organization:"Junta de Andalucía"}});
  const withReport=addMunicipalDocument(withReference,{id:"report",kind:"health-report",title:"Informe de Salud de Atarfe"});
  const workspace=createMunicipalityWorkspace(municipality,withReport,createEvidenceStore("atarfe"));
  workspace.documentOriginals=[];
  return workspace;
}

describe("Biblioteca común y expediente de ensayo limpio",()=>{
  it("la biblioteca contiene documentos comunes independientes de municipios",()=>{
    expect(STRATEGIC_REFERENCES).toHaveLength(4);
    expect(new Set(STRATEGIC_REFERENCES.map(x=>x.id)).size).toBe(4);
    expect(STRATEGIC_REFERENCES.every(x=>x.scope==="andalucia"&&x.sourcePath.endsWith(".pdf"))).toBe(true);
    expect(STRATEGIC_REFERENCES.every(x=>!Object.hasOwn(x,"municipalityId"))).toBe(true);
  });
  it("inventaría por separado los marcos estratégicos y las fuentes propias",()=>{
    const result=inspectWorkspaceSeparation(sourceWorkspace());
    expect(result.strategicCopies).toBe(1);
    expect(result.diagnosticDocuments).toBe(1);
    expect(result.municipalDocuments).toBe(2);
  });
  it("ensayo limpio conserva identidad pero no borra ni modifica fuentes originales",()=>{
    const source=sourceWorkspace();
    const before=JSON.stringify(source);
    const clean=createCleanWorkspaceExample(source);
    expect(clean.municipality.identity).toEqual(source.municipality.identity);
    expect(clean.repository.documents).toEqual([]);
    expect(clean.evidenceStore.atoms).toEqual([]);
    expect(clean.externalProfileLibrary).toBeUndefined();
    expect(clean.documentOriginals).toBeUndefined();
    expect(clean.validatedActionPlans).toBeUndefined();
    expect(JSON.stringify(source)).toBe(before);
    expect(clean).not.toBe(source);
    expect(clean.municipality).not.toBe(source.municipality);
  });
  it("muestra biblioteca transversal sin convertirla en evidencia territorial",()=>{
    const html=renderToStaticMarkup(<StrategicReferenceLibrary workspace={sourceWorkspace()}/>);
    expect(html).toContain("Documentación de referencia estratégica");
    expect(html).toContain("4 documentos comunes");
    expect(html).toContain("no se cuentan como evidencia");
    expect(html).toContain("Estrategia de Salud Comunitaria");
    expect(html).toContain("Preparar un expediente de ensayo limpio");
    expect(html).not.toContain("Descargar ejemplo limpio en JSON");
  });
});

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createMunicipalityWorkspace } from "../src/domain/workspace";
import { createMunicipalDocumentRepository, addMunicipalDocument } from "../src/domain/repository";
import { createEvidenceStore } from "../src/domain/evidence";
import { STRATEGIC_REFERENCES } from "../src/application/strategic-reference-library";
import { SUPPORT_DOCUMENTS } from "../src/domain/strategy/SupportDocuments";
import { CommonStrategicFramework } from "../src/ui/components/CommonStrategicFramework";
import { createCleanWorkspaceExample, inspectWorkspaceSeparation } from "../src/application/clean-workspace-example";
import { StrategicReferenceLibrary } from "../src/ui/components/StrategicReferenceLibrary";
import { createMunicipalityContext } from "../src/domain/municipality";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";

const municipality = createMunicipalityContext({
  id:"atarfe",name:"Atarfe",ineCode:"18022",province:"Granada",createdBy:"Prueba",
});

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
    // Fuente única: el repertorio de documentación de apoyo del Plan de Acción.
    expect(STRATEGIC_REFERENCES).toHaveLength(SUPPORT_DOCUMENTS.length);
    expect(new Set(STRATEGIC_REFERENCES.map(x=>x.id))).toEqual(new Set(SUPPORT_DOCUMENTS.map(x=>x.id)));
    expect(STRATEGIC_REFERENCES.every(x=>(x.sourcePath?.endsWith(".pdf") ?? false) || (x.url?.startsWith("https://") ?? false))).toBe(true);
    expect(STRATEGIC_REFERENCES.every(x=>!Object.hasOwn(x,"municipalityId"))).toBe(true);
    // Denominaciones oficiales y PESMAA conservado en COMPÁS.
    const titles=STRATEGIC_REFERENCES.map(x=>x.title);
    expect(titles).toContain("Estrategia de Salud de Andalucía 2030");
    expect(titles).toContain("Estrategia de Salud Comunitaria de Andalucía 2026–2030");
    expect(titles.some(t=>t.startsWith("Estrategia de Promoción de una Vida Saludable en Andalucía"))).toBe(true);
    expect(titles).not.toContain("Líneas estratégicas EPVSA");
    expect(STRATEGIC_REFERENCES.find(x=>x.id==="pesma-a")).toMatchObject({title:"I Plan Estratégico de Salud Mental y Adicciones de Andalucía 2026–2029",sourcePath:"docs/source-material/strategic-frameworks/PESMAA 2026-2029.pdf"});
    expect(STRATEGIC_REFERENCES[0].id).toBe("esa-2030");
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
    expect(clean.municipality.identity.id).toBe("ensayo-atarfe");
    expect(clean.municipality.identity.name).toBe("Atarfe · ensayo limpio");
    expect(clean.municipality.identity.ineCode).toBe("18022");
    expect(clean.repository.municipalityId).toBe("ensayo-atarfe");
    expect(clean.evidenceStore.municipalityId).toBe("ensayo-atarfe");
    expect(clean.repository.documents).toEqual([]);
    expect(clean.evidenceStore.atoms).toEqual([]);
    expect(clean.externalProfileLibrary).toBeUndefined();
    expect(clean.documentOriginals).toBeUndefined();
    expect(clean.validatedActionPlans).toBeUndefined();
    expect(JSON.stringify(source)).toBe(before);
    expect(clean).not.toBe(source);
    expect(clean.municipality).not.toBe(source.municipality);
    const reimported = parseWorkspaceJSON(JSON.stringify(clean));
    expect(reimported).not.toBeNull();
    expect(reimported?.municipality.identity.id).toBe("ensayo-atarfe");
    expect(reimported?.repository.documents).toEqual([]);

  });
  it("muestra biblioteca transversal sin convertirla en evidencia territorial",()=>{
    const html=renderToStaticMarkup(<StrategicReferenceLibrary workspace={sourceWorkspace()}/>);
    expect(html).toContain("Copias municipales de marcos estratégicos");
    expect(html).toContain(`${STRATEGIC_REFERENCES.length} documentos comunes`);
    expect(html).toContain("no se cuentan como evidencia");
    expect(html).toContain("Marco estratégico común");
    const common=renderToStaticMarkup(<CommonStrategicFramework/>);
    expect(common).toContain("Estrategia de Salud Comunitaria de Andalucía 2026–2030");
    expect(common).toContain("I Plan Estratégico de Salud Mental y Adicciones de Andalucía 2026–2029");
    expect(common).toContain("ni se cuentan como evidencia de salud local");
    expect(html).toContain("Preparar un expediente de ensayo limpio");
    expect(html).not.toContain("Descargar ejemplo limpio en JSON");
  });
});

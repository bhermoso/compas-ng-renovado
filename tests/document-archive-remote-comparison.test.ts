import { describe, expect, it } from "vitest";
import { compareDocumentArchive } from "../src/application/document-files/compareDocumentArchive";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const workspace = {
  municipality:{identity:{id:"loja",name:"Loja"}},
  updatedAt:"2026-11-19T18:15:00Z",
  repository:{
    documents:[{id:"doc-1", title:"Localiza Salud",kind:"localiza-salud",status:"uploaded",sourceFileName:"activos.csv",contentSha256:"hash1"}],
    assetValidations:[{id:"decl-1",documentId:"doc-1"}],
  },
  documentOriginals:[{documentId:"doc-1",sha256:"hash1"}],
  evidenceStore:{atoms:[{id:"atom-1",provenance:{documentId:"doc-1"}}]},
} as unknown as MunicipalityWorkspace;

describe("Comprobación de archivo documental en Firebase", () => {
  it("certifica coincidencia exacta de fichas, originales, validaciones y evidencias", () => {
    const result = compareDocumentArchive(workspace, structuredClone(workspace));
    expect(result.matches).toBe(true);
    expect(result.remoteDocuments).toBe(1);
    expect(result.remoteOriginals).toBe(1);
  });
  it("detecta carga incorporada localmente que aún no consta en Firebase", () => {
    const remote=structuredClone(workspace);
    remote.repository.documents=[];
    expect(compareDocumentArchive(workspace,remote).problems).toContain("Falta en Firebase: «Localiza Salud».");
  });
  it("impide declarar sincronización si desapareció una validación o cambió el original", () => {
    const remote=structuredClone(workspace);
    remote.repository.assetValidations=[];
    remote.documentOriginals![0].sha256="otro";
    const result=compareDocumentArchive(workspace,remote);
    expect(result.matches).toBe(false);
    expect(result.problems.some(p=>p.includes("validación"))).toBe(true);
    expect(result.problems.some(p=>p.includes("original"))).toBe(true);
  });
  it("rechaza cotejar un expediente de otro municipio", () => {
    const remote=structuredClone(workspace);
    remote.municipality.identity.id="atarfe";
    expect(compareDocumentArchive(workspace,remote).matches).toBe(false);
  });
});

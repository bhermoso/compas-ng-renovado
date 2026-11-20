import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { removeMunicipalDocument } from "../src/domain/repository";
import { DocumentArchiveManager, documentCoincidences } from "../src/ui/components/DocumentArchiveManager";
import type { MunicipalDocumentRepository } from "../src/domain/repository";
import type { EvidenceAtom } from "../src/domain/evidence";

const time = "2026-11-19T18:00:00.000Z";
const repository = {
  municipalityId: "loja",
  createdAt: time, updatedAt: time,
  documents: [
    {id:"assets-1",municipalityId:"loja",kind:"localiza-salud",title:"Recursos Localiza Loja",status:"validated",source:{system:"Localiza"},tags:[],createdAt:time,updatedAt:time},
    {id:"report-1",municipalityId:"loja",kind:"health-report",title:"Informe de Salud Loja",status:"uploaded",source:{system:"Área sanitaria"},tags:[],createdAt:time,updatedAt:time},
  ],
  assetValidations: [
    {id:"v1",documentId:"assets-1",criteria:{title:"RELAS",version:"1"},declaredBy:"Técnico",declaredAt:time},
  ],
  conciliations:[
    {id:"c1",historical:{documentId:"assets-1",statement:""},current:{documentId:"report-1",statement:""},declaredAt:time},
  ],
} as unknown as MunicipalDocumentRepository;

describe("Gestión documental completa", () => {
  it("identifica huellas idénticas como mismo contenido, sin confundir versiones con distintos bytes", () => {
    const shared = "a".repeat(64);
    const documents = [
      {...repository.documents[1], id:"ibse-1", title:"IBSE Atarfe", contentSha256:shared},
      {...repository.documents[1], id:"ibse-2", title:"IBSE Atarfe", contentSha256:shared, revisionNumber:2},
      {...repository.documents[1], id:"ibse-3", title:"IBSE Atarfe", contentSha256:"b".repeat(64), revisionNumber:3},
    ];
    const groups = documentCoincidences(documents);
    expect(groups.find(g=>g.reason==="hash")?.documents.map(d=>d.id)).toEqual(["ibse-1","ibse-2"]);
    expect(groups.find(g=>g.reason==="title")?.documents).toHaveLength(3);
  });
  it("los títulos iguales sin hash son candidatos, no duplicados confirmados", () => {
    const documents = [
      {...repository.documents[1], id:"ibse-1", title:"Índice IBSE"},
      {...repository.documents[1], id:"ibse-2", title:"Indice  IBSE", revisionOf:"ibse-1"},
    ];
    const groups = documentCoincidences(documents);
    expect(groups).toHaveLength(1);
    expect(groups[0].reason).toBe("title");
  });
  it("enumera incluso fuentes de activos y el Informe y permite abrir su ficha", () => {
    const html = renderToStaticMarkup(<DocumentArchiveManager repository={repository} evidence={[] as EvidenceAtom[]} originalIds={["assets-1"]} canWrite persistence="Firebase · copia confirmada" originalCapacity="6 MB / 40 MB" onOpenUploader={()=>{}} onOpenAssetValidations={()=>{}}/>);
    expect(html).toContain("Gestor documental del expediente");
    expect(html).toContain("Incorporar PDF, DOCX o CSV (revisión previa)");
    expect(html).toContain("Original y texto");
    expect(html).toContain("Versión y procedencia");
    expect(html).toContain("Versión sin numerar");
    expect(html).toContain("Origen institucional no declarado");
    expect(html).toContain("Informe de Salud Loja");
    expect(html).toContain("Original no acreditado en expediente");
    expect(html).toContain("Contraer catálogo");
    expect(html).toContain("2</strong> fichas");
    expect(html).toContain("1</strong> originales compartidos");
    expect(html).toContain("Revisar validaciones de activos");
    expect(html).toContain("Firebase · copia confirmada");
  });
  it("retirar una fuente elimina solo las validaciones y conciliaciones que la citan", () => {
    const next = removeMunicipalDocument(repository, "assets-1");
    expect(next.documents.map(d=>d.id)).toEqual(["report-1"]);
    expect(next.assetValidations).toEqual([]);
    expect(next.conciliations).toEqual([]);
    expect(repository.assetValidations).toHaveLength(1);
    expect(repository.documents).toHaveLength(2);
  });
  it("eliminar una fuente no vinculada conserva las validaciones de otros documentos", () => {
    const next = removeMunicipalDocument(repository,"report-1");
    expect(next.assetValidations?.map(v=>v.documentId)).toEqual(["assets-1"]);
    expect(next.conciliations).toEqual([]);
  });
});

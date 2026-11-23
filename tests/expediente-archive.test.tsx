import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { removeMunicipalDocument, type MunicipalDocumentRepository } from "../src/domain/repository";
import type { MunicipalityWorkspace } from "../src/domain/workspace/MunicipalityWorkspace";
import { ExpedienteArchive } from "../src/ui/components/ExpedienteArchive";
import {
  archiveDocumentRows, documentChangeWarnings, replaceTerritorialSnapshots, territorialSnapshotDeletionBlock,
} from "../src/application/document-files/expedienteArchive";

const time = "2026-11-19T18:00:00.000Z";
const repository = {
  municipalityId: "loja",
  createdAt: time, updatedAt: time,
  documents: [
    {id:"assets-1",municipalityId:"loja",kind:"localiza-salud",title:"Recursos Localiza Loja",status:"validated",source:{system:"Localiza"},tags:[],createdAt:time,updatedAt:time},
    {id:"report-1",municipalityId:"loja",kind:"health-report",title:"Informe de Salud Loja",status:"uploaded",sourceFileName:"informe.pdf",source:{system:"Área sanitaria"},tags:[],createdAt:time,updatedAt:time},
    {id:"report-2",municipalityId:"loja",kind:"health-report",title:"Informe de Salud Loja v2",status:"uploaded",revisionOf:"report-1",revisionNumber:2,source:{system:"Área sanitaria"},tags:[],createdAt:time,updatedAt:time},
    {id:"old-1",municipalityId:"loja",kind:"territorial-documentation",title:"Diagnóstico 2015",status:"archived",source:{},tags:[],createdAt:time,updatedAt:time},
  ],
  assetValidations: [
    {id:"v1",documentId:"assets-1",criteria:{title:"RELAS",version:"1"},declaredBy:"Técnico",declaredAt:time},
  ],
  conciliations:[
    {id:"c1",historical:{documentId:"assets-1",statement:""},current:{documentId:"report-1",statement:""},declaredAt:time},
  ],
} as unknown as MunicipalDocumentRepository;

const atom = (documentId: string) => ({ municipalityId: "loja", provenance: { documentId, origin: "document" } });
const snapshot = (id: string, retrievedAt: string) => ({
  schema: "compas-territorial-statistics/v1", id, municipalityId: "loja", municipalityName: "Loja", ineCode: "18122",
  retrievedAt, catalogVersion: "2026-11-18", sources: [], observations: [], failures: [],
});
const profile = (status: "review" | "validated", bindings = 0) => ({
  id: "p1", title: "Perfil de Salud de Loja", status, attachmentIds: ["a1"],
  bindings: Array.from({ length: bindings }, () => ({})), results: [],
});

function workspace(extra: Partial<Record<string, unknown>> = {}) {
  return {
    municipality: { identity: { id: "loja", name: "Loja" } },
    repository,
    evidenceStore: { atoms: [atom("report-1"), atom("report-1"), atom("assets-1")], updatedAt: time },
    documentOriginals: [{ id: "report-1", documentId: "report-1", name: "informe.pdf", mimeType: "application/pdf", size: 2_000_000, sha256: "x", base64: "" }],
    territorialStatistics: [snapshot("s1", "2026-11-17T10:00:00Z"), snapshot("s2", "2026-11-20T10:00:00Z")],
    externalProfileLibrary: { profiles: [profile("review")], attachments: [{ id: "a1", name: "perfil.pdf", mimeType: "application/pdf", size: 1, sha256: "x", base64: "" }], activeId: "p1" },
    ...extra,
  } as unknown as MunicipalityWorkspace;
}

const noop = async () => {};
const render = (ws: MunicipalityWorkspace, canWrite = true) => renderToStaticMarkup(<ExpedienteArchive workspace={ws} canWrite={canWrite} persistence="Firebase · copia confirmada" localOnly={[]} uploader={<p>carga</p>}
  onStoreOriginal={noop} onCreateRevision={noop} onArchiveDocument={noop} onDeleteDocument={async () => true} onDeleteTerritorialSnapshot={noop}
  onOpenProfile={() => {}} onOpenTerritorialStatistics={() => {}} onOpenAssetValidations={() => {}} />);

describe("Archivo del expediente", () => {
  it("muestra en una sola pantalla documentos, estadística y Perfil, con sus acciones a la vista", () => {
    const html = render(workspace());
    expect(html).toContain("Archivo del expediente");
    expect(html).toContain("Cargar archivos");
    expect(html).toContain("Recursos Localiza Loja");
    expect(html).toContain("Sin archivo");
    expect(html).toContain("Adjuntar archivo");
    expect(html).toContain("informe.pdf");
    expect(html).toContain("Descargar");
    expect(html).toContain("Nueva versión");
    expect(html).toContain("Eliminar");
    // report-1 tiene una versión posterior: se archiva, no se elimina.
    expect(html).toContain("Archivar");
    expect(html).toContain("Archivados o rechazados · 1");
    expect(html).toContain("Estadística territorial");
    expect(html).toContain("Descargar CSV");
    expect(html).toContain("Perfil de Salud de Loja");
    expect(html).toContain("perfil.pdf");
  });

  it("sin permiso de escritura solo deja ver y descargar", () => {
    const html = render(workspace(), false);
    expect(html).not.toContain("Adjuntar archivo");
    expect(html).not.toContain(">Eliminar<");
    expect(html).not.toContain("Cargar archivos");
    expect(html).toContain("Descargar");
  });

  it("distingue archivo guardado, solo en el navegador y sin archivo", () => {
    const rows = archiveDocumentRows(workspace(), ["assets-1"]);
    const by = (id: string) => rows.find(r => r.document.id === id)!;
    expect(by("report-1").file).toBe("stored");
    expect(by("report-1").evidenceCount).toBe(2);
    expect(by("report-1").hasLaterVersions).toBe(true);
    expect(by("assets-1").file).toBe("local-only");
    expect(by("report-2").file).toBe("none");
    expect(by("old-1").active).toBe(false);
  });

  it("avisa de que un Perfil validado queda marcado al eliminar un documento con evidencias", () => {
    const rows = archiveDocumentRows(workspace());
    const report = rows.find(r => r.document.id === "report-1")!;
    const withoutEvidence = rows.find(r => r.document.id === "report-2")!;
    const validated = workspace({ externalProfileLibrary: { profiles: [profile("validated")], attachments: [], activeId: "p1" } });
    expect(documentChangeWarnings(validated, report).join(" ")).toContain("Validación desactualizada");
    expect(documentChangeWarnings(workspace(), report).join(" ")).not.toContain("Validación desactualizada");
    expect(documentChangeWarnings(validated, withoutEvidence)).toEqual([]);
  });

  it("una descarga nueva sustituye a las anteriores", () => {
    const fresh = snapshot("s3", "2026-11-23T10:00:00Z") as never;
    expect(replaceTerritorialSnapshots(fresh)).toEqual([fresh]);
  });

  it("no deja eliminar la única descarga si el Perfil tiene cifras enlazadas", () => {
    const linked = { profiles: [profile("review", 3)], attachments: [], activeId: "p1" };
    expect(territorialSnapshotDeletionBlock(workspace({ externalProfileLibrary: linked }), "s1")).toBeUndefined();
    const single = workspace({ externalProfileLibrary: linked, territorialStatistics: [snapshot("s1", time)] });
    expect(territorialSnapshotDeletionBlock(single, "s1")).toContain("3 cifras o condiciones enlazadas");
    expect(territorialSnapshotDeletionBlock(workspace({ territorialStatistics: [snapshot("s1", time)] }), "s1")).toBeUndefined();
  });

  it("retirar una fuente elimina solo las validaciones y conciliaciones que la citan", () => {
    const next = removeMunicipalDocument(repository, "assets-1");
    expect(next.documents.map(d=>d.id)).toEqual(["report-1", "report-2", "old-1"]);
    expect(next.assetValidations).toEqual([]);
    expect(next.conciliations).toEqual([]);
    expect(repository.assetValidations).toHaveLength(1);
  });

  it("eliminar una fuente no vinculada conserva las validaciones de otros documentos", () => {
    const next = removeMunicipalDocument(repository,"report-2");
    expect(next.assetValidations?.map(v=>v.documentId)).toEqual(["assets-1"]);
  });
});

import { describe, it, expect } from "vitest";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { addMunicipalDocument } from "../src/domain/repository";
import { encodeDocumentOriginal } from "../src/application/document-files/documentOriginals";
import { createDocumentRevision } from "../src/application/document-files/documentRevisions";

describe("revisiones documentales sin duplicidad", () => {
  const original = (value: string) => new File([value], "INFORME SALUD.pdf", { type: "application/pdf" });
  async function fixture() {
    const ws = createCompleteMunicipalityWorkspace({ id: "alfacar", name: "Alfacar" });
    const a = await encodeDocumentOriginal("informe", original("informe A"));
    ws.repository = addMunicipalDocument(ws.repository, {
      id: "informe", kind: "health-report", title: "Informe de Salud Alfacar", contentSha256: a.sha256
    });
    ws.documentOriginals = [a];
    return ws;
  }

  it("nueva versión conserva fuente anterior y sus evidencias", async () => {
    const ws = await fixture();
    const newFile = await encodeDocumentOriginal("revision2", original("informe B"));
    const next = createDocumentRevision(ws, "informe", newFile, "2026-11-04T12:00:00Z");
    expect(next.repository.documents).toHaveLength(2);
    expect(next.documentOriginals).toHaveLength(2);
    const revision = next.repository.documents.find(d => d.id === "revision2")!;
    expect(revision).toMatchObject({
      revisionOf: "informe", revisionNumber: 2, canGenerateEvidence: false,
      status: "uploaded", contentSha256: newFile.sha256,
    });
    expect(revision.sourceText).toBeUndefined();
    expect(ws.repository.documents).toHaveLength(1);
    expect(next.evidenceStore).toBe(ws.evidenceStore);
  });

  it("bloquea contenidos idénticos aunque cambie el nombre", async () => {
    const ws = await fixture();
    const copy = await encodeDocumentOriginal("otra", new File(["informe A"], "renombrado.pdf"));
    expect(() => createDocumentRevision(ws, "informe", copy)).toThrow(/mismos bytes/);
  });
  it("bloquea identificadores utilizados y versiones sin base", async () => {
    const ws = await fixture();
    const b = await encodeDocumentOriginal("informe", original("informe B"));
    expect(() => createDocumentRevision(ws, "informe", b)).toThrow(/identificador/);
    const c = await encodeDocumentOriginal("nueva", original("informe B"));
    expect(() => createDocumentRevision(ws, "inexistente", c)).toThrow(/No existe/);
  });
});

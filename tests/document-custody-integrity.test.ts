import { describe, expect, it } from "vitest";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { createHealthReportDocumentFromPdf } from "../src/application/health-report";
import { registerHealthReport } from "../src/application/health-report/registerHealthReport";
import { encodeDocumentOriginal, isDocumentFileName } from "../src/application/document-files/documentOriginals";
import { createDocumentRevision, PENDING_DOCUMENT_REVIEW } from "../src/application/document-files/documentRevisions";
import { confirmsDocumentDeletion, deleteWorkspaceDocument } from "../src/application/document-files/deleteWorkspaceDocument";
import { activeStudyDocumentId, replaceComplementaryStudy } from "../src/application/document-ingestion/studyDocuments";
import { ingestManualDocument } from "../src/application/document-ingestion/ManualDocumentIngestionService";
import { retireDuplicateDocument } from "../src/application/document-ingestion/documentDuplicates";
import { excludeHistoricalSources } from "../src/application/health-profile/antecedents";
import { addMunicipalDocument } from "../src/domain/repository";
import { createEvidenceAtom, evidenceHasDocument } from "../src/domain/evidence";
import { parseWorkspaceJSON, serializeWorkspaceForStorage } from "../src/infrastructure/persistence/local-storage";

const municipalityId = "ensayo";
const now = "2026-11-22T10:00:00.000Z";
const workspace = () => createCompleteMunicipalityWorkspace({ id: municipalityId, name: "Ensayo" });
const reopen = (state: ReturnType<typeof workspace>) => parseWorkspaceJSON(serializeWorkspaceForStorage(state))!;
const file = (id: string) => encodeDocumentOriginal(id, new File([id], id + ".pdf"));

describe("integridad documental", () => {
  it("un Informe nuevo del proceso actual sustituye al anterior y elimina su ficha y su original", async () => {
    const initial = workspace();
    const report = (linkedDocumentId: string) => createHealthReportDocumentFromPdf({
      municipalityId, linkedDocumentId, title: "Informe", sourceFileName: linkedDocumentId + ".pdf",
      authors: [], arrayBuffer: new ArrayBuffer(0),
    });
    const first = registerHealthReport(initial, report("anterior"), {
      id: "anterior", kind: "health-report", title: "Informe",
    }, now);
    first.documentOriginals = [await file("anterior")];
    const pending = reopen(createDocumentRevision(first, "anterior", await file("nueva"), now));
    expect(pending.repository.documents.map(doc => doc.id)).toEqual(["anterior", "nueva"]);
    expect(pending.healthReport?.linkedDocumentId).toBe("anterior");
    const next = reopen(registerHealthReport(pending, report("nueva"), pending.repository.documents[1], now));
    expect(next.healthReport?.linkedDocumentId).toBe("nueva");
    expect(next.previousHealthReports ?? []).toEqual([]);
    expect(next.repository.documents.map(doc => doc.id)).toEqual(["nueva"]);
    expect(next.repository.documents[0].revisionOf).toBeUndefined();
    expect(next.repository.documents[0].tags).not.toContain(PENDING_DOCUMENT_REVIEW);
    expect(next.documentOriginals?.map(original => original.name)).toEqual(["nueva.pdf"]);
  });

  it("un Informe declarado de ciclo histórico se conserva al cargar el actual", () => {
    const initial = workspace();
    const report = (linkedDocumentId: string) => createHealthReportDocumentFromPdf({
      municipalityId, linkedDocumentId, title: "Informe", sourceFileName: linkedDocumentId + ".pdf",
      authors: [], arrayBuffer: new ArrayBuffer(0),
    });
    const first = registerHealthReport(initial, report("2018"), { id: "2018", kind: "health-report", title: "Informe 2018" }, now);
    first.repository.documents = first.repository.documents.map(doc => ({ ...doc, cycle: { status: "historical" as const, referenceYear: 2018 } }));
    const next = registerHealthReport(first, report("2026"), { id: "2026", kind: "health-report", title: "Informe 2026" }, now);
    expect(next.repository.documents.map(doc => doc.id)).toEqual(["2018", "2026"]);
    expect(next.previousHealthReports?.map(item => item.linkedDocumentId)).toEqual(["2018"]);
  });

  it("las copias derivadas cuentan en el límite común de las revisiones", async () => {
    const state = workspace();
    const original = await file("original");
    state.repository = addMunicipalDocument(state.repository, { id: "original", kind: "health-report", title: "Informe" });
    state.documentOriginals = [{ ...original, size: 17 * 1024 * 1024 }];
    state.documentDerivedFiles = [{
      ...original, id: "copia", size: 20 * 1024 * 1024, derivedFromDocumentId: "original",
      createdAt: now, provenance: "format-conversion",
    }];
    const child = await file("nueva");
    expect(() => createDocumentRevision(state, "original", { ...child, size: 4 * 1024 * 1024 })).toThrow(/40 MB/);
    expect(isDocumentFileName("copia.pdf")).toBe(true);
    expect(isDocumentFileName("copia.DOCX")).toBe(true);
    expect(isDocumentFileName("copia.doc")).toBe(false);
  });

  it("una revisión PDF de IBSE conserva su vínculo documental sin convertirse en la fuente activa", async () => {
    const state = workspace();
    state.ibseStudy = { sourceFileName: "respuestas.csv" } as NonNullable<typeof state.ibseStudy>;
    state.repository = addMunicipalDocument(state.repository, {
      id: "respuestas", kind: "redcap-export", title: "IBSE", tags: ["ibse"], sourceFileName: "respuestas.csv",
    });
    state.evidenceStore.atoms = [createEvidenceAtom({
      id: "media", municipalityId, title: "Media IBSE", content: "Valor sintético", kind: "indicator",
      provenance: { documentId: "respuestas", origin: "ibse", extractedAt: now },
    })];
    const pending = createDocumentRevision(state, "respuestas", await file("anexo"), now);
    expect(pending.repository.documents[1].tags).toContain("ibse");
    expect(activeStudyDocumentId(pending, "ibseStudy", "ibse")).toBe("respuestas");
    pending.studySourceDocumentIds = { ibseStudy: "respuestas" };
    expect(activeStudyDocumentId(pending, "ibseStudy", "ibse")).toBe("respuestas");
    const deleted = deleteWorkspaceDocument(pending, "anexo", now);
    expect(deleted.deletedStudyKey).toBeUndefined();
    expect(deleted.next.ibseStudy).toBe(state.ibseStudy);
    expect(deleted.next.evidenceStore).toBe(state.evidenceStore);
    expect(deleted.next.studySourceDocumentIds?.ibseStudy).toBe("respuestas");
    expect(confirmsDocumentDeletion(reopen(deleted.next), "anexo")).toBe(true);
  });

  it("la sustitución de un estudio elimina la ficha, el original y las evidencias anteriores", async () => {
    const state = workspace();
    const oldStudy = { sourceFileName: "previo.csv" } as NonNullable<typeof state.phq9Study>;
    state.phq9Study = oldStudy;
    state.repository = addMunicipalDocument(state.repository, {
      id: "previo", sourceFileName: "previo.csv", kind: "redcap-export", title: "PHQ‑9 previo", tags: ["phq9"],
    });
    state.documentOriginals = [await file("previo")];
    const atom = (id: string, documentId: string) => createEvidenceAtom({
      id, municipalityId, title: "Indicador", content: id, kind: "indicator", tags: ["phq9"],
      provenance: { documentId, origin: "complementary-study", extractedAt: now },
    });
    state.evidenceStore.atoms = [atom("antes", "previo")];
    const next = replaceComplementaryStudy(
      state, "phq9Study", "phq9", { ...oldStudy, sourceFileName: "nuevo.csv" },
      { id: "nuevo", sourceFileName: "nuevo.csv", kind: "redcap-export", title: "PHQ‑9 nuevo", tags: ["phq9"] },
      [atom("después", "nuevo")], now,
    );
    expect(next.studySourceDocumentIds?.phq9Study).toBe("nuevo");
    expect(next.repository.documents.map(item => item.id)).toEqual(["nuevo"]);
    expect(next.documentOriginals).toEqual([]);
    expect(next.complementaryStudyHistory).toBeUndefined();
    expect(next.evidenceStore.atoms.map(item => item.id)).toEqual(["después"]);
  });

  it("una copia activa de Localiza sigue respaldando al activo al retirar o archivar la primera", () => {
    const state = workspace();
    const plainText = "Cruz Roja Granada | Voluntariado y atención social";
    const first = ingestManualDocument({
      ...state, documentId: "primera", title: "Carga 1", kind: "localiza-salud", plainText,
    })!;
    const second = ingestManualDocument({
      ...first, documentId: "segunda", title: "Carga 2", kind: "localiza-salud", plainText,
    })!;
    const [originalAtom] = first.evidenceStore.atoms;
    expect(second.atomsCreated).toBe(0);
    expect(evidenceHasDocument(second.evidenceStore.atoms[0], "segunda")).toBe(true);
    for (const evidence of [first.evidenceStore, second.evidenceStore]) {
      const retired = retireDuplicateDocument(second.repository, evidence, "primera", "segunda")!;
      expect(retired.removedAtoms).toBe(0);
      expect(retired.evidenceStore.atoms[0]).toMatchObject({
        id: originalAtom.id, provenance: { documentId: "segunda", sourceLabel: "Carga 2" },
      });
    }
    const repository = {
      ...second.repository,
      documents: second.repository.documents.map(document => document.id === "primera"
        ? { ...document, status: "archived" as const } : document),
    };
    const archived = { ...state, repository, evidenceStore: second.evidenceStore };
    expect(excludeHistoricalSources(archived).evidenceStore.atoms[0].provenance.documentId).toBe("segunda");
    expect(archived.evidenceStore.atoms[0].provenance.documentId).toBe("primera");
  });
});

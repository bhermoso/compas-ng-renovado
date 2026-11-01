import { describe, it, expect } from "vitest";
import { findDuplicateGroups, findExistingCopy, retireDuplicateDocument } from "../src/application/document-ingestion/documentDuplicates";
import { planInboxImport } from "../src/application/document-ingestion/planInboxImport";
import { addMunicipalDocument, type AddMunicipalDocumentInput, type MunicipalDocumentRepository } from "../src/domain/repository";
import type { EvidenceStore } from "../src/domain/evidence";

const source = { system: "test", collectedAt: "2026-10-31T00:00:00.000Z" };
const empty = { municipalityId: "zagra", documents: [], updatedAt: "2026-10-31T00:00:00.000Z" } as unknown as MunicipalDocumentRepository;
const add = (repo: MunicipalDocumentRepository, input: Partial<AddMunicipalDocumentInput> & { id: string }) =>
  addMunicipalDocument(repo, { kind: "territorial-documentation", title: input.id, source, tags: [], ...input });
const longText = "Acta del Grupo Motor de Zagra. ".repeat(12);
const SHA = "a".repeat(64);

describe("findDuplicateGroups", () => {
  it("agrupa por huella, por texto y por nombre, sin solapar grupos", () => {
    let repo = add(empty, { id: "f1", sourceFileName: "plan.pdf", contentSha256: SHA });
    repo = add(repo, { id: "f2", sourceFileName: "plan (1).pdf", contentSha256: SHA });
    repo = add(repo, { id: "t1", sourceText: longText, sourceFileName: "acta-a.docx" });
    repo = add(repo, { id: "t2", sourceText: longText.toUpperCase() + "  ", sourceFileName: "acta-b.docx" });
    repo = add(repo, { id: "n1", sourceFileName: "Memoria_2017.pdf" });
    repo = add(repo, { id: "n2", sourceFileName: "memoria 2017.PDF" });
    repo = add(repo, { id: "solo", sourceFileName: "otro.pdf" });
    const groups = findDuplicateGroups(repo);
    expect(groups.map(g => [g.reason, g.documents.map(d => d.id).sort()])).toEqual([
      ["same-file", ["f1", "f2"]], ["same-text", ["t1", "t2"]], ["same-name", ["n1", "n2"]],
    ]);
  });
  it("reconoce copias antiguas por la huella de su original local y respeta los documentos protegidos", () => {
    let repo = add(empty, { id: "a", sourceFileName: "x.pdf" });
    repo = add(repo, { id: "b", sourceFileName: "y.pdf" });
    const groups = findDuplicateGroups(repo, { localHashes: { a: SHA, b: SHA }, protectedIds: new Set(["b"]) });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ reason: "same-file", suggestedKeepId: "b" });
  });
  it("ignora documentos archivados y propone conservar la copia con más evidencias", () => {
    let repo = add(empty, { id: "a", contentSha256: SHA });
    repo = add(repo, { id: "b", contentSha256: SHA });
    repo = add(repo, { id: "c", contentSha256: SHA });
    repo = { ...repo, documents: repo.documents.map(d => d.id === "c" ? { ...d, status: "archived" as const } : d) };
    const [g] = findDuplicateGroups(repo, { atomCountByDocument: { a: 1, b: 5 } });
    expect(g.documents.map(d => d.id)).toEqual(["a", "b"]);
    expect(g.suggestedKeepId).toBe("b");
  });
});

describe("retireDuplicateDocument", () => {
  const store = (ids: string[]): EvidenceStore => ({ municipalityId: "zagra", createdAt: "", updatedAt: "", atoms: ids.map((d, i) => ({ id: `e${i}`, provenance: { documentId: d } })) as never });
  it("archiva la copia sin borrarla y quita solo sus evidencias", () => {
    let repo = add(empty, { id: "keep", contentSha256: SHA });
    repo = add(repo, { id: "copy", contentSha256: SHA });
    const r = retireDuplicateDocument(repo, store(["keep", "copy", "copy"]), "copy", "keep")!;
    expect(r.repository.documents).toHaveLength(2);
    expect(r.repository.documents.find(d => d.id === "copy")).toMatchObject({ status: "archived" });
    expect(r.repository.documents.find(d => d.id === "copy")!.tags).toContain("duplicate-of:keep");
    expect(r.evidenceStore.atoms.map(a => a.provenance.documentId)).toEqual(["keep"]);
    expect(r.removedAtoms).toBe(2);
  });
  it("no retira la copia que se conserva ni documentos inexistentes", () => {
    const repo = add(empty, { id: "keep" });
    expect(retireDuplicateDocument(repo, store([]), "keep", "keep")).toBeNull();
    expect(retireDuplicateDocument(repo, store([]), "nope", "keep")).toBeNull();
  });
});

describe("prevención en la bandeja", () => {
  it("bloquea un archivo idéntico a uno ya incorporado", () => {
    const repo = add(empty, { id: "a", title: "Plan de actuación", contentSha256: SHA, sourceFileName: "plan.pdf" });
    const plan = planInboxImport({ kind: "territorial-documentation", format: "pdf", fileName: "otro-nombre.pdf", repository: repo, fingerprint: SHA });
    expect(plan).toMatchObject({ blocked: true });
    expect((plan as { reason: string }).reason).toContain("«Plan de actuación»");
  });
  it("detecta el idéntico también por la huella del original local", () => {
    const repo = add(empty, { id: "a", sourceFileName: "plan.pdf" });
    expect(findExistingCopy(repo, { sha256: SHA, name: "x.pdf" }, { a: SHA })).toMatchObject({ reason: "same-file" });
    expect(findExistingCopy(repo, { sha256: "b".repeat(64), name: "Plan.PDF" })).toMatchObject({ reason: "same-name" });
  });
});

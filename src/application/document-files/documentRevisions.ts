import type { MunicipalityWorkspace } from "../../domain/workspace";
import { addMunicipalDocument } from "../../domain/repository";
import type { StoredDocumentOriginal } from "./documentOriginals";
import { decideOriginalUpload, isDocumentFileName, mergeDocumentOriginals, workspaceDocumentBytes } from "./documentOriginals";

export const PENDING_DOCUMENT_REVIEW = "pending-evidence-review";

/** Prevent breaking documentary lineage when deleting a parent file. */
export function canDeleteDocumentVersion(
 documents: readonly { id: string; revisionOf?: string }[],
 documentId: string
): boolean {
 return !documents.some(document=>document.revisionOf===documentId);
}

/**
 * Una revisión es otra ficha y otro original. No sustituye la evidencia ni el
 * informe interpretado vigente: el equipo técnico debe procesar/validar la revisión.
 */
export function createDocumentRevision(
  workspace: MunicipalityWorkspace,
  previousId: string,
  original: StoredDocumentOriginal,
  now: string = new Date().toISOString()
): MunicipalityWorkspace {
  const previous = workspace.repository.documents.find(d => d.id === previousId);
  if (!previous) throw new Error("No existe el documento original.");
  if (!isDocumentFileName(original.name)) throw new Error("La revisión debe ser un PDF o DOCX.");
  if (original.documentId === previousId || workspace.repository.documents.some(d => d.id === original.documentId)) {
    throw new Error("El identificador de revisión ya está utilizado.");
  }
  const existing = workspace.repository.documents.find(d => (
    d.contentSha256 === original.sha256 ||
    workspace.documentOriginals?.some(o => o.documentId === d.id && o.sha256 === original.sha256)
  ));
  if (existing) throw new Error(`Ya existe un documento con los mismos bytes: «${existing.title}».`);
  const decision = decideOriginalUpload(original.size, workspaceDocumentBytes(workspace));
  if (decision !== "fits") throw new Error(decision === "too-large" ? "El archivo supera 20 MB." : "Los originales superan el límite total de 40 MB.");
  const repository = addMunicipalDocument(workspace.repository, {
    id: original.documentId,
    kind: previous.kind,
    title: previous.title,
    // Do not inherit a URL pointing at an older PDF. This new revision has
    // its own original bytes in Firebase, separately hashed and dated.
    source: { ...previous.source, url: undefined, collectedAt: now },
    sourceFileName: original.name,
    contentSha256: original.sha256,
    sourceText: undefined,
    contentMode: "reference-only",
    canGenerateEvidence: false,
    tags: [
      ...previous.tags.filter(tag => tag !== PENDING_DOCUMENT_REVIEW && !tag.startsWith("revision-of:")),
      `revision-of:${previousId}`,
      PENDING_DOCUMENT_REVIEW,
    ],
    revisionOf: previousId,
    revisionNumber: (previous.revisionNumber ?? 1) + 1,
    ...(previous.cycle ? { cycle: previous.cycle } : {}),
    ...(previous.temporal ? { temporal: previous.temporal } : {}),
  });
  return {
    ...workspace,
    repository,
    documentOriginals: mergeDocumentOriginals(workspace.documentOriginals ?? [], [original]),
    updatedAt: now,
  };
}

import type { MunicipalDocument } from "../../domain/repository";
import type { StoredDocumentOriginal } from "../../application/document-files/documentOriginals";

/** El registro 'uploaded' no certifica la presencia de su fichero original. */
export function documentCustodyMetadata(
  document: Pick<MunicipalDocument, "status" | "contentSha256">,
  original?: Pick<StoredDocumentOriginal, "sha256">
) {
  return {
    status: document.status === "uploaded"
      ? original ? "Registrado · original compartido" : "Registrado · original pendiente"
      : document.status,
    registeredSha256: document.contentSha256 ?? "No registrado",
    originalSha256: original?.sha256 ?? "No disponible (original no incorporado)",
  };
}

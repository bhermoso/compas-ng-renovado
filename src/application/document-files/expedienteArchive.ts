/**
 * Lectura de todo lo cargado en un expediente, para gestionarlo desde un solo sitio:
 * documentos con su archivo, estadística territorial y Perfil.
 * No modifica nada; las operaciones las ejecuta la aplicación con sus propias comprobaciones.
 */
import { evidenceHasDocument } from "../../domain/evidence";
import type { MunicipalDocument } from "../../domain/repository";
import type { MunicipalityWorkspace } from "../../domain/workspace/MunicipalityWorkspace";
import type { TerritorialStatisticsSnapshot } from "../../domain/territorial-statistics/TerritorialStatistics";
import { hasDocumentSuccessors } from "./documentRevisions";

export type ArchiveFileState = "stored" | "local-only" | "none";

export interface ArchiveDocumentRow {
  document: MunicipalDocument;
  file: ArchiveFileState;
  fileName?: string;
  fileSize?: number;
  evidenceCount: number;
  hasLaterVersions: boolean;
  active: boolean;
}

export const isActiveDocument = (d: MunicipalDocument) => d.status !== "archived" && d.status !== "rejected";

export function archiveDocumentRows(
  workspace: Pick<MunicipalityWorkspace, "repository" | "documentOriginals" | "evidenceStore">,
  localOnlyIds: readonly string[] = [],
): ArchiveDocumentRow[] {
  const documents = workspace.repository.documents;
  const localOnly = new Set(localOnlyIds);
  return documents.map(document => {
    const original = workspace.documentOriginals?.find(o => o.documentId === document.id);
    return {
      document,
      file: original ? "stored" : localOnly.has(document.id) ? "local-only" : "none",
      fileName: original?.name ?? document.sourceFileName,
      fileSize: original?.size,
      evidenceCount: workspace.evidenceStore.atoms.filter(atom => evidenceHasDocument(atom, document.id)).length,
      hasLaterVersions: hasDocumentSuccessors(documents, document.id),
      active: isActiveDocument(document),
    };
  });
}

function activeProfile(workspace: Pick<MunicipalityWorkspace, "externalProfileLibrary">) {
  const library = workspace.externalProfileLibrary;
  return library?.profiles.find(p => p.id === library.activeId);
}

/**
 * Consecuencias de eliminar o sustituir un documento que conviene saber antes de confirmar.
 * Un Perfil validado se marca como «Validación desactualizada» cuando cambian las evidencias,
 * aunque su texto no cambie.
 */
export function documentChangeWarnings(
  workspace: Pick<MunicipalityWorkspace, "externalProfileLibrary" | "healthReport">,
  row: Pick<ArchiveDocumentRow, "evidenceCount" | "document">,
): string[] {
  const warnings: string[] = [];
  const touchesEvidence = row.evidenceCount > 0 || workspace.healthReport?.linkedDocumentId === row.document.id;
  if (row.evidenceCount > 0) warnings.push(`Se revisan ${row.evidenceCount} evidencias. Se retiran las que dependan solo de esta ficha.`);
  if (workspace.healthReport?.linkedDocumentId === row.document.id) warnings.push("Es el Informe de Salud en uso: el diagnóstico se queda sin Informe hasta que cargues otro.");
  const profile = activeProfile(workspace);
  if (touchesEvidence && profile?.status === "validated") {
    warnings.push(`El Perfil «${profile.title}» no cambia, pero queda marcado «Validación desactualizada» hasta que lo vuelvas a validar.`);
  }
  return warnings;
}

/** Regla de copia única: al guardar una descarga, sustituye a las anteriores. */
export function replaceTerritorialSnapshots(snapshot: TerritorialStatisticsSnapshot): TerritorialStatisticsSnapshot[] {
  return [snapshot];
}

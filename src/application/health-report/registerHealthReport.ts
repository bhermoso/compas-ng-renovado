import { addMunicipalDocument, type AddMunicipalDocumentInput } from "../../domain/repository";
import type { HealthReportDocument } from "../../domain/health-report";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { PENDING_DOCUMENT_REVIEW } from "../document-files/documentRevisions";
import { isHistoricalDocument, retireCurrentPredecessors } from "../workspace/currentSources";

/**
 * Registra el Informe de Salud vigente. El informe anterior del proceso actual
 * se elimina con sus originales y evidencias (una sola versión vigente). Un
 * informe declarado de ciclo histórico se conserva como antecedente.
 */
export function registerHealthReport(
  workspace: MunicipalityWorkspace,
  report: HealthReportDocument,
  document: AddMunicipalDocumentInput,
  now: string,
): MunicipalityWorkspace {
  const previous = workspace.repository.documents.find(item => item.id === workspace.healthReport?.linkedDocumentId);
  const pending = workspace.repository.documents.find(item => item.id === document.id);
  const added = pending ?? addMunicipalDocument(workspace.repository, document).documents.at(-1)!;
  const documents = workspace.repository.documents.map(item => item.id === added.id
    ? { ...item, tags: item.tags.filter(tag => tag !== PENDING_DOCUMENT_REVIEW), updatedAt: now }
    : item);
  const keepsPreviousAsHistory = previous !== undefined && isHistoricalDocument(previous) && workspace.healthReport !== undefined;
  const registered: MunicipalityWorkspace = {
    ...workspace,
    repository: { ...workspace.repository, documents: pending ? documents : [...documents, added], updatedAt: now },
    previousHealthReports: keepsPreviousAsHistory
      ? [...(workspace.previousHealthReports ?? []), workspace.healthReport!]
      : workspace.previousHealthReports,
    healthReport: report,
    evidenceStore: {
      ...workspace.evidenceStore,
      atoms: workspace.evidenceStore.atoms.filter(atom => atom.provenance.origin !== "health-report"),
      updatedAt: now,
    },
    updatedAt: now,
  };
  return retireCurrentPredecessors(registered, { kind: "health-report" }, added.id, now);
}

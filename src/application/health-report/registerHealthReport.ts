import { addMunicipalDocument, type AddMunicipalDocumentInput } from "../../domain/repository";
import type { HealthReportDocument } from "../../domain/health-report";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { PENDING_DOCUMENT_REVIEW } from "../document-files/documentRevisions";

export function registerHealthReport(
  workspace: MunicipalityWorkspace,
  report: HealthReportDocument,
  document: AddMunicipalDocumentInput,
  now: string,
): MunicipalityWorkspace {
  const previous = workspace.repository.documents.find(item => item.id === workspace.healthReport?.linkedDocumentId);
  const pending = workspace.repository.documents.find(item => item.id === document.id);
  const added = pending ?? addMunicipalDocument(workspace.repository, {
    ...document,
    ...(previous ? { revisionOf: previous.id, revisionNumber: (previous.revisionNumber ?? 1) + 1 } : {}),
  }).documents.at(-1)!;
  const retained = workspace.repository.documents.map(item => {
    if (item.id === added.id) return {
      ...item, tags: item.tags.filter(tag => tag !== PENDING_DOCUMENT_REVIEW), updatedAt: now,
    };
    if (item.id === previous?.id || (!previous && item.kind === "health-report" &&
      item.status !== "rejected" && !item.tags.includes(PENDING_DOCUMENT_REVIEW))) {
      return { ...item, status: "archived" as const, updatedAt: now };
    }
    return item;
  });
  return {
    ...workspace,
    repository: { ...workspace.repository, documents: pending ? retained : [...retained, added], updatedAt: now },
    previousHealthReports: workspace.healthReport
      ? [...(workspace.previousHealthReports ?? []), workspace.healthReport]
      : workspace.previousHealthReports,
    healthReport: report,
    evidenceStore: {
      ...workspace.evidenceStore,
      atoms: workspace.evidenceStore.atoms.filter(atom => atom.provenance.origin !== "health-report"),
      updatedAt: now,
    },
    updatedAt: now,
  };
}

import { evidenceHasDocument } from "../../domain/evidence";
import { removeMunicipalDocument } from "../../domain/repository";
import type { ComplementaryStudyKey, MunicipalityWorkspace } from "../../domain/workspace/MunicipalityWorkspace";
import { activeStudyDocuments, isStudyEvidence, STUDY_DOCUMENT_TAGS } from "../document-ingestion/studyDocuments";
import { removeDocumentEvidence } from "../evidence-pipeline/removeDocumentEvidence";
import { currentPredecessors } from "../workspace/currentSources";

export function deleteWorkspaceDocument(workspace: MunicipalityWorkspace, documentId: string, now: string) {
  const document = workspace.repository.documents.find(item => item.id === documentId);
  if (!document) throw new Error("El documento ya no existe.");
  const activeStudies = activeStudyDocuments(workspace);
  const deletedStudyKey = (Object.keys(activeStudies) as ComplementaryStudyKey[])
    .find(key => activeStudies[key] === documentId);
  const deletesHealthReport = workspace.healthReport?.linkedDocumentId === documentId;
  const priorityDocuments = currentPredecessors(workspace, { kind: "prioritisation" }, undefined)
    .filter(item => item.status !== "archived" && item.status !== "rejected");
  const priorityFile = workspace.thematicPrioritisationStudy?.sourceFileName;
  const matchingPriority = priorityFile ? priorityDocuments.filter(item => item.sourceFileName === priorityFile) : priorityDocuments;
  const deletesThematicPrioritisation = matchingPriority.length === 1 && matchingPriority[0].id === documentId;
  const repository = removeMunicipalDocument(workspace.repository, documentId);
  const municipalityId = workspace.municipality.identity.id;
  const atoms = removeDocumentEvidence(workspace.evidenceStore.atoms, documentId, repository.documents,
    municipalityId, document.kind === "localiza-salud")
    .filter(atom => atom.municipalityId !== municipalityId || !(
      (deletesHealthReport && atom.provenance.origin === "health-report") ||
      (deletedStudyKey && isStudyEvidence(atom, deletedStudyKey, STUDY_DOCUMENT_TAGS[deletedStudyKey])) ||
      (deletesThematicPrioritisation && atom.provenance.origin === "citizen-participation")
    ));
  const studySourceDocumentIds = { ...workspace.studySourceDocumentIds };
  if (deletedStudyKey) delete studySourceDocumentIds[deletedStudyKey];
  const previousAtoms = workspace.evidenceStore.atoms;
  const evidenceChanged = atoms.length !== previousAtoms.length || atoms.some((atom, index) => atom !== previousAtoms[index]);
  const next: MunicipalityWorkspace = {
    ...workspace,
    ...(deletedStudyKey ? { [deletedStudyKey]: undefined, studySourceDocumentIds } : {}),
    deletedDocuments: [
      ...(workspace.deletedDocuments ?? []).filter(row => row.documentId !== documentId),
      { documentId, title: document.title, deletedAt: now },
    ],
    documentOriginals: (workspace.documentOriginals ?? []).filter(original => original.documentId !== documentId),
    documentDerivedFiles: (workspace.documentDerivedFiles ?? []).filter(derived => derived.derivedFromDocumentId !== documentId),
    repository,
    ...(workspace.archivedAssetEvidence ? {
      archivedAssetEvidence: removeDocumentEvidence(workspace.archivedAssetEvidence, documentId, repository.documents,
        municipalityId, document.kind === "localiza-salud"),
    } : {}),
    ...(workspace.previousHealthReports ? {
      previousHealthReports: workspace.previousHealthReports.filter(report => report.linkedDocumentId !== documentId),
    } : {}),
    evidenceStore: evidenceChanged ? { ...workspace.evidenceStore, atoms, updatedAt: now } : workspace.evidenceStore,
    healthReport: deletesHealthReport ? undefined : workspace.healthReport,
    thematicPrioritisation: deletesThematicPrioritisation ? undefined : workspace.thematicPrioritisation,
    thematicPrioritisationStudy: deletesThematicPrioritisation ? undefined : workspace.thematicPrioritisationStudy,
    updatedAt: now,
  };
  return { next, deletedStudyKey, deletesHealthReport, deletesThematicPrioritisation };
}

export function confirmsDocumentDeletion(workspace: MunicipalityWorkspace, documentId: string): boolean {
  return !workspace.repository.documents.some(document => document.id === documentId || document.revisionOf === documentId) &&
    !(workspace.documentOriginals ?? []).some(original => original.documentId === documentId) &&
    !(workspace.documentDerivedFiles ?? []).some(derived => derived.derivedFromDocumentId === documentId) &&
    !(workspace.repository.assetValidations ?? []).some(validation => validation.documentId === documentId) &&
    !(workspace.repository.conciliations ?? []).some(conciliation =>
      conciliation.current.documentId === documentId || conciliation.historical.documentId === documentId
    ) && !workspace.evidenceStore.atoms.some(atom => evidenceHasDocument(atom, documentId)) &&
    !(workspace.archivedAssetEvidence ?? []).some(atom => evidenceHasDocument(atom, documentId)) &&
    !(workspace.previousHealthReports ?? []).some(report => report.linkedDocumentId === documentId);
}

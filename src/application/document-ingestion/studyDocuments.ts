import { stableAssetKey, upsertEvidenceAtom, type EvidenceAtom } from "../../domain/evidence";
import { addMunicipalDocument, type AddMunicipalDocumentInput } from "../../domain/repository";
import type { ComplementaryStudyKey, MunicipalityWorkspace } from "../../domain/workspace/MunicipalityWorkspace";
import { PENDING_DOCUMENT_REVIEW } from "../document-files/documentRevisions";

export const STUDY_DOCUMENT_TAGS: Record<ComplementaryStudyKey, string> = {
  ibseStudy: "ibse",
  dukeStudy: "duke-eas",
  predimedStudy: "predimed-eas",
  sf12Study: "sf12-eas",
  suenoStudy: "sueno-eas",
  cageStudy: "cage-eas",
  auditcStudy: "auditc",
  ipaqStudy: "ipaq-eas",
  ghq12Study: "ghq12",
  phq9Study: "phq9",
  psqiStudy: "psqi",
  fagerstromStudy: "fagerstrom",
  sbqStudy: "sbq",
};

const STUDY_KEYS = Object.keys(STUDY_DOCUMENT_TAGS) as ComplementaryStudyKey[];

export function activeStudyDocuments(workspace: MunicipalityWorkspace): Partial<Record<ComplementaryStudyKey, string>> {
  const result: Partial<Record<ComplementaryStudyKey, string>> = {};
  for (const key of STUDY_KEYS) {
    const id = activeStudyDocumentId(workspace, key, STUDY_DOCUMENT_TAGS[key]);
    if (id !== undefined) result[key] = id;
  }
  return result;
}

export function activeStudyDocumentId(
  workspace: MunicipalityWorkspace,
  key: ComplementaryStudyKey,
  tag: string,
): string | undefined {
  const study = workspace[key];
  if (!study) return undefined;
  const explicitId = workspace.studySourceDocumentIds?.[key];
  if (explicitId !== undefined) return explicitId;

  // Las copias antiguas solo tenían la etiqueta, el fichero y los vínculos de sus átomos.
  const candidates = workspace.repository.documents.filter(document =>
    document.status !== "archived" && document.status !== "rejected" &&
    !document.tags.includes(PENDING_DOCUMENT_REVIEW) && document.tags.includes(tag)
  );
  const matchingFile = candidates.filter(document => document.sourceFileName === study.sourceFileName);
  if (matchingFile.length === 1) return matchingFile[0].id;
  const evidenceIds = new Set(workspace.evidenceStore.atoms
    .filter(atom => isStudyEvidence(atom, key, tag))
    .map(atom => atom.provenance.documentId));
  const matchingEvidence = candidates.filter(document => evidenceIds.has(document.id));
  return matchingEvidence.length === 1 ? matchingEvidence[0].id : undefined;
}

export function isStudyEvidence(atom: EvidenceAtom, key: ComplementaryStudyKey, tag: string): boolean {
  return key === "ibseStudy"
    ? atom.provenance.origin === "ibse"
    : atom.provenance.origin === "complementary-study" && atom.tags.includes(tag);
}

export function replaceComplementaryStudy<Key extends Exclude<ComplementaryStudyKey, "ibseStudy">>(
  workspace: MunicipalityWorkspace,
  key: Key,
  tag: string,
  study: NonNullable<MunicipalityWorkspace[Key]>,
  document: AddMunicipalDocumentInput,
  evidence: EvidenceAtom[],
  now: string,
): MunicipalityWorkspace {
  const previousStudy = workspace[key];
  const previousId = activeStudyDocumentId(workspace, key, tag);
  const documents = workspace.repository.documents.filter(item => item.id === previousId);
  const previousEvidence = workspace.evidenceStore.atoms.filter(atom =>
    atom.municipalityId === workspace.municipality.identity.id && isStudyEvidence(atom, key, tag)
  );
  const retiredIds = new Set(previousEvidence.map(atom => atom.id));
  const previous = documents[0];
  const repository = {
    ...workspace.repository,
    documents: workspace.repository.documents.map(item => item.id === previousId
      ? { ...item, status: "archived" as const, updatedAt: now }
      : item),
  };
  let evidenceStore = {
    ...workspace.evidenceStore,
    atoms: workspace.evidenceStore.atoms.filter(atom => !retiredIds.has(atom.id)),
    updatedAt: now,
  };
  for (const atom of evidence) {
    evidenceStore = upsertEvidenceAtom(evidenceStore, atom, stableAssetKey(atom.municipalityId, atom.provenance.origin, atom.title));
  }
  return {
    ...workspace,
    [key]: study,
    repository: addMunicipalDocument(repository, {
      ...document,
      ...(previous ? { revisionOf: previous.id, revisionNumber: (previous.revisionNumber ?? 1) + 1 } : {}),
    }),
    studySourceDocumentIds: { ...workspace.studySourceDocumentIds, [key]: document.id },
    complementaryStudyHistory: previousStudy
      ? [...(workspace.complementaryStudyHistory ?? []), {
          studyKey: key, replacedAt: now, previousStudy, documents, evidence: previousEvidence,
        }]
      : workspace.complementaryStudyHistory,
    evidenceStore,
    updatedAt: now,
  };
}

/**
 * currentSources — una sola versión vigente de cada fuente del proceso actual.
 *
 * Regla del responsable (2026-11-23): en el proceso actual solo existe un
 * ejemplar de cada fuente, el último cargado: un informe de salud, un export de
 * cada estudio complementario, un listado de Localiza Salud y una priorización.
 * Cargar uno nuevo sustituye al anterior y lo elimina del expediente (y, al
 * guardarse, de Firebase), con sus originales, sus derivados y sus evidencias.
 *
 * Lo histórico se conserva: un documento declarado de ciclo histórico
 * (`cycle.status === "historical"`) nunca se elimina por esta regla.
 */
import type { EvidenceAtom } from "../../domain/evidence";
import type { MunicipalDocument } from "../../domain/repository";
import type { ComplementaryStudyKey, MunicipalityWorkspace } from "../../domain/workspace/MunicipalityWorkspace";
import { activeStudyDocumentId, STUDY_DOCUMENT_TAGS } from "../document-ingestion/studyDocuments";
import { PENDING_DOCUMENT_REVIEW } from "../document-files/documentRevisions";

export const THEMATIC_PRIORITISATION_TAG = "thematic-prioritisation";
/** Etiqueta que recibían los IBSE sustituidos antes de esta regla. */
const IBSE_HISTORY_TAG = "ibse-history";

export type SourceSlot =
  | { kind: "health-report" }
  | { kind: "localiza-salud" }
  | { kind: "prioritisation" }
  | { kind: "study"; key: ComplementaryStudyKey };

export function slotLabel(slot: SourceSlot): string {
  switch (slot.kind) {
    case "health-report": return "Informe de salud";
    case "localiza-salud": return "Localiza Salud";
    case "prioritisation": return "Priorización temática";
    case "study": return `Estudio complementario (${STUDY_DOCUMENT_TAGS[slot.key]})`;
  }
}

export function isHistoricalDocument(document: MunicipalDocument): boolean {
  return document.cycle?.status === "historical";
}

/** ¿Pertenece el documento a esta fuente? No considera el ciclo. */
export function belongsToSlot(document: MunicipalDocument, slot: SourceSlot): boolean {
  switch (slot.kind) {
    case "health-report": return document.kind === "health-report";
    case "localiza-salud": return document.kind === "localiza-salud";
    case "prioritisation": return document.tags.includes(THEMATIC_PRIORITISATION_TAG);
    case "study": {
      const tag = STUDY_DOCUMENT_TAGS[slot.key];
      if (document.tags.includes(tag)) return true;
      return slot.key === "ibseStudy" && document.tags.includes(IBSE_HISTORY_TAG);
    }
  }
}

/** Ejemplares del proceso actual de una fuente, excluida la versión que se conserva. */
export function currentPredecessors(
  workspace: MunicipalityWorkspace,
  slot: SourceSlot,
  keepDocumentId: string | undefined,
): MunicipalDocument[] {
  return workspace.repository.documents.filter(document =>
    document.id !== keepDocumentId && belongsToSlot(document, slot) && !isHistoricalDocument(document) &&
    !document.tags.includes(PENDING_DOCUMENT_REVIEW)
  );
}

function documentIdsOf(atom: EvidenceAtom): string[] {
  const ids = atom.provenance.documentId ? [atom.provenance.documentId] : [];
  return [...ids, ...(atom.provenance.additionalDocuments ?? []).map(source => source.documentId)];
}

/** Quita de un átomo los documentos eliminados; devuelve null si no le queda ninguno. */
function detachRemovedDocuments(atom: EvidenceAtom, removed: ReadonlySet<string>): EvidenceAtom | null {
  const ids = documentIdsOf(atom);
  if (ids.length === 0 || !ids.some(id => removed.has(id))) return atom;
  const kept = (atom.provenance.additionalDocuments ?? []).filter(source => !removed.has(source.documentId));
  const primaryRemoved = atom.provenance.documentId !== undefined && removed.has(atom.provenance.documentId);
  if (!primaryRemoved) {
    return { ...atom, provenance: { ...atom.provenance, additionalDocuments: kept.length ? kept : undefined } };
  }
  const [promoted, ...rest] = kept;
  if (!promoted) return null;
  return {
    ...atom,
    provenance: {
      ...atom.provenance,
      documentId: promoted.documentId,
      ...(promoted.sourceLabel ? { sourceLabel: promoted.sourceLabel } : {}),
      additionalDocuments: rest.length ? rest : undefined,
    },
  };
}

/**
 * Elimina del expediente los documentos indicados y todo lo que cuelga solo de
 * ellos: originales, derivados, evidencias, validaciones de activos,
 * conciliaciones e historiales de sustitución. No toca documentos históricos.
 */
export function removeDocuments(
  workspace: MunicipalityWorkspace,
  documentIds: readonly string[],
  now: string,
): MunicipalityWorkspace {
  const removed = new Set(
    documentIds.filter(id => {
      const document = workspace.repository.documents.find(item => item.id === id);
      return document !== undefined && !isHistoricalDocument(document);
    })
  );
  if (removed.size === 0) return workspace;

  const atoms = workspace.evidenceStore.atoms
    .map(atom => detachRemovedDocuments(atom, removed))
    .filter((atom): atom is EvidenceAtom => atom !== null);
  const archivedAssetEvidence = (workspace.archivedAssetEvidence ?? [])
    .map(atom => detachRemovedDocuments(atom, removed))
    .filter((atom): atom is EvidenceAtom => atom !== null);
  const repository = workspace.repository;

  return {
    ...workspace,
    repository: {
      ...repository,
      documents: repository.documents
        .filter(document => !removed.has(document.id))
        .map(document => {
          if (!document.revisionOf || !removed.has(document.revisionOf)) return document;
          const { revisionOf: _revisionOf, revisionNumber: _revisionNumber, ...rest } = document;
          void _revisionOf; void _revisionNumber;
          return rest;
        }),
      ...(repository.assetValidations
        ? { assetValidations: repository.assetValidations.filter(item => !removed.has(item.documentId)) }
        : {}),
      ...(repository.conciliations
        ? {
            conciliations: repository.conciliations.filter(item =>
              !removed.has(item.current.documentId) && !removed.has(item.historical.documentId)
            ),
          }
        : {}),
      updatedAt: now,
    },
    evidenceStore: { ...workspace.evidenceStore, atoms, updatedAt: now },
    ...(workspace.archivedAssetEvidence ? { archivedAssetEvidence } : {}),
    ...(workspace.documentOriginals
      ? { documentOriginals: workspace.documentOriginals.filter(item => !removed.has(item.documentId)) }
      : {}),
    ...(workspace.documentDerivedFiles
      ? {
          documentDerivedFiles: workspace.documentDerivedFiles.filter(item =>
            !removed.has(item.documentId) && !removed.has(item.derivedFromDocumentId)
          ),
        }
      : {}),
    ...(workspace.previousHealthReports
      ? {
          previousHealthReports: workspace.previousHealthReports.filter(report =>
            !report.linkedDocumentId || !removed.has(report.linkedDocumentId)
          ),
        }
      : {}),
    ...(workspace.ibseStudyHistory
      ? {
          ibseStudyHistory: workspace.ibseStudyHistory.filter(entry =>
            !entry.documents.some(document => removed.has(document.id))
          ),
        }
      : {}),
    ...(workspace.complementaryStudyHistory
      ? {
          complementaryStudyHistory: workspace.complementaryStudyHistory.filter(entry =>
            !entry.documents.some(document => removed.has(document.id))
          ),
        }
      : {}),
    updatedAt: now,
  };
}

/** Sustitución al cargar: elimina los ejemplares anteriores del proceso actual. */
export function retireCurrentPredecessors(
  workspace: MunicipalityWorkspace,
  slot: SourceSlot,
  keepDocumentId: string,
  now: string,
): MunicipalityWorkspace {
  const ids = currentPredecessors(workspace, slot, keepDocumentId).map(document => document.id);
  return removeDocuments(workspace, ids, now);
}

export interface ConsolidationEntry {
  slot: SourceSlot;
  label: string;
  keep?: MunicipalDocument;
  remove: MunicipalDocument[];
}

export interface ConsolidationPlan {
  entries: ConsolidationEntry[];
  /** Copias internas de sustituciones anteriores que también se eliminan. */
  replacedCopies: number;
  isEmpty: boolean;
}

function latest(documents: readonly MunicipalDocument[]): MunicipalDocument | undefined {
  return [...documents]
    .filter(document => document.status !== "rejected")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];
}

function activeDocumentFor(workspace: MunicipalityWorkspace, slot: SourceSlot): MunicipalDocument | undefined {
  const candidates = workspace.repository.documents.filter(document =>
    belongsToSlot(document, slot) && !isHistoricalDocument(document)
  );
  if (candidates.length === 0) return undefined;
  const byId = (id: string | undefined) => candidates.find(document => document.id === id);
  switch (slot.kind) {
    case "health-report":
      return byId(workspace.healthReport?.linkedDocumentId) ?? latest(candidates);
    case "study":
      return byId(activeStudyDocumentId(workspace, slot.key, STUDY_DOCUMENT_TAGS[slot.key]))
        ?? latest(candidates.filter(document => document.status !== "archived"))
        ?? latest(candidates);
    default:
      return latest(candidates.filter(document => document.status !== "archived")) ?? latest(candidates);
  }
}

/** Qué se conservaría y qué se eliminaría al dejar un solo ejemplar de cada fuente. No modifica nada. */
export function planCurrentSourcesConsolidation(workspace: MunicipalityWorkspace): ConsolidationPlan {
  const slots: SourceSlot[] = [
    { kind: "health-report" },
    { kind: "localiza-salud" },
    { kind: "prioritisation" },
    ...(Object.keys(STUDY_DOCUMENT_TAGS) as ComplementaryStudyKey[]).map(key => ({ kind: "study" as const, key })),
  ];
  const entries: ConsolidationEntry[] = [];
  for (const slot of slots) {
    const keep = activeDocumentFor(workspace, slot);
    const remove = currentPredecessors(workspace, slot, keep?.id);
    if (remove.length > 0) entries.push({ slot, label: slotLabel(slot), keep, remove });
  }
  const replacedCopies =
    (workspace.ibseStudyHistory ?? []).filter(entry => entry.documents.every(document => !isHistoricalDocument(document))).length +
    (workspace.complementaryStudyHistory ?? []).filter(entry => entry.documents.every(document => !isHistoricalDocument(document))).length +
    (workspace.archivedAssetEvidence?.length ? 1 : 0);
  return { entries, replacedCopies, isEmpty: entries.length === 0 && replacedCopies === 0 };
}

/** Aplica el plan: elimina los ejemplares sobrantes y las copias internas de sustituciones anteriores. */
export function applyCurrentSourcesConsolidation(
  workspace: MunicipalityWorkspace,
  plan: ConsolidationPlan,
  now: string,
): MunicipalityWorkspace {
  const ids = plan.entries.flatMap(entry => entry.remove.map(document => document.id));
  const cleaned = removeDocuments(workspace, ids, now);
  return {
    ...cleaned,
    ...(cleaned.ibseStudyHistory
      ? { ibseStudyHistory: cleaned.ibseStudyHistory.filter(entry => entry.documents.some(isHistoricalDocument)) }
      : {}),
    ...(cleaned.complementaryStudyHistory
      ? { complementaryStudyHistory: cleaned.complementaryStudyHistory.filter(entry => entry.documents.some(isHistoricalDocument)) }
      : {}),
    ...(cleaned.archivedAssetEvidence ? { archivedAssetEvidence: [] } : {}),
    updatedAt: now,
  };
}

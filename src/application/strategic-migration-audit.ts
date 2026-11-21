import type { MunicipalityWorkspace } from "../domain/workspace";
import type { MunicipalDocument } from "../domain/repository";
import { STRATEGIC_REFERENCES } from "./strategic-reference-library";

/** Informe de separación, sin ninguna mutación ni promesa de traslado. */
export type StrategicDisposition = "referencia-exacta" | "revisar-posible-comun" | "mantener-municipal";

export interface StrategicDocumentAudit {
  documentId: string;
  title: string;
  disposition: StrategicDisposition;
  matchedReferenceId?: string;
  reason: string;
  sourceUrl?: string;
  version?: number;
  originalRegistered: boolean;
  evidenceLinks: number;
  conciliationLinks: number;
  assetValidationLinks: number;
  revisionLinks: number;
  /** El estado del repositorio no acredita original recuperable desde Firebase. */
  sha256?: string;
}

export interface StrategicMigrationAudit {
  schema: "compas-strategic-audit-v1";
  municipalityId: string;
  municipalityName: string;
  repositoryVersion: string;
  generatedAt: string;
  mode: "read-only";
  records: StrategicDocumentAudit[];
  totals: {
    strategic: number;
    exactReference: number;
    requiresReview: number;
    municipal: number;
    withDependencies: number;
    withOriginalRecord: number;
  };
}

/** Coincidencia exclusiva con la ruta oficial empaquetada: un título similar
 * no demuestra identidad documental, vigencia ni archivo idéntico. */
function exactReference(doc: MunicipalDocument): string | undefined {
  const source = doc.source.url?.trim();
  if (!source) return undefined;
  return STRATEGIC_REFERENCES.find(r => source === r.sourcePath || source === r.url)?.id;
}

function disposition(doc: MunicipalDocument): {kind: StrategicDisposition; reason: string; matchedReferenceId?: string} {
  const exact = exactReference(doc);
  if (exact) return {
    kind: "referencia-exacta",
    reason: "Ruta de fuente idéntica a una referencia común empaquetada. Comprobar original, versión y vínculos antes de retirar la ficha municipal.",
    matchedReferenceId: exact,
  };
  const local = doc.territorialScale === "municipio" || doc.tags.some(tag => /^(municipal|local|plan-local|relais-local)$/i.test(tag));
  if (local) return {kind: "mantener-municipal", reason: "Ámbito municipal explícito; no migrar automáticamente a biblioteca general."};
  return {kind: "revisar-posible-comun", reason: "Naturaleza estratégica declarada, pero no hay coincidencia exacta con un original común. Revisar emisor, ámbito, título, año y huella."};
}

export function auditStrategicMigration(workspace: MunicipalityWorkspace, now = new Date().toISOString()): StrategicMigrationAudit {
  const documents = workspace.repository.documents;
  const records = documents.filter(doc => doc.kind === "strategic-framework").map(doc => {
    const classification = disposition(doc);
    const evidenceLinks = workspace.evidenceStore.atoms.filter(atom => atom.provenance.documentId === doc.id).length;
    const conciliationLinks = (workspace.repository.conciliations ?? []).filter(c => c.historical.documentId === doc.id || c.current.documentId === doc.id).length;
    const assetValidationLinks = (workspace.repository.assetValidations ?? []).filter(v => v.documentId === doc.id).length;
    const revisionLinks = documents.filter(other => other.revisionOf === doc.id).length + (doc.revisionOf ? 1 : 0);
    return {
      documentId: doc.id,
      title: doc.title,
      disposition: classification.kind,
      ...(classification.matchedReferenceId ? {matchedReferenceId: classification.matchedReferenceId} : {}),
      reason: classification.reason,
      ...(doc.source.url ? {sourceUrl: doc.source.url} : {}),
      ...(doc.revisionNumber ? {version: doc.revisionNumber} : {}),
      originalRegistered: (workspace.documentOriginals ?? []).some(original => original.documentId === doc.id),
      evidenceLinks,
      conciliationLinks,
      assetValidationLinks,
      revisionLinks,
      ...(doc.contentSha256 ? {sha256: doc.contentSha256} : {}),
    };
  });
  return {
    schema: "compas-strategic-audit-v1",
    municipalityId: workspace.municipality.identity.id,
    municipalityName: workspace.municipality.identity.name,
    repositoryVersion: workspace.repository.updatedAt,
    generatedAt: now,
    mode: "read-only",
    records,
    totals: {
      strategic: records.length,
      exactReference: records.filter(r => r.disposition === "referencia-exacta").length,
      requiresReview: records.filter(r => r.disposition === "revisar-posible-comun").length,
      municipal: records.filter(r => r.disposition === "mantener-municipal").length,
      withDependencies: records.filter(r => r.evidenceLinks + r.conciliationLinks + r.assetValidationLinks + r.revisionLinks > 0).length,
      withOriginalRecord: records.filter(r => r.originalRegistered).length,
    },
  };
}

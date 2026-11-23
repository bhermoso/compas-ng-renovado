import { evidenceHasDocument, type EvidenceAtom, type EvidenceDocumentSource } from "../../domain/evidence";
import type { MunicipalDocument } from "../../domain/repository";
import { localizaRecordKey, localizaSaludResourceLines } from "./DocumentToEvidencePipeline";

/** Quita el vínculo a la ficha y conserva la evidencia cuando tiene otra fuente. */
export function removeDocumentEvidence(
  atoms: readonly EvidenceAtom[],
  documentId: string,
  remainingDocuments: readonly MunicipalDocument[],
  municipalityId: string,
  recoverFromText: boolean = false,
): EvidenceAtom[] {
  const available = new Map(remainingDocuments
    .filter(document => document.id !== documentId && document.municipalityId === municipalityId && document.status !== "rejected")
    .map(document => [document.id, document]));
  const records = new Map<string, MunicipalDocument[]>();
  if (recoverFromText) {
    // Compatibilidad con cargas Localiza realizadas antes de guardar la segunda procedencia.
    for (const document of available.values()) {
      if (document.kind !== "localiza-salud" || !document.sourceText) continue;
      for (const key of new Set(localizaSaludResourceLines(document.sourceText).map(localizaRecordKey))) {
        const matches = records.get(key) ?? [];
        matches.push(document);
        records.set(key, matches);
      }
    }
  }
  return atoms.flatMap(atom => {
    if (atom.municipalityId !== municipalityId || !evidenceHasDocument(atom, documentId)) return [atom];
    const { provenance } = atom;
    const additional = (provenance.additionalDocuments ?? []).filter(source => source.documentId !== documentId);
    if (provenance.documentId !== documentId) {
      return [{ ...atom, provenance: { ...provenance, additionalDocuments: additional } }];
    }
    const recovered: EvidenceDocumentSource[] = recoverFromText && provenance.origin === "localiza-salud"
      ? (records.get(localizaRecordKey(atom.content)) ?? []).map(document => ({
          documentId: document.id, sourceLabel: document.title, extractedAt: document.createdAt,
        }))
      : [];
    const sources = new Map(recovered.map(source => [source.documentId, source]));
    for (const source of additional) sources.set(source.documentId, source);
    const surviving = [...sources.values()].filter(source => available.has(source.documentId));
    const replacement = surviving.find(source => available.get(source.documentId)?.status !== "archived") ?? surviving[0];
    if (!replacement) return [];
    sources.delete(replacement.documentId);
    return [{
      ...atom,
      provenance: { ...provenance, ...replacement, additionalDocuments: [...sources.values()] },
    }];
  });
}

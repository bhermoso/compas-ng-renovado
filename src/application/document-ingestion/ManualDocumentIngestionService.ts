import {
  addMunicipalDocument,
  type DocumentKind,
  type DocumentTemporalMetadata,
  type MunicipalDocument,
  type MunicipalDocumentRepository,
} from "../../domain/repository";
import type { EvidenceStore } from "../../domain/evidence";
import {
  transformDocumentToEvidence,
  type DeclaredDocumentStructure,
} from "../evidence-pipeline";

export interface IngestManualDocumentInput {
  documentId?: string;
  repository: MunicipalDocumentRepository;
  evidenceStore: EvidenceStore;
  kind: DocumentKind;
  title: string;
  plainText: string;
  /** Nombre del fichero original cargado (opcional, para trazabilidad documental). */
  sourceFileName?: string;
  /** Descripción del sistema de origen. Por defecto "Entrada manual inicial". */
  sourceSystem?: string;
  /** Estructura del texto declarada por el equipo técnico. */
  structure?: DeclaredDocumentStructure;
  /** Metadatos temporales declarados antes de la carga (bandeja de revisión). */
  temporal?: DocumentTemporalMetadata;
}

export interface IngestManualDocumentResult {
  repository: MunicipalDocumentRepository;
  evidenceStore: EvidenceStore;
  document: MunicipalDocument;
  atomsCreated: number;
}

export function ingestManualDocument(
  input: IngestManualDocumentInput
): IngestManualDocumentResult | null {
  const cleanTitle = input.title.trim();
  const cleanText = input.plainText.trim();

  if (cleanTitle.length === 0 || cleanText.length === 0) {
    return null;
  }

  const documentId = input.documentId ?? crypto.randomUUID();

  const nextRepository = addMunicipalDocument(input.repository, {
    id: documentId,
    kind: input.kind,
    title: cleanTitle,
    source: {
      system: input.sourceSystem ?? "Entrada manual inicial",
      collectedAt: new Date().toISOString(),
    },
    sourceFileName: input.sourceFileName,
    sourceText: cleanText,
    tags: [input.kind],
    ...(input.temporal !== undefined ? { temporal: input.temporal } : {}),
  });

  const registeredDocument = nextRepository.documents.find(
    (document) => document.id === documentId
  );

  if (registeredDocument === undefined) {
    return null;
  }

  const evidenceResult = transformDocumentToEvidence({
    store: input.evidenceStore,
    document: registeredDocument,
    plainText: cleanText,
    structure: input.structure,
  });

  return {
    repository: nextRepository,
    evidenceStore: evidenceResult.store,
    document: registeredDocument,
    atomsCreated: evidenceResult.atomsCreated.length,
  };
}

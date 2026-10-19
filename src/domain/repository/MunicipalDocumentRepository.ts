import type { MunicipalityId } from "../municipality";

export type DocumentId = string;

export type DocumentKind =
  | "health-report"
  | "complementary-study"
  | "eas-variable"
  | "cmi-indicator"
  | "community-asset"
  | "localiza-salud"
  | "strategic-framework"
  | "redcap-export"
  | "territorial-documentation"
  | "qualitative-material"
  | "longitudinal-evidence"
  | "other";

export type DocumentStatus =
  | "uploaded"
  | "validated"
  | "rejected"
  | "archived";

export interface DocumentSource {
  organization?: string;
  system?: string;
  url?: string;
  collectedAt?: string;
}

/**
 * Naturaleza documental fina (Incremento 5A). Cualifica QUÉ es el documento sin
 * atomizarlo; NO sustituye a `kind` (que gobierna el display del Repositorio),
 * lo precisa. Opcional y retrocompatible.
 */
export type DocumentNature =
  | "ugc-clinical-assistance-report"; // informe clínico-asistencial por UGC (Vigilancia Integral de la Salud)

/**
 * Escala territorial del documento. Explicita que una UGC NO es un distrito
 * municipal ni un distrito sanitario: evita confundir escalas aguas abajo.
 */
export type DocumentTerritorialScale =
  | "unidad-gestion-clinica"
  | "distrito"
  | "municipio"
  | "unknown";

/**
 * Modo en que el contenido está presente en el workspace. `full-text-non-atomized`
 * = texto íntegro persistido, sin atomizar ni interpretar (no genera EvidenceAtoms).
 */
export type DocumentContentMode =
  | "full-text-non-atomized"
  | "atomized"
  | "reference-only";

/**
 * Ciclo diagnóstico al que pertenece la fuente. Lo declara el equipo técnico:
 * nunca se infiere del texto. Un documento sin `cycle` tiene periodo no declarado.
 */
export type DocumentCycleStatus = "current" | "historical";

export interface DocumentCycle {
  status: DocumentCycleStatus;
  /** Año de referencia de la fuente, declarado por el equipo técnico. */
  referenceYear?: number;
}

/**
 * Conciliación declarada por el equipo técnico entre una fuente de ciclo
 * histórico y una de ciclo actual sobre la misma pregunta o indicador. No se
 * genera ni se propone automáticamente: cada entrada es una decisión humana.
 */
export type ConciliationRelation = "convergence" | "divergence" | "not-comparable";

export interface ConciliationSide {
  documentId: DocumentId;
  /** Qué dice la fuente sobre el asunto, redactado por el equipo técnico. */
  statement: string;
}

export interface CycleConciliation {
  id: string;
  /** Pregunta o indicador que ambas fuentes comparten. */
  topic: string;
  relation: ConciliationRelation;
  historical: ConciliationSide;
  current: ConciliationSide;
  /** Nota del equipo técnico; en una divergencia, la contradicción no se resuelve aquí. */
  note?: string;
  declaredAt: string;
}

export interface MunicipalDocument {
  id: DocumentId;
  municipalityId: MunicipalityId;
  kind: DocumentKind;
  title: string;
  status: DocumentStatus;
  source: DocumentSource;
  sourceFileName?: string;
  sourceText?: string;
  canGenerateEvidence?: boolean;
  tags: string[];
  // Metadatos documentales finos (Incremento 5A) — opcionales, retrocompatibles.
  documentNature?: DocumentNature;
  territorialScale?: DocumentTerritorialScale;
  /** Unidad de Gestión Clínica de origen, cuando aplica (p. ej. "Zaidín Sur"). */
  ugc?: string;
  contentMode?: DocumentContentMode;
  cycle?: DocumentCycle;
  createdAt: string;
  updatedAt: string;
}

export interface MunicipalDocumentRepository {
  municipalityId: MunicipalityId;
  documents: MunicipalDocument[];
  /** Ausente mientras el equipo técnico no declare ninguna conciliación. */
  conciliations?: CycleConciliation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMunicipalDocumentRepositoryInput {
  municipalityId: MunicipalityId;
}

export interface AddMunicipalDocumentInput {
  id: DocumentId;
  kind: DocumentKind;
  title: string;
  source?: DocumentSource;
  sourceFileName?: string;
  sourceText?: string;
  canGenerateEvidence?: boolean;
  tags?: string[];
  documentNature?: DocumentNature;
  territorialScale?: DocumentTerritorialScale;
  ugc?: string;
  contentMode?: DocumentContentMode;
  cycle?: DocumentCycle;
}

function defaultCanGenerateEvidence(kind: DocumentKind): boolean {
  return kind !== "health-report";
}

export function createMunicipalDocumentRepository(
  input: CreateMunicipalDocumentRepositoryInput
): MunicipalDocumentRepository {
  const now = new Date().toISOString();

  return {
    municipalityId: input.municipalityId,
    documents: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addMunicipalDocument(
  repository: MunicipalDocumentRepository,
  input: AddMunicipalDocumentInput
): MunicipalDocumentRepository {
  const now = new Date().toISOString();

  const document: MunicipalDocument = {
    id: input.id,
    municipalityId: repository.municipalityId,
    kind: input.kind,
    title: input.title,
    status: "uploaded",
    source: input.source ?? {},
    sourceFileName: input.sourceFileName,
    sourceText: input.sourceText,
    canGenerateEvidence:
      input.canGenerateEvidence ?? defaultCanGenerateEvidence(input.kind),
    tags: input.tags ?? [],
    documentNature: input.documentNature,
    territorialScale: input.territorialScale,
    ugc: input.ugc,
    contentMode: input.contentMode,
    ...(input.cycle !== undefined ? { cycle: input.cycle } : {}),
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...repository,
    documents: [...repository.documents, document],
    updatedAt: now,
  };
}

/** Declara (o retira, con `undefined`) el ciclo de un documento. No toca sus átomos. */
export function setMunicipalDocumentCycle(
  repository: MunicipalDocumentRepository,
  documentId: DocumentId,
  cycle: DocumentCycle | undefined
): MunicipalDocumentRepository {
  const now = new Date().toISOString();
  return {
    ...repository,
    documents: repository.documents.map((doc) => {
      if (doc.id !== documentId) return doc;
      const { cycle: _previous, ...rest } = doc;
      void _previous;
      return { ...rest, ...(cycle !== undefined ? { cycle } : {}), updatedAt: now };
    }),
    updatedAt: now,
  };
}

export function addCycleConciliation(
  repository: MunicipalDocumentRepository,
  conciliation: Omit<CycleConciliation, "declaredAt">
): MunicipalDocumentRepository {
  const now = new Date().toISOString();
  return {
    ...repository,
    conciliations: [
      ...(repository.conciliations ?? []),
      { ...conciliation, declaredAt: now },
    ],
    updatedAt: now,
  };
}

export function removeCycleConciliation(
  repository: MunicipalDocumentRepository,
  conciliationId: string
): MunicipalDocumentRepository {
  const rest = (repository.conciliations ?? []).filter((c) => c.id !== conciliationId);
  const { conciliations: _previous, ...base } = repository;
  void _previous;
  return {
    ...base,
    ...(rest.length > 0 ? { conciliations: rest } : {}),
    updatedAt: new Date().toISOString(),
  };
}

export function describeDocumentCycle(cycle: DocumentCycle | undefined): string {
  if (cycle === undefined) return "Ciclo no declarado";
  const year = cycle.referenceYear !== undefined ? ` · ${cycle.referenceYear}` : "";
  return cycle.status === "current" ? `Ciclo actual${year}` : `Ciclo histórico${year}`;
}

// Para tipos documentales canónicos (una sola versión activa por municipio):
// elimina todas las entradas previas del mismo tipo y registra la nueva.
export function replaceMunicipalDocumentByKind(
  repository: MunicipalDocumentRepository,
  input: AddMunicipalDocumentInput
): MunicipalDocumentRepository {
  const now = new Date().toISOString();
  const withoutPrior: MunicipalDocumentRepository = {
    ...repository,
    documents: repository.documents.filter((doc) => doc.kind !== input.kind),
    updatedAt: now,
  };
  return addMunicipalDocument(withoutPrior, input);
}

export function validateMunicipalDocument(
  repository: MunicipalDocumentRepository,
  documentId: DocumentId
): MunicipalDocumentRepository {
  const now = new Date().toISOString();

  return {
    ...repository,
    documents: repository.documents.map((document) =>
      document.id === documentId
        ? { ...document, status: "validated", updatedAt: now }
        : document
    ),
    updatedAt: now,
  };
}

export function removeMunicipalDocument(
  repository: MunicipalDocumentRepository,
  documentId: DocumentId
): MunicipalDocumentRepository {
  const now = new Date().toISOString();
  return {
    ...repository,
    documents: repository.documents.filter((d) => d.id !== documentId),
    updatedAt: now,
  };
}

export function archiveMunicipalDocument(
  repository: MunicipalDocumentRepository,
  documentId: DocumentId
): MunicipalDocumentRepository {
  const now = new Date().toISOString();

  return {
    ...repository,
    documents: repository.documents.map((document) =>
      document.id === documentId
        ? { ...document, status: "archived", updatedAt: now }
        : document
    ),
    updatedAt: now,
  };
}

export function getDocumentsByKind(
  repository: MunicipalDocumentRepository,
  kind: DocumentKind
): MunicipalDocument[] {
  return repository.documents.filter((document) => document.kind === kind);
}

export function getValidatedDocuments(
  repository: MunicipalDocumentRepository
): MunicipalDocument[] {
  return repository.documents.filter(
    (document) => document.status === "validated"
  );
}

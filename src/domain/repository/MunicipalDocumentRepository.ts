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

/**
 * Validación de activos declarada por la persona validadora del equipo técnico.
 * Localiza Salud no exporta el estado de validación: lo declara el equipo, con el
 * documento de criterios aplicado. No se infiere del contenido del activo.
 */
export interface AssetValidationDeclaration {
  id: string;
  /** Documento de Localiza Salud cuyos activos se declaran validados. */
  documentId: DocumentId;
  /** Átomos concretos validados; ausente = todos los activos del documento. */
  atomIds?: string[];
  criteria: { title: string; version: string };
  /** Quién valida (perfil validador). */
  declaredBy: string;
  /** Fecha de la validación, declarada (AAAA-MM-DD). */
  validatedOn?: string;
  note?: string;
  declaredAt: string;
}

/**
 * Decisión del equipo técnico sobre una propuesta de conclusión u orientación del
 * Perfil (CONTRACT-LHPM v1.5, Art. 16 ter). El registro es acumulativo: una
 * decisión posterior sobre la misma propuesta sustituye a la anterior a efectos
 * de lectura, pero la anterior se conserva.
 */
export interface ProposalDecision {
  proposalId: string;
  decision: "elegida" | "descartada";
  decidedBy: string;
  /** Fecha y hora de la decisión (ISO 8601). */
  decidedAt: string;
  /** Motivo, recomendado sobre todo en los descartes. */
  motivo?: string;
  /** Redacción ajustada por el equipo; ausente = texto propuesto. */
  textoAjustado?: string;
}

/**
 * Propuesta de conclusión u orientación redactada por el equipo técnico en el
 * cierre interpretativo (CONTRACT-LHPM v1.6, Art. 16 ter 1 bis). Entra en el
 * mismo menú que las propuestas del sistema y no nace elegida.
 */
export interface AuthoredProposal {
  /** Identificador estable elegido por quien redacta (p. ej. "C1", "O1"). */
  id: string;
  kind: "conclusion" | "orientation";
  text: string;
  /** Evidencia citada: obligatoria; cada línea lleva documento y localización. */
  evidence: string[];
  /** Orientación: ids de las propuestas de conclusión de las que deriva. */
  conclusionIds?: string[];
  /** Grado de sustento de la relación (Art. 8 bis), cuando la propuesta se apoya en una. */
  sustento?: 1 | 2 | 3;
  /** Salvedades que el equipo declara (límites de la lectura). */
  cautelas?: string;
  authoredBy: string;
  authoredAt: string;
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
  /** Ausente mientras el equipo técnico no declare ninguna validación de activos. */
  assetValidations?: AssetValidationDeclaration[];
  /** Historial de decisiones sobre propuestas del Perfil; ausente mientras no haya ninguna. */
  proposalDecisions?: ProposalDecision[];
  /** Propuestas redactadas por el equipo técnico; ausente mientras no haya ninguna. */
  authoredProposals?: AuthoredProposal[];
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

export function addAssetValidation(
  repository: MunicipalDocumentRepository,
  validation: Omit<AssetValidationDeclaration, "declaredAt">
): MunicipalDocumentRepository {
  const now = new Date().toISOString();
  return {
    ...repository,
    assetValidations: [
      ...(repository.assetValidations ?? []),
      { ...validation, declaredAt: now },
    ],
    updatedAt: now,
  };
}

export function removeAssetValidation(
  repository: MunicipalDocumentRepository,
  validationId: string
): MunicipalDocumentRepository {
  const rest = (repository.assetValidations ?? []).filter((v) => v.id !== validationId);
  const { assetValidations: _previous, ...base } = repository;
  void _previous;
  return {
    ...base,
    ...(rest.length > 0 ? { assetValidations: rest } : {}),
    updatedAt: new Date().toISOString(),
  };
}

export function addProposalDecision(
  repository: MunicipalDocumentRepository,
  decision: ProposalDecision
): MunicipalDocumentRepository {
  return {
    ...repository,
    proposalDecisions: [...(repository.proposalDecisions ?? []), decision],
    updatedAt: new Date().toISOString(),
  };
}

export function addAuthoredProposal(
  repository: MunicipalDocumentRepository,
  proposal: AuthoredProposal
): MunicipalDocumentRepository {
  // Mismo id = nueva redacción de la misma propuesta: sustituye a la anterior.
  const others = (repository.authoredProposals ?? []).filter((p) => p.id !== proposal.id);
  return {
    ...repository,
    authoredProposals: [...others, proposal],
    updatedAt: new Date().toISOString(),
  };
}

export function removeAuthoredProposal(
  repository: MunicipalDocumentRepository,
  proposalId: string
): MunicipalDocumentRepository {
  const rest = (repository.authoredProposals ?? []).filter((p) => p.id !== proposalId);
  const { authoredProposals: _previous, ...base } = repository;
  void _previous;
  return {
    ...base,
    ...(rest.length > 0 ? { authoredProposals: rest } : {}),
    updatedAt: new Date().toISOString(),
  };
}

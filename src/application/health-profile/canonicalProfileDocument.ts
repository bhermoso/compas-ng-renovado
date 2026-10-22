/**
 * canonicalProfileDocument
 *
 * Contrato del DOCUMENTO CANÓNICO del Perfil de Salud Local (esquema 2),
 * fundamento de GOV-SALIDA-01: una única fuente semántica de la que derivan
 * pantalla, impresión, DOCX y PDF (proyección mecánica en incrementos
 * posteriores).
 *
 * Dos estructuras HERMANAS, nunca anidadas:
 *   - `editorialView`  → la LECTURA editorial (y solo la lectura).
 *   - `technicalSpace` → el ESPACIO TÉCNICO posterior (referencias, matriz,
 *      cautelas, base documental, estado del conocimiento).
 *
 * Ambas se construyen desde un ÚNICO `CanonicalBuildContext` disponible ANTES de
 * compilar (derivado del PSL validado + Perfil + answers). Ningún builder depende
 * del artefacto compilado. La compilación se limita a SELLAR el resultado y a
 * añadir metadata no semántica (hash, ids, versión) fuera de este contrato.
 */

import type { LocalHealthProfile, PerfilLocalDeSalud } from "../../domain/health-profile";
import type {
  LocalHealthProfileStatus,
  PSLPriorizacion,
  PSLScaffoldChapter,
} from "../../domain/health-profile";
import type { PSLCSealedCanonicalDocument } from "../../domain/health-profile-artifact";
import type { DiagnosticAnswers } from "./diagnosticAnswers";
import type { CanonicalAntecedents } from "./antecedents";
import type { CanonicalReadingUnits } from "../localiza-assets";
import type { CanonicalChosenClosing } from "../proposals";
import type {
  ProfileIntegratedEditorialHeader,
  ProfileIntegratedEditorialOverviewMessage,
  ProfileIntegratedEditorialSourceBlock,
  ProfileIntegratedEditorialReadingBlock,
  ProfileIntegratedEditorialClosingColumn,
  ProfileIntegratedDiagnosticSynthesis,
} from "./profileIntegratedEditorialView";
import { buildProfileIntegratedEditorialView } from "./profileIntegratedEditorialView";
import type { IntegratedInterpretation } from "./integratedInterpretation";
import type { TrazadorRow, GrupoMotorCard } from "./profileDiagnosticVisuals";
import { buildDiagnosticVisuals } from "./profileDiagnosticVisuals";
import type { MatrizAnexo } from "./profileSynthesisView";
import { buildMatrizAnexo, buildProfileSynthesis } from "./profileSynthesisView";
import type { CausalStatus } from "./profileScientificFramework";
import type { IndicatorComparisonReference } from "./complementaryIndicatorReferences";
import { formatIndicatorValue } from "./complementaryIndicatorReferences";
import { institutionalHealthReportTitle } from "./healthReportSanitaryReading";
import type { PerfilEstadoGlobal } from "./profileOperations";
import { computePerfilEstadoGlobal } from "./profileOperations";

// ── Primitivas del esquema canónico (reubicadas desde psl-c-canonical) ─────────

/** Versión del esquema del documento canónico. Distinta de `artifactVersion`. */
export const PSLC_CANONICAL_SCHEMA_VERSION = 2 as const;

export type PSLCReadingStatus = "integrated" | "prioritization-pending";

/**
 * Declaración digna de lectura territorial pendiente (regla N+1). Constante
 * compartida para que pantalla, visor, DOCX y PDF declaren lo mismo.
 */
export const PRIORITIZATION_PENDING_DECLARATION =
  "La lectura territorial integrada está pendiente: este Perfil es válido por la " +
  "regla N+1 —el Informe de Salud interpretado junto a al menos una fuente adicional " +
  "(estudios complementarios, activos y capacidades, o priorización ciudadana)—, pero " +
  "esa fuente todavía no sostiene una lectura territorial atomizada. Es conocimiento " +
  "pendiente de incorporación, no ausencia de conocimiento; el documento no fabrica " +
  "una lectura que la evidencia aún no permite. Cuando la priorización ciudadana está " +
  "presente, su incorporación interpretativa como evidencia queda explícitamente pendiente.";

/** Enunciado fijo de frontera con el Plan de Acción (el Perfil concluye y orienta; no decide, Art. 16 bis). */
export const CANONICAL_FRONTIER_STATEMENT =
  "Este Perfil de Salud Local concluye y orienta técnicamente: no fija actuaciones, " +
  "programas, objetivos estratégicos ni prioridades. La traducción a prioridades y " +
  "acciones corresponde al Plan de Acción, que es una fase posterior del proceso de " +
  "planificación y se elabora con el Grupo Motor a partir de este documento.";

/** Nota institucional fija de cautela metodológica de cualquier PSL-C. */
export const CANONICAL_INSTITUTIONAL_CAUTION_NOTE =
  "Este documento ha sido generado por COMPÁS NG a partir de evidencia " +
  "estructurada y contenido de autoría humana. Las interpretaciones " +
  "territoriales y las áreas de intervención son propuestas técnicas " +
  "que requieren validación institucional. COMPÁS NG no adopta decisiones " +
  "de planificación; facilita su fundamentación.";

const PSL_STATUS_LABEL: Record<LocalHealthProfileStatus, string> = {
  generated: "Documento de trabajo",
  review: "En revisión técnica",
  validated: "Validado técnicamente",
  approved: "Aprobado",
  superseded: "Sustituido",
  archived: "Archivado",
};

export function pslStatusLabel(status: LocalHealthProfileStatus): string {
  return PSL_STATUS_LABEL[status];
}

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * Formateo de fecha determinista e independiente del entorno: componentes UTC
 * y nombres de mes fijos (no ICU, no TZ local). Base de la reproducibilidad del
 * sello.
 */
export function formatCanonicalDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "fecha no disponible";
  return `${d.getUTCDate()} de ${MESES_ES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

// ── Value objects hoja ──────────────────────────────────────────────────────────

export interface CanonicalAuthoredClosing {
  kind: "authored-closing";
  content: string;
  authorLabel: string | null;
  authoringStatus: "scaffold" | "review" | "authored" | null;
  provenance: { source: "cierreInterpretativo"; generatedBySystem: false };
}

export interface CanonicalInstitutionalBoundary {
  kind: "institutional-boundary";
  statement: string;
  candidaturas: string[];
  consensoDocumentado: boolean;
}

export interface CanonicalDocumentaryBase {
  evidenceAtoms: number;
  complementaryStudies: number;
  informeTitle: string | null;
  informeSections: number | null;
  scaleWarnings: string[];
}

export interface CanonicalMethodologicalCaution {
  id: string;
  text: string;
  origin: "institutional-note" | "integrity-warning" | "scale-limitation" | "block-note";
}

export interface CanonicalKnowledgeState {
  interpretacionesActivas: number;
  interpretacionesSuperadas: number;
  hipotesisActivas: number;
  hipotesisResueltas: number;
  hipotesisDescartadas: number;
  preguntasAbiertas: number;
  preguntasResueltas: number;
  tieneSintesis: boolean;
}

export interface CanonicalComparativeReference {
  indicatorId: string;
  indicatorTitle: string;
  value: string;
  provinceReference: string;
  andalusiaReference: string;
  scale: "proxy contextual" | "muestra local";
}

export interface CanonicalEpistemicMatrixRow {
  senal: string;
  fuente: string;
  escala: string;
  mecanismo: string;
  estatusCausal: CausalStatus;
  pregunta: string;
  desigualdad: string | null;
  activoCapacidad: string | null;
}

/** Barra de peso textual del Informe (menciones), nunca prevalencia. */
export interface CanonicalInformeRankingItem {
  etiqueta: string;
  valor: number;
  max: number;
}

export interface CanonicalInformeRanking {
  items: CanonicalInformeRankingItem[];
  unidad: string;
  caption: string;
}

/** Señal principal para deliberación (fila compacta). */
export interface CanonicalPrincipalSignal {
  grupo: string;
  senal: string;
  fuente: string;
  pregunta: string;
}

// ── Contexto vivo único ──────────────────────────────────────────────────────

export interface CanonicalReadingCounters {
  totalEvidenceAtoms: number;
  complementaryStudyCount: number;
  assetCount: number;
  hasParticipatoryPrioritisation: boolean;
}

export interface CanonicalBuildContext {
  answers: DiagnosticAnswers;
  territory: string;
  statusLabel: string;
  informeTitulo: string | null;
  generatedDateLabel: string;
  counters: CanonicalReadingCounters;
  authoredClosing: CanonicalAuthoredClosing | null;
  boundary: CanonicalInstitutionalBoundary;
  cautions: CanonicalMethodologicalCaution[];
  documentaryBase: CanonicalDocumentaryBase;
  knowledgeState: CanonicalKnowledgeState | null;
}

// ── Lectura editorial y espacio técnico (runtime normalizado) ────────────────

export interface CanonicalEditorialView {
  kind: "canonical-editorial-view";
  header: ProfileIntegratedEditorialHeader;
  overview: ProfileIntegratedEditorialOverviewMessage[];
  sourceBlocks: ProfileIntegratedEditorialSourceBlock[];
  /** Ranking de peso textual del Informe (visualización de la lectura). null si no hay Informe. */
  informeSignalRanking: CanonicalInformeRanking | null;
  territorialReadings: ProfileIntegratedEditorialReadingBlock[];
  /** Lectura por tema. La clave no existe si ninguna fuente sostiene un tema. */
  readingUnits?: CanonicalReadingUnits;
  /** Conclusiones y orientaciones elegidas por el equipo técnico; la clave no existe si no hay ninguna (Art. 16 ter). */
  chosenClosing?: CanonicalChosenClosing;
  /**
   * Fuentes de ciclos anteriores declarados. La clave no existe cuando el
   * expediente no declara ninguna, de modo que los documentos y sellos previos
   * quedan idénticos.
   */
  antecedents?: CanonicalAntecedents;
  interpretation: IntegratedInterpretation;
  diagnosticSynthesis: ProfileIntegratedDiagnosticSynthesis | null;
  tracerTable: TrazadorRow[];
  /** Señales principales para deliberación (visualización de la lectura). */
  principalSignals: CanonicalPrincipalSignal[];
  groupMotorAgenda: GrupoMotorCard[];
  closing: ProfileIntegratedEditorialClosingColumn[];
  readingStatus: PSLCReadingStatus;
  pendingDeclaration: string | null;
  humanClosing: CanonicalAuthoredClosing | null;
  institutionalBoundary: CanonicalInstitutionalBoundary;
}

export interface CanonicalTechnicalSpace {
  kind: "canonical-technical-space";
  documentaryBase: CanonicalDocumentaryBase;
  cautions: CanonicalMethodologicalCaution[];
  comparativeReferences: CanonicalComparativeReference[];
  epistemicMatrix: CanonicalEpistemicMatrixRow[];
  epistemicMatrixNotes: string[];
  knowledgeState: CanonicalKnowledgeState | null;
}

/** Procedencia sellada (trazabilidad diagnóstica). NO se renderiza. */
export interface PSLCCanonicalDocumentProvenance {
  diagnosticAnswersSnapshot: DiagnosticAnswers;
  prioritizationSnapshot: PSLPriorizacion;
}

export interface CanonicalProfileDocument {
  schemaVersion: typeof PSLC_CANONICAL_SCHEMA_VERSION;
  editorialView: CanonicalEditorialView;
  technicalSpace: CanonicalTechnicalSpace;
  generatedDateLabel: string;
  provenance: PSLCCanonicalDocumentProvenance;
}

// ── Wire serializado compatible con sellos v2 anteriores ─────────────────────

export interface SealedCanonicalProfileDocumentV2 {
  schemaVersion: 2;
  editorialView: {
    header: ProfileIntegratedEditorialHeader;
    overview: ProfileIntegratedEditorialOverviewMessage[];
    sourceBlocks: ProfileIntegratedEditorialSourceBlock[];
    territorialReadings: ProfileIntegratedEditorialReadingBlock[];
    readingUnits?: CanonicalReadingUnits;
    chosenClosing?: CanonicalChosenClosing;
    antecedents?: CanonicalAntecedents;
    interpretation: IntegratedInterpretation;
    diagnosticSynthesis?: ProfileIntegratedDiagnosticSynthesis | null;
    tracerTable: TrazadorRow[];
    groupMotorAgenda: GrupoMotorCard[];
    closing: ProfileIntegratedEditorialClosingColumn[];
    readingStatus?: PSLCReadingStatus;
    pendingDeclaration?: string | null;
    humanClosing?: CanonicalAuthoredClosing | null;
    institutionalBoundary?: CanonicalInstitutionalBoundary;
    informeSignalRanking?: CanonicalInformeRanking | null;
    principalSignals?: CanonicalPrincipalSignal[];
    technicalAnnex?: unknown;
  };
  technicalSpace?: CanonicalTechnicalSpace;
  readingStatus?: PSLCReadingStatus;
  generatedDateLabel?: string;
  provenance: PSLCCanonicalDocumentProvenance;
}

export interface NormalizedCanonicalProfileDocument {
  editorialView: CanonicalEditorialView;
  technicalSpace: CanonicalTechnicalSpace;
  generatedDateLabel: string;
  provenance: PSLCCanonicalDocumentProvenance;
}

export interface LegacyEditorialView {
  kind: "legacy-editorial-view";
  reason:
    | "missing-reading-status"
    | "missing-diagnostic-synthesis"
    | "missing-human-closing"
    | "missing-institutional-boundary"
    | "missing-technical-space";
}

export type CanonicalNormalizationResult =
  | NormalizedCanonicalProfileDocument
  | LegacyEditorialView;

export function isLegacyEditorialView(
  r: CanonicalNormalizationResult
): r is LegacyEditorialView {
  return (r as LegacyEditorialView).kind === "legacy-editorial-view";
}

// ── Identidades y orden de sección (paridad por ID, no por título) ───────────

export type CanonicalReadingSectionId =
  | "overview"
  | "source-blocks"
  | "informe-ranking"
  | "pending-declaration"
  | "reading-units"
  | "territorial-readings"
  | "antecedents"
  | "diagnostic-synthesis"
  | "tracer-table"
  | "principal-signals"
  | "group-motor-agenda"
  | "generated-closing"
  | "chosen-conclusions"
  | "chosen-orientations"
  | "human-closing"
  | "institutional-boundary";

export type CanonicalTechnicalSectionId =
  | "documentary-base"
  | "methodological-cautions"
  | "comparative-references"
  | "epistemic-matrix"
  | "knowledge-state"
  | "traceability";

export const CANONICAL_READING_ORDER = [
  "overview",
  "source-blocks",
  "informe-ranking",
  "pending-declaration",
  "reading-units",
  "territorial-readings",
  "antecedents",
  "diagnostic-synthesis",
  "tracer-table",
  "principal-signals",
  "group-motor-agenda",
  "generated-closing",
  "chosen-conclusions",
  "chosen-orientations",
  "human-closing",
  "institutional-boundary",
] as const satisfies readonly CanonicalReadingSectionId[];

export const CANONICAL_TECHNICAL_ORDER = [
  "documentary-base",
  "methodological-cautions",
  "comparative-references",
  "epistemic-matrix",
  "knowledge-state",
  "traceability",
] as const satisfies readonly CanonicalTechnicalSectionId[];

// ── Mappers puros de los value objects (desde fuentes vivas) ─────────────────

/** Cierre de autoría humana. content vacío ⇒ null (sin bloque vacío). */
export function buildAuthoredClosing(
  cierre: PSLScaffoldChapter
): CanonicalAuthoredClosing | null {
  if (cierre.content.trim().length === 0) return null;
  return {
    kind: "authored-closing",
    content: cierre.content,
    authorLabel: null,
    authoringStatus: cierre.status,
    provenance: { source: "cierreInterpretativo", generatedBySystem: false },
  };
}

export function buildInstitutionalBoundary(
  prio: PSLPriorizacion
): CanonicalInstitutionalBoundary {
  return {
    kind: "institutional-boundary",
    statement: CANONICAL_FRONTIER_STATEMENT,
    candidaturas: prio.candidaturasTecnicas.map((c) => c.title),
    consensoDocumentado: prio.consensoDocumentado,
  };
}

/** Cautelas metodológicas del espacio técnico: nota fija + integridad + escala. */
export function buildMethodologicalCautions(
  psl: LocalHealthProfile
): CanonicalMethodologicalCaution[] {
  const cautions: CanonicalMethodologicalCaution[] = [
    {
      id: "institutional-note",
      text: CANONICAL_INSTITUTIONAL_CAUTION_NOTE,
      origin: "institutional-note",
    },
  ];
  if (psl.integrityWarnings > 0 || psl.integrityErrors > 0) {
    cautions.push({
      id: "integrity-warning",
      text:
        `${psl.integrityWarnings} aviso(s) y ${psl.integrityErrors} error(es) de ` +
        `integridad registrados en la compilación.`,
      origin: "integrity-warning",
    });
  }
  (psl.limitacionesDiagnosticas ?? []).forEach((lim, i) => {
    cautions.push({
      id: `scale-limitation-${i}`,
      text: lim,
      origin: "scale-limitation",
    });
  });
  return cautions;
}

export function buildDocumentaryBase(
  psl: LocalHealthProfile,
  informeTitulo: string | null
): CanonicalDocumentaryBase {
  return {
    evidenceAtoms: psl.totalEvidenceAtoms,
    complementaryStudies: psl.complementaryStudyCount,
    informeTitle: informeTitulo,
    informeSections:
      psl.healthReportTitle !== undefined ? psl.healthReportSectionCount : null,
    scaleWarnings: [...(psl.limitacionesDiagnosticas ?? [])],
  };
}

export function buildKnowledgeState(
  estado: PerfilEstadoGlobal
): CanonicalKnowledgeState {
  return {
    interpretacionesActivas: estado.interpretacionesActivas,
    interpretacionesSuperadas: estado.interpretacionesSuperadas,
    hipotesisActivas: estado.hipotesisActivas,
    hipotesisResueltas: estado.hipotesisResueltas,
    hipotesisDescartadas: estado.hipotesisDescartadas,
    preguntasAbiertas: estado.preguntasAbiertas,
    preguntasResueltas: estado.preguntasResueltas,
    tieneSintesis: estado.tieneSintesis,
  };
}

function referenceToComparative(
  r: IndicatorComparisonReference
): CanonicalComparativeReference {
  const fmt = (v: number | string | undefined): string =>
    v !== undefined ? formatIndicatorValue(v, r.unit) : "no disponible";
  return {
    indicatorId: r.indicatorId,
    indicatorTitle: r.indicatorTitle,
    value: fmt(r.territorialValue),
    provinceReference: fmt(r.provinceReference),
    andalusiaReference: fmt(r.andalusiaReference),
    scale: r.demoProxy ? "proxy contextual" : "muestra local",
  };
}

function matrizFilaToRow(
  f: MatrizAnexo["filas"][number]
): CanonicalEpistemicMatrixRow {
  return {
    senal: f.senal,
    fuente: f.fuente,
    escala: f.escala,
    mecanismo: f.mecanismo,
    estatusCausal: f.estatusCausal,
    pregunta: f.pregunta,
    desigualdad: f.desigualdad ?? null,
    activoCapacidad: f.activoCapacidad ?? null,
  };
}

// ── Ensamblado del contexto vivo (usable ANTES de compilar) ──────────────────

export interface BuildCanonicalBuildContextInput {
  psl: LocalHealthProfile;
  perfil: PerfilLocalDeSalud | undefined;
  answers: DiagnosticAnswers;
  territory: string;
}

export function buildCanonicalBuildContext(
  input: BuildCanonicalBuildContextInput
): CanonicalBuildContext {
  const { psl } = input;
  const informeTitulo =
    psl.healthReportTitle !== undefined
      ? institutionalHealthReportTitle(psl.municipalityId, psl.healthReportTitle)
      : null;
  return {
    answers: input.answers,
    territory: input.territory,
    statusLabel: pslStatusLabel(psl.status),
    informeTitulo,
    generatedDateLabel: formatCanonicalDate(psl.generatedAt),
    counters: {
      totalEvidenceAtoms: psl.totalEvidenceAtoms,
      complementaryStudyCount: psl.complementaryStudyCount,
      assetCount: psl.assetCount,
      hasParticipatoryPrioritisation:
        psl.thematicPrioritisationPresent ||
        psl.priorizacion.hasParticipatorySelection,
    },
    authoredClosing: buildAuthoredClosing(psl.cierreInterpretativo),
    boundary: buildInstitutionalBoundary(psl.priorizacion),
    cautions: buildMethodologicalCautions(psl),
    documentaryBase: buildDocumentaryBase(psl, informeTitulo),
    knowledgeState:
      input.perfil !== undefined
        ? buildKnowledgeState(computePerfilEstadoGlobal(input.perfil))
        : null,
  };
}

// ── Builders puros: lectura y espacio técnico ────────────────────────────────

export function buildCanonicalEditorialView(
  ctx: CanonicalBuildContext
): CanonicalEditorialView {
  // El builder compartido produce la lectura (y su technicalAnnex, que aquí se
  // ignora: el material técnico vive en el hermano `technicalSpace`).
  const ov = buildProfileIntegratedEditorialView(ctx.answers, {
    territory: ctx.territory,
    status: ctx.statusLabel,
    informeTitulo: ctx.informeTitulo ?? undefined,
    generatedDate: ctx.generatedDateLabel,
  });

  // El estatuto de lectura lo decide el CONTEXTO (Art. 7 bis §3): se exige
  // evidencia real concordante entre contadores del PSL y answers compilados.
  const hasRealStudies =
    ctx.counters.complementaryStudyCount > 0 && ctx.answers.estudios.totalStudies > 0;
  const hasRealAssets =
    ctx.counters.assetCount > 0 && ctx.answers.salutogenica.totalAssets > 0;
  const hasReadingBearingEvidence = hasRealStudies || hasRealAssets;
  const readingStatus: PSLCReadingStatus =
    ctx.counters.totalEvidenceAtoms > 0 &&
    hasReadingBearingEvidence &&
    ov.territorialReadings.length > 0
      ? "integrated"
      : "prioritization-pending";

  const territorialReadings =
    readingStatus === "prioritization-pending" ? [] : ov.territorialReadings;
  const pendingDeclaration =
    readingStatus === "prioritization-pending" ? PRIORITIZATION_PENDING_DECLARATION : null;

  // Visualizaciones de la lectura (peso textual del Informe y señales
  // principales): derivadas de los mismos answers, forman parte de la lectura
  // canónica —no del espacio técnico— para que todas las salidas las conserven.
  const synthesis = buildProfileSynthesis(ctx.answers, {
    informeTitulo: ctx.informeTitulo ?? undefined,
    scopeNoun: "territorio",
  });
  const visuals = buildDiagnosticVisuals(ctx.answers, {
    informeTitulo: ctx.informeTitulo ?? undefined,
  });
  const informeSignalRanking: CanonicalInformeRanking | null =
    visuals.informeChart !== undefined
      ? {
          items: visuals.informeChart.items.map((i) => ({
            etiqueta: i.etiqueta,
            valor: i.valor,
            max: visuals.informeChart!.maxValor,
          })),
          unidad: visuals.informeChart.unidad,
          caption: visuals.informeChart.caption,
        }
      : null;
  const principalSignals: CanonicalPrincipalSignal[] =
    synthesis.senalesPrincipales.map((r) => ({
      grupo: r.grupo,
      senal: r.senal,
      fuente: r.fuente,
      pregunta: r.pregunta,
    }));

  return {
    kind: "canonical-editorial-view",
    header: ov.header,
    overview: ov.overview,
    sourceBlocks: ov.sourceBlocks,
    informeSignalRanking,
    territorialReadings,
    ...(ctx.answers.lecturaPorTema !== undefined
      ? { readingUnits: ctx.answers.lecturaPorTema }
      : {}),
    ...(ctx.answers.cierreElegido !== undefined
      ? { chosenClosing: ctx.answers.cierreElegido }
      : {}),
    ...(ctx.answers.antecedentes !== undefined
      ? { antecedents: ctx.answers.antecedentes }
      : {}),
    interpretation: ov.interpretation,
    diagnosticSynthesis:
      readingStatus === "integrated" ? ov.diagnosticSynthesis : null,
    tracerTable: ov.tracerTable,
    principalSignals,
    groupMotorAgenda: ov.groupMotorAgenda,
    closing: ov.closing,
    readingStatus,
    pendingDeclaration,
    humanClosing: ctx.authoredClosing,
    institutionalBoundary: ctx.boundary,
  };
}

export function buildCanonicalTechnicalSpace(
  ctx: CanonicalBuildContext
): CanonicalTechnicalSpace {
  const matriz = buildMatrizAnexo(ctx.answers);
  return {
    kind: "canonical-technical-space",
    documentaryBase: ctx.documentaryBase,
    cautions: ctx.cautions,
    comparativeReferences: ctx.answers.referencias.references.map(
      referenceToComparative
    ),
    epistemicMatrix: matriz.filas.map(matrizFilaToRow),
    epistemicMatrixNotes: [...matriz.notasBloque],
    knowledgeState: ctx.knowledgeState,
  };
}

/** Clon detach y serializable (no aliasa el objeto vivo). */
function detachClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function assembleCanonicalProfileDocument(
  ctx: CanonicalBuildContext,
  provenance: PSLCCanonicalDocumentProvenance
): CanonicalProfileDocument {
  return {
    schemaVersion: PSLC_CANONICAL_SCHEMA_VERSION,
    editorialView: buildCanonicalEditorialView(ctx),
    technicalSpace: buildCanonicalTechnicalSpace(ctx),
    generatedDateLabel: ctx.generatedDateLabel,
    provenance,
  };
}

/** Construye el documento canónico directamente desde el PSL validado + Perfil. */
export function buildCanonicalProfileDocumentFromPSL(
  input: BuildCanonicalBuildContextInput
): CanonicalProfileDocument {
  const ctx = buildCanonicalBuildContext(input);
  return assembleCanonicalProfileDocument(ctx, {
    diagnosticAnswersSnapshot: detachClone(input.answers),
    prioritizationSnapshot: detachClone(input.psl.priorizacion),
  });
}

// ── API decomposicional (compilador legado y tests) ──────────────────────────

/**
 * Entrada decomposicional del documento canónico. Los campos nuevos son
 * OPCIONALES: el compilador los aporta ricos desde el PSL; cuando se omiten se
 * derivan de `pslContext` (frontera, base) o toman valores por defecto sobrios.
 */
export interface PSLCReadingContext {
  totalEvidenceAtoms: number;
  complementaryStudyCount: number;
  assetCount: number;
  hasParticipatoryPrioritisation: boolean;
  prioritizacion: PSLPriorizacion;
}

export interface BuildPSLCCanonicalDocumentInput {
  answers: DiagnosticAnswers;
  territory: string;
  status: LocalHealthProfileStatus;
  informeTitulo?: string;
  generatedAtISO: string;
  pslContext: PSLCReadingContext;
  authoredClosing?: CanonicalAuthoredClosing | null;
  boundary?: CanonicalInstitutionalBoundary;
  cautions?: CanonicalMethodologicalCaution[];
  documentaryBase?: CanonicalDocumentaryBase;
  knowledgeState?: CanonicalKnowledgeState | null;
}

export function buildPSLCCanonicalDocument(
  input: BuildPSLCCanonicalDocumentInput
): CanonicalProfileDocument {
  const informeTitulo = input.informeTitulo ?? null;
  const ctx: CanonicalBuildContext = {
    answers: input.answers,
    territory: input.territory,
    statusLabel: pslStatusLabel(input.status),
    informeTitulo,
    generatedDateLabel: formatCanonicalDate(input.generatedAtISO),
    counters: {
      totalEvidenceAtoms: input.pslContext.totalEvidenceAtoms,
      complementaryStudyCount: input.pslContext.complementaryStudyCount,
      assetCount: input.pslContext.assetCount,
      hasParticipatoryPrioritisation: input.pslContext.hasParticipatoryPrioritisation,
    },
    authoredClosing: input.authoredClosing ?? null,
    boundary: input.boundary ?? buildInstitutionalBoundary(input.pslContext.prioritizacion),
    cautions:
      input.cautions ?? [
        {
          id: "institutional-note",
          text: CANONICAL_INSTITUTIONAL_CAUTION_NOTE,
          origin: "institutional-note",
        },
      ],
    documentaryBase:
      input.documentaryBase ?? {
        evidenceAtoms: input.pslContext.totalEvidenceAtoms,
        complementaryStudies: input.pslContext.complementaryStudyCount,
        informeTitle: informeTitulo,
        informeSections: null,
        scaleWarnings: [],
      },
    knowledgeState: input.knowledgeState ?? null,
  };
  return assembleCanonicalProfileDocument(ctx, {
    diagnosticAnswersSnapshot: detachClone(input.answers),
    prioritizationSnapshot: detachClone(input.pslContext.prioritizacion),
  });
}

// ── Sellado, rehidratación y normalización ───────────────────────────────────

// djb2: determinista y sin dependencias. Prefijo `pslc-` (distinto del `psl-`).
function djb2Hex(payload: string): string {
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) + hash) ^ payload.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function sealCanonicalProfileDocument(
  doc: CanonicalProfileDocument
): PSLCSealedCanonicalDocument {
  const payload = JSON.stringify(doc);
  return {
    schemaVersion: PSLC_CANONICAL_SCHEMA_VERSION,
    payload,
    canonicalHash: `pslc-${djb2Hex(payload)}`,
  };
}

export function buildSealedCanonicalProfileDocument(
  input: BuildPSLCCanonicalDocumentInput
): PSLCSealedCanonicalDocument {
  return sealCanonicalProfileDocument(buildPSLCCanonicalDocument(input));
}

/**
 * Rehidrata el sello al runtime normalizado SIN fabricar contenido. Cualquier
 * pieza semántica nueva ausente ⇒ LegacyEditorialView (fallback histórico).
 * `null` si el esquema no es 2 (sello opaco o anterior).
 */
export function normalizeSealedCanonicalProfileDocument(
  sealed: PSLCSealedCanonicalDocument
): CanonicalNormalizationResult | null {
  if (sealed.schemaVersion !== PSLC_CANONICAL_SCHEMA_VERSION) return null;
  let parsed: SealedCanonicalProfileDocumentV2;
  try {
    parsed = JSON.parse(sealed.payload) as SealedCanonicalProfileDocumentV2;
  } catch {
    return null;
  }
  if (parsed.schemaVersion !== PSLC_CANONICAL_SCHEMA_VERSION) return null;

  const ev = parsed.editorialView;
  const readingStatus = ev.readingStatus ?? parsed.readingStatus;
  if (readingStatus === undefined) {
    return { kind: "legacy-editorial-view", reason: "missing-reading-status" };
  }
  if (ev.humanClosing === undefined) {
    return { kind: "legacy-editorial-view", reason: "missing-human-closing" };
  }
  if (ev.diagnosticSynthesis === undefined) {
    return { kind: "legacy-editorial-view", reason: "missing-diagnostic-synthesis" };
  }
  if (ev.institutionalBoundary === undefined) {
    return { kind: "legacy-editorial-view", reason: "missing-institutional-boundary" };
  }
  if (parsed.technicalSpace === undefined) {
    return { kind: "legacy-editorial-view", reason: "missing-technical-space" };
  }

  return {
    editorialView: {
      kind: "canonical-editorial-view",
      header: ev.header,
      overview: ev.overview,
      sourceBlocks: ev.sourceBlocks,
      informeSignalRanking: ev.informeSignalRanking ?? null,
      territorialReadings: ev.territorialReadings,
      ...(ev.readingUnits !== undefined ? { readingUnits: ev.readingUnits } : {}),
      ...(ev.chosenClosing !== undefined ? { chosenClosing: ev.chosenClosing } : {}),
      ...(ev.antecedents !== undefined ? { antecedents: ev.antecedents } : {}),
      interpretation: ev.interpretation,
      diagnosticSynthesis: ev.diagnosticSynthesis,
      tracerTable: ev.tracerTable,
      principalSignals: ev.principalSignals ?? [],
      groupMotorAgenda: ev.groupMotorAgenda,
      closing: ev.closing,
      readingStatus,
      pendingDeclaration: ev.pendingDeclaration ?? null,
      humanClosing: ev.humanClosing,
      institutionalBoundary: ev.institutionalBoundary,
    },
    technicalSpace: parsed.technicalSpace,
    generatedDateLabel: parsed.generatedDateLabel ?? "",
    provenance: parsed.provenance,
  };
}

/**
 * Lectura del documento canónico congelado. Devuelve el documento normalizado, o
 * `null` cuando el sello no es del esquema 2 o es un sello v2 incompleto (el
 * proyector/lector cae con dignidad al camino legacy).
 */
export function readSealedCanonicalDocument(
  sealed: PSLCSealedCanonicalDocument
): CanonicalProfileDocument | null {
  const norm = normalizeSealedCanonicalProfileDocument(sealed);
  if (norm === null || isLegacyEditorialView(norm)) return null;
  return {
    schemaVersion: PSLC_CANONICAL_SCHEMA_VERSION,
    editorialView: norm.editorialView,
    technicalSpace: norm.technicalSpace,
    generatedDateLabel: norm.generatedDateLabel,
    provenance: norm.provenance,
  };
}

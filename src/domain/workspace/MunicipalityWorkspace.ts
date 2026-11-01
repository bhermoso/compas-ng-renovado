import type { AgendaActuation } from "../agenda/AgendaActuation";
import type { PlanDocument } from "../action-plan-catalog/PlanDocument";
import type { PlanPreparationDraft } from "../action-plan-catalog/PlanPreparationDraft";
import type { IndicatorWorksheet } from "../action-plan-catalog/IndicatorWorksheet";
import type { MunicipalityContext } from "../municipality";
import type { MunicipalDocumentRepository } from "../repository";
import type { EvidenceStore } from "../evidence";
import type { HealthReportDocument } from "../health-report";
import type { IBSEStudy } from "../ibse";
import type { DUKEStudy } from "../duke";
import type { PREDIMEDStudy } from "../predimed";
import type { SF12Study } from "../sf12";
import type { SuenoStudy } from "../sueno";
import type { CAGEStudy } from "../cage";
import type { ThematicPrioritisation, ThematicPrioritisationStudy } from "../thematic-prioritisation";
import type { LocalHealthProfile } from "../health-profile";
import type { LocalHealthProfileArtifact } from "../health-profile-artifact";
import type { PSLApprovalRecord, FormalValidationRecord } from "../institutional-lifecycle";
import type { QuestionnaireProject, ProjectDatasetImport } from "../questionnaire";
import type { PerfilLocalDeSalud } from "../health-profile";
import type { AUDITCStudy } from "../auditc";
import type { IPAQStudy } from "../ipaq";
import type { GHQ12Study } from "../ghq12";
import type { PHQ9Study } from "../phq9";
import type { PSQIStudy } from "../psqi";
import type { FagerstromStudy } from "../fagerstrom";
import type { SBQStudy } from "../sbq";
import type { DeliberativePrioritySelection } from "../deliberative-prioritisation";
import type { MunicipalActionPlanModuleReview } from "../action-plan-catalog";

/**
 * Snapshot compacto del Estado Territorial Evolutivo.
 * Almacena sólo datos escalares — sin arrays de EvidenceAtom —
 * para que el historial sea persistible en localStorage sin explosión de tamaño.
 * Definido en la capa de dominio porque forma parte del estado del Workspace.
 */
export interface TerritorialStateRecord {
  version: string;           // = evidenceStore.updatedAt en el momento de la captura
  municipalityId: string;
  generadoEn: string;        // ISO timestamp de cuándo se creó este registro
  totalEvidencias: number;
  cuentasDiagnosticas: {
    determinantes: number;
    activos: number;
    indicadores: number;
    hallazgosParticipativos: number;
    cautelasMetodologicas: number;
  };
  resumenTerritorial: string;
  origenesPresentes: string[];
  longitudinalActiva: boolean;
  longitudinalNota: string;
  longitudinalEvidencias: number;
  tensionesEstructurales: string[];
  limitacionesDiagnosticas?: string[];  // observaciones metodológicas; no escalan a áreas
  marcosAplicados: Array<{ framework: string; elementCount: number }>;
  totalAreasIntervencion: number;
}

export interface MunicipalityWorkspace {
  /** Complete external profiles, original files and revisions, shared in Firebase. */
  externalProfileLibrary?: import('../health-profile/ExternalHealthProfile').ExternalProfileLibrary;
  /** Originales de los documentos del Diagnóstico, completos y con huella, compartidos en Firebase. */
  documentOriginals?: import('../../application/document-files/documentOriginals').StoredDocumentOriginal[];
  planPreparationDraftHistory?: { replacedAt: string; replacementVersion: string; draft: PlanPreparationDraft }[];
  validatedActionPlans?: PlanDocument[];
  municipality: MunicipalityContext;
  repository: MunicipalDocumentRepository;
  evidenceStore: EvidenceStore;
  healthReport?: HealthReportDocument;
  previousHealthReports?: HealthReportDocument[];
  ibseStudy?: IBSEStudy;
  dukeStudy?: DUKEStudy;
  predimedStudy?: PREDIMEDStudy;
  sf12Study?: SF12Study;
  suenoStudy?: SuenoStudy;
  cageStudy?: CAGEStudy;
  thematicPrioritisation?: ThematicPrioritisation;
  thematicPrioritisationStudy?: ThematicPrioritisationStudy;
  /**
   * Selección explícita de prioridades adoptada por el Grupo Motor.
   * Es la compuerta canónica entre MTE y PAI; nunca se deriva automáticamente.
   */
  deliberativePrioritySelection?: DeliberativePrioritySelection;
  /**
   * Revisiones humanas de módulos temáticos propuestos para el Plan de Acción.
   * Conservan la plantilla original, la versión y la decisión municipal por elemento.
   */
  actionPlanModuleReviews?: MunicipalActionPlanModuleReview[];
  /** Human-authored collection sheets; drafts, never diagnostic evidence or approvals. */
  planPreparationDrafts?: PlanPreparationDraft[];
  indicatorWorksheets?: IndicatorWorksheet[];
  /** Agenda de actuaciones por entornos (CONTRACT-AGENDA-ACTUATIONS). Se guarda con el expediente. */
  agendaActuations?: AgendaActuation[];
  /** Actuaciones-tipo propias de este expediente (CONTRACT-ACTUATION-TEMPLATES). */
  actuationTemplates?: import("../agenda/ActuationTemplate").ActuationTemplate[];
  /**
   * Historial de snapshots del Estado Territorial Evolutivo.
   * Acumulativo: cada versión de la evidencia produce una entrada nueva.
   * No destructivo: las entradas previas se conservan.
   * Máximo configurado en la capa de aplicación (App.tsx).
   */
  historialEstadosTerritorial?: TerritorialStateRecord[];
  /**
   * PSL validado técnicamente por el equipo.
   * Cuando existe, el runtime lo usa como objeto canónico para el Nivel 3
   * en lugar de regenerar uno nuevo en estado "generated".
   * Se invalida explícitamente por el usuario cuando la evidencia cambia.
   */
  validatedPSL?: LocalHealthProfile;
  previousProfileRevisions?: Array<{profile: LocalHealthProfile; answers?: MunicipalityWorkspace["validatedAnswersSnapshot"]}>;
  /**
   * Snapshot OPACO (JSON serializado) de las DiagnosticAnswers en el momento de la
   * validación (CONV-A). Se guarda ATÓMICAMENTE junto a `validatedPSL` para que la
   * previsualización documental y la compilación consuman el MISMO snapshot
   * semántico (psl + answers) y no se recombine `validatedPSL` con answers vivos.
   * El dominio lo trata como `string` opaco —igual que `PSLCSealedCanonicalDocument.payload`—;
   * la deserialización y validación estructural viven en la capa de aplicación
   * (`parseValidatedAnswersSnapshot`), preservando `domain ↛ application` y el
   * estatuto TRANSITORIO (no persistido como estructura tipada) de `DiagnosticAnswers`.
   * Ausente/ilegible/inválido junto a `validatedPSL` ⇒ revalidación requerida.
   */
  validatedAnswersSnapshot?: string;
  /**
   * PSL-C compilados (LocalHealthProfileArtifact).
   * Acumulativos: cada compilación añade un nuevo artefacto.
   * Inmutables: nunca se sobreescriben. Historial completo por municipio.
   * Ordenados cronológicamente por compiledAt (el más reciente es el último).
   */
  compiledProfiles?: LocalHealthProfileArtifact[];
  /**
   * Registro de la aprobación institucional del PSL (transición validated → approved).
   * Complementa los campos psl.approvedAt / psl.approvedBy con los datos
   * institucionales del acto de aprobación (órgano, referencia externa, notas).
   * Solo existe cuando el PSL activo está en estado "approved".
   */
  pslApproval?: PSLApprovalRecord;
  /**
   * Registros de validación formal de borradores del Nivel 3.
   * Un registro por target (action-plan, agenda, monitoring-framework).
   * Se invalidan automáticamente si el PSL cambia de versión.
   */
  formalValidations?: FormalValidationRecord[];
  /**
   * Estudio AUDIT-C (Cribado de Consumo de Riesgo de Alcohol).
   * Administración propia via REDCap. Primer instrumento histórico pendiente
   * incorporado en COMPÁS NG.
   */
  auditcStudy?: AUDITCStudy;
  /**
   * Estudio IPAQ-EAS (Actividad Física — International Physical Activity Questionnaire).
   * Campos derivados oficiales de la EAS: IPAQ_DICO (alta actividad) y P34A_R (inactividad en ocio).
   */
  ipaqStudy?: IPAQStudy;
  /**
   * Estudio GHQ-12 (Cuestionario de Salud General, 12 ítems).
   * Administración propia via REDCap. Cribado de malestar psicológico.
   */
  ghq12Study?: GHQ12Study;
  /** Estudio PHQ-9 (Cuestionario sobre la Salud del Paciente, 9 ítems). Cribado de depresión. */
  phq9Study?: PHQ9Study;
  /** Estudio PSQI (Índice de Calidad del Sueño de Pittsburgh). */
  psqiStudy?: PSQIStudy;
  /** Estudio Fagerström (Test de Dependencia a la Nicotina, FTND). Solo fumadores activos. */
  fagerstromStudy?: FagerstromStudy;
  /** Estudio SBQ (Cuestionario de Comportamiento Sedentario). */
  sbqStudy?: SBQStudy;
  /**
   * Proyectos de encuesta del Gestor de Encuestas de Salud (GES).
   * Acumulativos: cada diseño de encuesta añade una entrada.
   * Persisten entre sesiones vía la serialización normal del workspace.
   * Aislados por municipio: workspaces distintos no comparten proyectos.
   */
  questionnaireProjects?: QuestionnaireProject[];
  /**
   * Historial de importaciones de datasets de proyectos REDCap.
   * Solo metadata de trazabilidad — nunca el CSV bruto.
   * Acumulativo: cada importación añade una entrada.
   */
  projectDatasetImports?: ProjectDatasetImport[];
  /**
   * Espacio de trabajo interpretativo del Perfil Local de Salud.
   * Construido progresivamente por el técnico: interpretaciones, hipótesis y
   * preguntas abiertas sobre el territorio.
   * Distinto del LocalHealthProfile (generado automáticamente por el pipeline).
   * La ausencia de este campo es válida: workspaces anteriores no lo tienen.
   */
  perfilLocalDeSalud?: PerfilLocalDeSalud;
  /**
   * Migraciones incrementales de seed ya aplicadas a ESTE expediente, por marca
   * versionada (p. ej. "atarfe-localiza-v1"). La presencia de una marca significa
   * que la migración se ofreció y se resolvió: NO debe volver a aplicarse aunque
   * el documento correspondiente falte (un borrado deliberado del usuario mediante
   * «Eliminar» debe respetarse). La ausencia del campo equivale a "ninguna
   * aplicada" y es válida para workspaces anteriores (compatibilidad legacy).
   */
  appliedSeedMigrations?: string[];
  /** Archivo de recuperación; nunca es evidencia ni validación vigente. */
  nonObservedStudiesArchive?: {
    status: "historical-not-valid";
    migrationId: string;
    archivedAt: string;
    reason: string;
    /** Expediente previo íntegro. Solo para recuperación y auditoría. */
    workspaceJSON: string;
  };
  schemaVersion: string;
  createdAt: string;
  updatedAt: string;
}

export function createMunicipalityWorkspace(
  municipality: MunicipalityContext,
  repository: MunicipalDocumentRepository,
  evidenceStore: EvidenceStore
): MunicipalityWorkspace {
  const now = new Date().toISOString();

  return {
    municipality,
    repository,
    evidenceStore,
    schemaVersion: "1.0.0",
    createdAt: now,
    updatedAt: now,
  };
}

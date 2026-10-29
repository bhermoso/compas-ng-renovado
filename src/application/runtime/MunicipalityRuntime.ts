import { profileSourceChanged } from '../health-profile/profileSourceChanged';
import { assessProfileValidation, profileCanFeedDownstream, type ProfileValidationCriterion } from '../../domain/quality/ProfileValidationCriterion';
import type { MunicipalityWorkspace } from "../../domain/workspace";
import type { CompasPipelineResult, PipelineTraceItem, PipelineStatus } from "../../domain/pipeline";
import type { LT1Result } from "../lt1";
import type { OITResult } from "../oit";
import type { LocalHealthProfile } from "../../domain/health-profile";
import { excludeHistoricalSources } from "../health-profile";
import { selectExternalProfile } from '../health-profile/selectExternalProfile';
import type { PrioritizationResult } from "../prioritization";
import { generatePrioritization } from "../prioritization";
import type { EPVSATranslationResult } from "../epvsa";
import { translatePrioritizationToEPVSA } from "../epvsa";
import type { ActionPlanDraft } from "../action-plan";
import { generateActionPlanDraft } from "../action-plan";
import type { AgendaDraft } from "../agenda";
import { generateAgendaDraft } from "../agenda";
import type { MonitoringDraft } from "../monitoring";
import { generateMonitoringDraft } from "../monitoring";
import {
  runEvidenceStoreIntegrityGuard,
  type IntegrityGuardResult,
} from "../evidence";
import { getAllStrategicElements } from "../../domain/strategy";
import {
  createEstadoTerritorialEvolutivo,
  type EstadoTerritorialEvolutivo,
} from "../territorial-interpretation";
import {
  runReconciliacionInterpretativa,
  type ReconciliacionResult,
} from "../reconciliation";
import type { LecturaEstrategicaLocal } from "../../domain/strategic-scenario";
import { translate as translateMTE } from "../mte";
import { StaticFrameworkProvider } from "../mte";
import type { BorradorPAI } from "../pai";
import { generatePAI } from "../pai";
import { isDeliberativePrioritySelectionStale } from "../../domain/deliberative-prioritisation";
import {
  getEligibleActionPlanModules,
  type EligibleActionPlanModule,
} from "../../domain/action-plan-catalog";

// ── Runtime interface ──────────────────────────────────────────────────────

export interface MunicipalityRuntime {
  workspace: MunicipalityWorkspace;
  pipeline: CompasPipelineResult;
  integrityGuard: IntegrityGuardResult;

  // Nivel 2 — Motor de Interpretación Territorial (MIT)
  mit: EstadoTerritorialEvolutivo;

  // Motor de Reconciliación Interpretativa
  reconciliacion: ReconciliacionResult;

  // Campos derivados del MIT / reconciliacion — para compatibilidad con paneles UI.
  // lt1 = mit.dimensionDiagnostica
  // oit = reconciliacion-gated OIT (or mit.areasDeIntervencion as fallback)
  // Nota: oit permanece para el OITPanel diagnóstico — NO alimenta el Nivel 3.
  lt1: LT1Result;
  oit: OITResult;

  // PSL — Perfil de Salud Local
  // Objeto canónico que sintetiza el Nivel 2 y es el único puente autorizado al Nivel 3.
  // PSL-C1: ningún componente del Nivel 3 consume Nivel 2 sin mediación del PSL.
  psl: LocalHealthProfile;
  // true si psl.status === "validated" pero la evidencia ha cambiado desde la validación.
  pslIsStale: boolean;
  // Criterio de calidad «Perfil validado»: informa, no bloquea.
  profileValidation: ProfileValidationCriterion;

  // Nivel 3 — Capa de Decisión (alimentada exclusivamente por el PSL)
  prioritization: PrioritizationResult;
  epvsa: EPVSATranslationResult;
  actionPlan: ActionPlanDraft;
  agenda: AgendaDraft;
  monitoring: MonitoringDraft;

  // Producto 5 — Motor de Traducción Estratégica
  // Disponible con cualquier Perfil vigente; la validación se informa en `profileValidation`.
  lectura: LecturaEstrategicaLocal | undefined;

  // Una selección previa queda obsoleta si cambia el PSL, el MTE o la
  // priorización ciudadana de la que tomó constancia el Grupo Motor.
  prioritySelectionIsStale: boolean;

  // Producto 6 — Plan de Acción Inteligente
  // Disponible solo cuando la lectura estratégica está disponible.
  pai: BorradorPAI | undefined;

  // PA-RELAS-02 — módulos documentados que corresponden exactamente a una
  // prioridad seleccionada por el Grupo Motor. Son propuestas, no adopciones.
  eligibleActionPlanModules: EligibleActionPlanModule[];
}

export interface CreateMunicipalityRuntimeInput {
  workspace: MunicipalityWorkspace;
}

// ── Factory ────────────────────────────────────────────────────────────────

export function createMunicipalityRuntime(
  input: CreateMunicipalityRuntimeInput
): MunicipalityRuntime {
  // La cadena analítica (integridad, MIT, PSL) trabaja sobre las fuentes del ciclo
  // actual: las que el equipo técnico declaró históricas se presentan aparte, como
  // antecedentes. Sin ciclos declarados, `analytical` es el mismo expediente.
  const analytical = excludeHistoricalSources(input.workspace);

  // ── Nivel 1: integridad del EvidenceStore
  const integrityGuard = runEvidenceStoreIntegrityGuard(analytical.evidenceStore);

  // Marcos interpretativos — cargados una sola vez y compartidos
  // por el MIT (interpretación territorial) y el motor de acción (ActionPlan).
  const frameworks = getAllStrategicElements();

  // ── Nivel 2: Motor de Interpretación Territorial (MIT)
  // Único motor de análisis. LT1 y OIT son sub-rutinas internas.
  // EPVSA/ESCA son marcos interpretativos, no módulos ejecutables.
  const mit = createEstadoTerritorialEvolutivo({
    evidenceStore: integrityGuard.sanitizedStore,
    strategicFrameworks: frameworks,
  });

  // ── Reconciliación: Motor de Reconciliación Interpretativa
  // Detecta conflictos entre estados, fuentes y escalas.
  // Aplica la Regla de Escalado: solo las tensiones con persistencia temporal,
  // convergencia de fuentes y coherencia estructural se escalan a Áreas de
  // Intervención Territorial. Las demás permanecen como tensiones no escaladas.
  // No resuelve conflictos — solo los estructura para deliberación humana.
  const reconciliacion = runReconciliacionInterpretativa(
    mit,
    input.workspace.historialEstadosTerritorial ?? []
  );

  // ── OIT (uso interno de visualización — NO alimenta el Nivel 3)
  // Las áreas escaladas tienen prioridad; el OIT del MIT actúa como fallback.
  // Este valor se expone en runtime.oit para el OITPanel diagnóstico únicamente.
  const oitParaDecision: OITResult =
    reconciliacion.areasIntervencionEscaladas.length > 0
      ? {
          opportunities: reconciliacion.areasIntervencionEscaladas,
          sourceSummary:
            `${reconciliacion.areasIntervencionEscaladas.length} área(s) de intervención ` +
            "escaladas por el Motor de Reconciliación Interpretativa.",
          requiresHumanValidation: true,
        }
      : mit.areasDeIntervencion;

  // Campos derivados para compatibilidad con paneles de visualización.
  const lt1 = mit.dimensionDiagnostica;
  const oit = oitParaDecision;

  // Perfil externo activo o perfil histórico guardado. Sin documento, ninguna generación.
  const psl: LocalHealthProfile = selectExternalProfile(input.workspace);
  const externalProfile = input.workspace.externalProfileLibrary?.profiles.find(p => p.id === input.workspace.externalProfileLibrary?.activeId);

  // Detectar si la evidencia cambió desde la validación del PSL.
  const pslIsStale = externalProfile
    ? externalProfile.evidenceVersion !== undefined && externalProfile.evidenceVersion !== input.workspace.evidenceStore.updatedAt
    :
    (psl.status === "validated" || psl.status === "approved") &&
    (psl.evidenceStoreVersion !== integrityGuard.sanitizedStore.updatedAt ||
     profileSourceChanged(psl, input.workspace));

  // ── Nivel 3: Capa de Decisión (alimentada exclusivamente por el PSL)
  const prioritization = generatePrioritization(psl);
  const epvsa = translatePrioritizationToEPVSA(prioritization);
  const actionPlan = generateActionPlanDraft(epvsa, frameworks, psl, pslIsStale);
  const agenda = generateAgendaDraft(actionPlan);
  const monitoring = generateMonitoringDraft(agenda);

  // ── Producto 5 — Motor de Traducción Estratégica
  // La validación del Perfil no es requisito: se informa como criterio de calidad.
  const profileValidation = assessProfileValidation(psl.status, pslIsStale);
  const pslListoParaMTE = profileCanFeedDownstream(psl.status);

  let lectura: LecturaEstrategicaLocal | undefined;
  if (pslListoParaMTE) {
    const provider = new StaticFrameworkProvider(getAllStrategicElements(), "1.0.0");
    const mteResult = translateMTE(psl, provider);
    lectura = mteResult.ok ? mteResult.lectura : undefined;
  }

  // ── Producto 6 — Plan de Acción Inteligente
  let pai: BorradorPAI | undefined;
  let eligibleActionPlanModules: EligibleActionPlanModule[] = [];
  const prioritySelectionIsStale = lectura != null && input.workspace.deliberativePrioritySelection != null
    ? isDeliberativePrioritySelectionStale(
        input.workspace.deliberativePrioritySelection,
        lectura,
        input.workspace.thematicPrioritisation
      )
    : false;
  if (
    lectura != null &&
    input.workspace.deliberativePrioritySelection != null &&
    !prioritySelectionIsStale
  ) {
    const provider = new StaticFrameworkProvider(getAllStrategicElements(), "1.0.0");
    const paiResult = generatePAI(
      lectura,
      input.workspace.deliberativePrioritySelection,
      provider
    );
    pai = paiResult.ok ? paiResult.borrador : undefined;
    eligibleActionPlanModules = getEligibleActionPlanModules(
      lectura,
      input.workspace.deliberativePrioritySelection
    );
  }

  return {
    workspace: input.workspace,
    integrityGuard,
    mit,
    reconciliacion,
    lt1,
    oit,
    psl,
    pslIsStale,
    profileValidation,
    pipeline: buildPipelineTrace(input.workspace, integrityGuard, mit, reconciliacion, {
      prioritization,
      epvsa,
      actionPlan,
      agenda,
      monitoring,
    }),
    prioritization,
    epvsa,
    actionPlan,
    agenda,
    monitoring,
    lectura,
    prioritySelectionIsStale,
    pai,
    eligibleActionPlanModules,
  };
}

// ── Pipeline trace ─────────────────────────────────────────────────────────
// Reflects the 3-level architecture:
//   Nivel 1: integrity, repository, evidence
//   Nivel 2: mit (single territorial engine)
//   Nivel 3: prioritization, epvsa, action-plan, agenda, monitoring

function buildPipelineTrace(
  workspace: MunicipalityWorkspace,
  guard: IntegrityGuardResult,
  mit: EstadoTerritorialEvolutivo,
  reconciliacion: ReconciliacionResult,
  stages: {
    prioritization: PrioritizationResult;
    epvsa: EPVSATranslationResult;
    actionPlan: ActionPlanDraft;
    agenda: AgendaDraft;
    monitoring: MonitoringDraft;
  }
): CompasPipelineResult {
  const now = new Date().toISOString();
  const docCount = workspace.repository.documents.length;
  const atomCount = guard.sanitizedStore.atoms.length;

  const hasAtoms = atomCount > 0;
  const motorStatus: PipelineStatus = hasAtoms ? "ready" : "empty";
  const evidenceStatus: PipelineStatus =
    atomCount > 0 ? "ready" : docCount > 0 ? "partial" : "empty";

  // ── Nivel 1 ────────────────────────────────────────────────────────────

  const integrityStatus: PipelineStatus =
    guard.errors.length > 0 ? "partial" : "ready";

  const integrityMessage =
    guard.errors.length > 0
      ? `${guard.errors.length} error(es) de integridad · ${guard.stats.totalAtoms} átomos válidos de ${workspace.evidenceStore.atoms.length} procesados. Errores: ${guard.errors.slice(0, 2).join(" | ")}${guard.errors.length > 2 ? " …" : ""}`
      : guard.warnings.length > 0
        ? `Integridad: ${guard.stats.totalAtoms} átomos válidos. ${guard.warnings.length} aviso(s). ${buildOriginSummary(guard.stats.byOrigin)}`
        : `Integridad verificada: ${guard.stats.totalAtoms} átomo(s). ${buildOriginSummary(guard.stats.byOrigin)}`;

  // ── Nivel 2: MIT ────────────────────────────────────────────────────────

  const mitStatus: PipelineStatus =
    hasAtoms
      ? mit.tensionesEstructurales.length > 0 || mit.limitacionesDiagnosticas.length > 0
        ? "partial"
        : "ready"
      : "empty";

  const mitMessage = hasAtoms
    ? buildMITMessage(mit)
    : "Sin EvidenceAtom. El Motor de Interpretación Territorial no puede construir un Estado Territorial Evolutivo sin base documental.";

  // ── Nivel 3 ────────────────────────────────────────────────────────────

  const trace: PipelineTraceItem[] = [
    // — Nivel 1 —
    {
      stage: "integrity",
      status: integrityStatus,
      message: integrityMessage,
      createdAt: now,
    },
    {
      stage: "repository",
      status: docCount > 0 ? "ready" : "partial",
      message: `${docCount} documento(s) en el repositorio municipal.`,
      createdAt: now,
    },
    {
      stage: "evidence",
      status: evidenceStatus,
      message: `${atomCount} EvidenceAtom disponibles para el Motor de Interpretación Territorial.`,
      createdAt: now,
    },
    // — Nivel 2 —
    {
      stage: "mit",
      status: mitStatus,
      message: mitMessage,
      createdAt: now,
    },
    // — Reconciliación (puente Nivel 2 → Nivel 3) —
    {
      stage: "reconciliacion",
      status: buildReconciliacionStatus(reconciliacion, hasAtoms),
      message: buildReconciliacionMessage(reconciliacion, hasAtoms),
      createdAt: now,
    },
    // — Nivel 3 —
    {
      stage: "prioritization",
      status: motorStatus,
      message: hasAtoms
        ? `${stages.prioritization.candidatePriorities.length} candidata(s) a priorización. Requieren validación humana.`
        : "Sin evidencia real. Candidata de fallback heredada del pipeline vacío.",
      createdAt: now,
    },
    {
      stage: "epvsa",
      status: motorStatus,
      message: hasAtoms
        ? `${stages.epvsa.suggestions.length} sugerencia(s) de encaje estratégico. Requieren validación técnica.`
        : "Sin evidencia real. Sugerencia EPVSA pendiente de revisión por ausencia de base documental.",
      createdAt: now,
    },
    {
      stage: "action-plan",
      status: motorStatus,
      message: hasAtoms
        ? `${stages.actionPlan.objectives.length} objetivo(s) y ${stages.actionPlan.actions.length} actuación(es) en borrador inicial.`
        : "Sin evidencia real. Borrador de plan generado sobre pipeline vacío. No representa acciones reales.",
      createdAt: now,
    },
    {
      stage: "agenda",
      status: motorStatus,
      message: hasAtoms
        ? `${stages.agenda.annualItems.length} ítem(s) de agenda anual propuesto(s). Pendiente de validación.`
        : "Sin evidencia real. Agenda generada sobre pipeline vacío. No representa compromisos ejecutivos.",
      createdAt: now,
    },
    {
      stage: "monitoring",
      status: motorStatus,
      message: hasAtoms
        ? `${stages.monitoring.trackedItems.length} actuación(es) en seguimiento inicial. Estado: pendiente de validación.`
        : "Sin evidencia real. Seguimiento generado sobre pipeline vacío. No refleja ejecución real.",
      createdAt: now,
    },
  ];

  return { trace };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildMITMessage(mit: EstadoTerritorialEvolutivo): string {
  const lt1 = mit.dimensionDiagnostica;
  const areas = mit.areasDeIntervencion.opportunities.length;
  const tensiones = mit.tensionesEstructurales.length;
  const marcosStr = mit.marcosAplicados.map((m) => m.framework).join(", ");
  const longiStr = mit.dimensionLongitudinal.activa
    ? ` · Dimensión longitudinal activa (${mit.dimensionLongitudinal.evidenciasLongitudinales} evidencia(s))`
    : "";

  return (
    `Estado Territorial v${mit.version.slice(0, 10)} · ` +
    `${lt1.determinants.length} determinante(s), ` +
    `${lt1.assets.length} activo(s), ` +
    `${lt1.indicators.length} indicador(es), ` +
    `${lt1.qualitativeFindings.length} hallazgo(s) participativo(s)` +
    longiStr +
    ` · ${areas} área(s) de intervención territorial` +
    (tensiones > 0 ? ` · ${tensiones} tensión(es) estructural(es)` : "") +
    (mit.limitacionesDiagnosticas.length > 0
      ? ` · ${mit.limitacionesDiagnosticas.length} limitación(es) diagnóstica(s)`
      : "") +
    (marcosStr ? ` · Marcos: ${marcosStr}` : "")
  );
}

function buildReconciliacionStatus(
  r: ReconciliacionResult,
  hasAtoms: boolean
): PipelineStatus {
  if (!hasAtoms) return "empty";
  if (r.tensionesEscaladas.length > 0) return "ready";
  if (r.conflictos.length > 0) return "partial";
  return "ready";
}

function buildReconciliacionMessage(
  r: ReconciliacionResult,
  hasAtoms: boolean
): string {
  if (!hasAtoms) {
    return "Sin evidencia. No hay tensiones ni conflictos que reconciliar.";
  }
  const partes: string[] = [];
  if (r.conflictos.length > 0) {
    partes.push(`${r.conflictos.length} conflicto(s) detectado(s) (no resueltos)`);
  }
  if (r.ruidoEstructural.length > 0) {
    partes.push(`${r.ruidoEstructural.length} tensión(es) clasificada(s) como ruido estructural`);
  }
  if (r.tensionesNoEscaladas.length > 0) {
    partes.push(`${r.tensionesNoEscaladas.length} tensión(es) relevante(s) no escalada(s)`);
  }
  if (r.tensionesEscaladas.length > 0) {
    partes.push(
      `${r.tensionesEscaladas.length} tensión(es) escalada(s) a Áreas de Intervención Territorial`
    );
  }
  if (partes.length === 0) {
    return "Sin tensiones ni conflictos detectados. El Estado Territorial es homogéneo.";
  }
  return partes.join(" · ") + ". Ningún conflicto ha sido resuelto por el sistema.";
}

function buildOriginSummary(byOrigin: Record<string, number>): string {
  const entries = Object.entries(byOrigin);
  if (entries.length === 0) return "Sin átomos clasificados.";
  return entries
    .sort(([, a], [, b]) => b - a)
    .map(([origin, count]) => `${origin}(${count})`)
    .join(" · ");
}

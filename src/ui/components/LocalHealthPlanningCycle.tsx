import type { LocalHealthProfileStatus } from "../../domain/health-profile";
import "./LocalHealthPlanningCycle.css";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PhaseStatus =
  | "completed"
  | "current"
  | "pending"
  | "blocked"
  | "requires-validation";

// La vista destino al hacer clic en una fase (coincide con AppView de App.tsx).
// Se define como string generico para no crear dependencia circular con App.tsx.
type AppViewId = string;

interface CyclePhase {
  id: string;
  num: number;
  label: string;
  status: PhaseStatus;
  note?: string;
  navigateTo?: AppViewId;
  statusLabel?: string; // sobreescribe STATUS_LABEL cuando fuente cargada != producto completado
  scopeBoundary?: boolean; // true -> insertar separador visual antes de esta fase
}

export interface LocalHealthPlanningCycleProps {
  healthReportLoaded: boolean;
  pslHasEvidence: boolean;
  pslStatus: LocalHealthProfileStatus;
  pslIsStale: boolean;
  /** Existe un perfil externo incorporado o un artefacto histórico conservado. */
  pslCompiled: boolean;
  thematicPrioritisationDone: boolean;
  /** Seleccion deliberativa del Grupo Motor ya adoptada; opcional hasta consolidar App.tsx. */
  prioritySelectionDone?: boolean;
  /**
   * Estado de la versión vigente del Perfil externo (biblioteca de perfiles).
   * Cuando consta, manda sobre el PSL compilado heredado: el Perfil vigente es
   * el documento de referencia y su validación técnica cierra la fase.
   */
  externalProfileStatus?: "review" | "validated";
  /**
   * La selección del Grupo Motor existe pero se adoptó sin incorporar la
   * participación ciudadana que ya consta en el expediente.
   */
  prioritySelectionWithoutParticipation?: boolean;
  /** Actuaciones registradas en la agenda (instrumento de la fase Implantación). */
  agendaCount?: number;
  /** Plan de Acción validado en el expediente municipal. */
  validatedPlanPresent?: boolean;
  /** Existen borradores o revisiones de planificación aún no validados. */
  planWorkInProgress?: boolean;
  onNavigate?: (view: AppViewId) => void;
  /** Vista seleccionada: solo presentación, no altera los estados del expediente. */
  currentView?: AppViewId;
}

// ── Etiquetas de estado ───────────────────────────────────────────────────────

const STATUS_LABEL: Record<PhaseStatus, string> = {
  completed:              "Completada",
  current:                "En curso",
  pending:                "Pendiente",
  blocked:                "No disponible",
  "requires-validation":  "Revisar",
};

// ── Derivacion de fases ───────────────────────────────────────────────────────
// Inferencia prudente: solo usa senales disponibles en el workspace.
// Nunca inventa validaciones que el sistema no puede verificar.

function derivePhases({
  healthReportLoaded,
  pslHasEvidence,
  pslStatus,
  pslIsStale,
  pslCompiled,
  thematicPrioritisationDone,
  prioritySelectionDone = false,
  externalProfileStatus,
  prioritySelectionWithoutParticipation = false,
  agendaCount = 0,
  validatedPlanPresent = false,
  planWorkInProgress = false,
}: LocalHealthPlanningCycleProps): CyclePhase[] {
  const external = externalProfileStatus !== undefined;
  const pslReady = external
    ? externalProfileStatus === "validated"
    : (pslStatus === "validated" || pslStatus === "approved") && !pslIsStale;
  // El aviso de evidencia cambiada compara con el PSL compilado heredado; no
  // describe una versión externa vigente.
  const pslStaleNote = !external && pslIsStale ? "La evidencia ha cambiado" : undefined;

  // 2 - Perfil de salud local
  // "Completada" exige el artefacto institucional PSL-C compilado/congelado:
  // la validacion tecnica del borrador no cierra la fase por si sola.
  let pslPhase: PhaseStatus;
  let pslStatusLabel: string | undefined;
  let pslNote = pslStaleNote;
  if (external) {
    pslPhase = externalProfileStatus === "validated" ? "completed" : "current";
    pslStatusLabel = externalProfileStatus === "validated" ? "Validado técnicamente" : "En revisión";
    pslNote = externalProfileStatus === "validated" ? undefined : "Versión vigente pendiente de validación técnica";
  } else if ((pslStatus === "validated" || pslStatus === "approved") && pslIsStale) {
    pslPhase = "requires-validation";
  } else if (pslReady && pslCompiled) {
    pslPhase = "completed";
  } else if (pslReady) {
    pslPhase = "current";
    pslStatusLabel = "Validado técnicamente";
    pslNote = "Pendiente de incorporar el documento de referencia";
  } else if (pslHasEvidence) {
    pslPhase = "current";
  } else {
    pslPhase = "pending";
  }

  // 3 - Priorizacion (formal = participacion + PSL validado + deliberacion)
  // La participacion ciudadana puede realizarse antes de validar el PSL.
  // La fase permanece accesible para que no quede enterrada bajo el Plan de accion:
  // permite preparar participacion, ver candidaturas y documentar lo que falta.
  let prioPhase: PhaseStatus;
  let prioNote: string | undefined;
  if (prioritySelectionWithoutParticipation) {
    prioPhase = "current";
    prioNote = "Participación ciudadana recibida; la selección del Grupo Motor es anterior y no la incorpora";
  } else if (pslReady && prioritySelectionDone) {
    prioPhase = "completed";
  } else if (pslReady) {
    prioPhase = "current";
    prioNote = thematicPrioritisationDone
      ? "Pendiente de selección del Grupo Motor"
      : "Pendiente de participación ciudadana";
  } else if (!pslReady && thematicPrioritisationDone) {
    prioPhase = "current";
    prioNote = "Participación ciudadana recibida; falta validar el perfil";
  } else if (pslHasEvidence) {
    prioPhase = "current";
    prioNote = "Preparar participación y criterios";
  } else {
    prioPhase = "pending";
  }

  // 4 - Plan de acción: una selección de prioridades NO equivale a un plan.
  // Solo un documento validado permite acreditar la fase como terminada.
  const planPhase: PhaseStatus = validatedPlanPresent
    ? "completed"
    : planWorkInProgress || prioritySelectionDone ? "current" : "pending";
  const planNote = validatedPlanPresent
    ? "Plan de Acción validado en el expediente"
    : planWorkInProgress ? "Existe trabajo de planificación sin validar"
    : prioritySelectionDone ? "Prioridades seleccionadas; pendiente de elaborar el Plan"
    : "Pendiente de elaborar y validar el Plan";

  // 5 - Implantacion
  // La agenda es el instrumento de la fase y es un registro de trabajo: no se condiciona a la priorización.
  const implantationPhase: PhaseStatus = agendaCount > 0 ? "current" : "pending";
  const implantationNote = agendaCount > 0
    ? `${agendaCount} ${agendaCount === 1 ? "actuación registrada" : "actuaciones registradas"} en la agenda`
    : "Registra actuaciones en la agenda";

  // 6 - Evaluación: la pantalla actual es informativa y no guarda una
  // evaluación. No anunciarla como disponible por existir prioridades.
  const evaluationPhase: PhaseStatus = "blocked";
  const evaluationNote = "Módulo de evaluación aún no implementado";

  return [
    {
      id:          "informe",
      num:         1,
      label:       "Informe sobre la situación de salud",
      status:      healthReportLoaded ? "completed" : "pending",
      statusLabel: healthReportLoaded ? "Informe incorporado" : "Sin informe incorporado",
      navigateTo:  "repositorio",
    },
    {
      id:          "psl",
      num:         2,
      label:       "Perfil de salud local",
      status:      pslPhase,
      statusLabel: pslStatusLabel,
      note:        pslNote,
      navigateTo:  "psl",
    },
    {
      id:          "priorizacion",
      num:         3,
      label:       "Priorización",
      status:      prioPhase,
      note:        prioNote,
      navigateTo:  "priorizacion",
    },
    {
      id:          "plan-accion",
      num:         4,
      label:       "Plan de acción",
      status:      planPhase,
      note:        planNote,
      navigateTo:  "plan",
    },
    {
      id:            "implantacion",
      num:           5,
      label:         "Implantación",
      status:        implantationPhase,
      note:          implantationNote,
      navigateTo:    "agenda",
      scopeBoundary: true,
    },
    {
      id:          "evaluacion",
      num:         6,
      label:       "Evaluación",
      status:      evaluationPhase,
      note:        evaluationNote,
      navigateTo:  "evaluacion",
    },
  ];
}

// ── Componente ────────────────────────────────────────────────────────────────

export function LocalHealthPlanningCycle(props: LocalHealthPlanningCycleProps) {
  const phases = derivePhases(props);
  const completed = phases.filter((phase) => phase.status === "completed").length;
  const total = phases.length;

  // Los estados del expediente son información, no una segunda navegación.
  // La navegación operativa permanece exclusivamente en las pestañas de App.
  return (
    <details className="lhpc lhpc--compact" aria-label="Estado del expediente local de salud">
      <summary className="lhpc__compact-summary">
        <span className="lhpc__compact-title">Expediente local de salud</span>
        <span className="lhpc__progress-label">{completed} de {total} fases completadas</span>
        <span className="lhpc__compact-track" role="progressbar"
          aria-label="Fases completadas del expediente"
          aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}>
          <span className="lhpc__progress-fill" style={{ width: `${(completed / total) * 100}%` }} />
        </span>
        <span className="lhpc__compact-toggle">Ver estados</span>
      </summary>
      <div className="lhpc__compact-detail">
        <ol className="lhpc__compact-phases">
          {phases.map((phase) => (
            <li key={phase.id} className={`lhpc__compact-phase lhpc__compact-phase--${phase.status}`}>
              <span className="lhpc__compact-phase-name">{phase.num}. {phase.label}</span>
              <span className="lhpc__compact-phase-status">{phase.statusLabel ?? STATUS_LABEL[phase.status]}</span>
              {phase.note && <span className="lhpc__compact-phase-note">{phase.note}</span>}
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}

import type { LocalHealthProfileStatus } from "../../domain/health-profile";

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
  /** Existe al menos un artefacto institucional PSL-C compilado/congelado. */
  pslCompiled: boolean;
  thematicPrioritisationDone: boolean;
  /** Seleccion deliberativa del Grupo Motor ya adoptada; opcional hasta consolidar App.tsx. */
  prioritySelectionDone?: boolean;
  /** Actuaciones registradas en la agenda (instrumento de la fase Implantación). */
  agendaCount?: number;
  onNavigate?: (view: AppViewId) => void;
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
  agendaCount = 0,
}: LocalHealthPlanningCycleProps): CyclePhase[] {
  const pslReady = (pslStatus === "validated" || pslStatus === "approved") && !pslIsStale;
  const pslStaleNote = pslIsStale ? "La evidencia ha cambiado" : undefined;

  // 2 - Perfil de salud local
  // "Completada" exige el artefacto institucional PSL-C compilado/congelado:
  // la validacion tecnica del borrador no cierra la fase por si sola.
  let pslPhase: PhaseStatus;
  let pslStatusLabel: string | undefined;
  let pslNote = pslStaleNote;
  if ((pslStatus === "validated" || pslStatus === "approved") && pslIsStale) {
    pslPhase = "requires-validation";
  } else if (pslReady && pslCompiled) {
    pslPhase = "completed";
  } else if (pslReady) {
    pslPhase = "current";
    pslStatusLabel = "Validado técnicamente";
    pslNote = "Pendiente de compilación institucional";
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
  if (pslReady && prioritySelectionDone) {
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

  // 4 - Plan de accion
  // «Perfil validado» es criterio de calidad, no requisito: la fase no se bloquea por él.
  let planPhase: PhaseStatus;
  if (!pslHasEvidence && !prioritySelectionDone) {
    planPhase = "blocked";
  } else if (prioritySelectionDone) {
    planPhase = "current";
  } else {
    planPhase = "pending";
  }

  // 5 - Implantacion
  // La agenda es el instrumento de la fase y es un registro de trabajo: no se condiciona a la priorización.
  const implantationPhase: PhaseStatus = agendaCount > 0 ? "current" : "pending";
  const implantationNote = agendaCount > 0
    ? `${agendaCount} ${agendaCount === 1 ? "actuación registrada" : "actuaciones registradas"} en la agenda`
    : "Registra actuaciones en la agenda";

  // 6 - Evaluacion
  const evaluationPhase: PhaseStatus = prioritySelectionDone ? "pending" : "blocked";
  const evaluationNote = prioritySelectionDone
    ? "Pendiente de implantación"
    : "Requiere plan implantable";

  return [
    {
      id:          "informe",
      num:         1,
      label:       "Informe sobre la situación de salud",
      status:      healthReportLoaded ? "completed" : "current",
      statusLabel: healthReportLoaded ? "Disponible" : undefined,
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
      navigateTo:  planPhase !== "blocked" ? "plan" : undefined,
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
      navigateTo:  evaluationPhase !== "blocked" ? "evaluacion" : undefined,
    },
  ];
}

// ── Componente ────────────────────────────────────────────────────────────────

export function LocalHealthPlanningCycle(props: LocalHealthPlanningCycleProps) {
  const { onNavigate } = props;
  const phases = derivePhases(props);

  return (
    <div className="lhpc" role="navigation" aria-label="Proceso de planificación local de salud">
      <div className="lhpc__inner">
        <p className="lhpc__heading">Expediente local de salud</p>
        <ol className="lhpc__phases" role="list">
          {phases.map((phase) => {
            const isClickable = onNavigate !== undefined && phase.navigateTo !== undefined;
            const content = (
              <>
                <span className="lhpc__phase-num" aria-hidden="true">
                  {phase.num}
                </span>
                <span className="lhpc__phase-label">{phase.label}</span>
                <span className="lhpc__phase-status" aria-label={`Estado: ${phase.statusLabel ?? STATUS_LABEL[phase.status]}`}>
                  {phase.statusLabel ?? STATUS_LABEL[phase.status]}
                  {phase.note && (
                    <span className="lhpc__phase-note">{phase.note}</span>
                  )}
                </span>
              </>
            );

            return (
              <li
                key={phase.id}
                className={`lhpc__phase lhpc__phase--${phase.status}${isClickable ? " lhpc__phase--nav" : ""}${phase.scopeBoundary ? " lhpc__phase--scope-start" : ""}`}
              >
                {isClickable ? (
                  <button
                    type="button"
                    className="lhpc__phase-btn"
                    onClick={() => onNavigate!(phase.navigateTo!)}
                    title={`Ir a: ${phase.label}`}
                  >
                    {content}
                  </button>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

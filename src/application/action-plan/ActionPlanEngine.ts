import type {
  EPVSATranslationResult,
  EPVSAStrategicLine,
  StrategicLineSuggestion,
} from "../epvsa";
import type { StrategicElement } from "../../domain/strategy";
import type { LocalHealthProfile } from "../../domain/health-profile";
import type { UnaddressedNeed } from "../../domain/health-plan";

// ── PSL Reference ─────────────────────────────────────────────────────────
// Snapshot del estado del PSL en el momento en que se generó el plan.
// No almacena el PSL completo — solo los metadatos necesarios para la
// trazabilidad institucional: quién validó, cuándo, y si la evidencia
// cambió desde entonces.

export interface PSLReference {
  pslId: string;
  status: LocalHealthProfile["status"];
  generatedAt: string;
  validatedAt?: string;
  validatedBy?: string;
  isStale: boolean;
}

// ── New type: FrameworkAlignment ──────────────────────────────────────────
// Describes how one objective / action aligns with a strategic framework
// element registered in StrategicFrameworkRegistry.

export type FrameworkAlignmentType = "direct" | "thematic";

export interface FrameworkAlignment {
  frameworkId: string;
  elementId: string;
  elementLabel: string;
  level: string;
  alignmentType: FrameworkAlignmentType;
  relevanceNote: string;
  sourceTrace: string;
  indicators: string[];
}

// ── Domain types (extended) ───────────────────────────────────────────────

export interface ActionPlanObjective {
  id: string;
  title: string;
  linkedStrategicLine: string;
  rationale: string;
  frameworkAlignments: FrameworkAlignment[];
}

export interface ActionPlanAction {
  id: string;
  title: string;
  description: string;
  linkedObjectiveId: string;
  relatedEvidenceIds: string[];
  cautions: string[];
  frameworkAlignments: FrameworkAlignment[];
}

export interface ActionPlanIndicator {
  id: string;
  title: string;
  type: "process" | "output" | "outcome";
  linkedActionId: string;
  measurementNote: string;
}

export interface ActionPlanDraft {
  title: string;
  // Trazabilidad: estado del PSL en el momento de generación del plan.
  // Responde: ¿con qué PSL se generó? ¿estaba validado? ¿quién lo validó?
  pslReference: PSLReference;
  objectives: ActionPlanObjective[];
  actions: ActionPlanAction[];
  indicators: ActionPlanIndicator[];
  cautions: string[];
  requiresHumanValidation: true;
  /** Necesidades diagnosticadas que quedan fuera de este ciclo y su justificación. Gate G-PLS-7. */
  unaddressedNeeds?: UnaddressedNeed[];
}

/** Valida que cada necesidad no priorizada tenga id, título y justificación no vacíos.
 *  Una lista vacía es válida: significa que ninguna necesidad quedó fuera. */
export function validateActionPlanUnaddressedNeeds(needs: UnaddressedNeed[]): string[] {
  const errors: string[] = [];
  for (const need of needs) {
    if (!need.id.trim()) errors.push(`Necesidad sin identificador: "${need.title}".`);
    if (!need.title.trim()) errors.push(`Necesidad sin título (id: ${need.id}).`);
    if (!need.justification.trim()) errors.push(`Necesidad "${need.title}" sin justificación.`);
  }
  return errors;
}

// ── Keyword map for cross-framework thematic matching ─────────────────────
// Each EPVSA strategic line has a set of Spanish stem-like keywords used to
// find relevant elements in non-EPVSA frameworks.  Only "line" and
// "program" levels are matched to avoid shallow indicator-level noise.

const EPVSA_LINE_KEYWORDS: Readonly<Record<EPVSAStrategicLine, readonly string[]>> = {
  LE1: ["comunidad", "comunitari", "participación", "activo", "intersectorial", "red", "ciudadan"],
  LE2: ["alimentación", "actividad física", "bienestar", "emocional", "consumo", "estilo de vida", "mental", "escolar"],
  LE3: ["determinante", "desigualdad", "equidad", "vulnerabilidad", "exclusión", "renta", "pobreza"],
  LE4: ["gobernanza", "evaluación", "seguimiento", "indicador", "conocimiento", "información", "calidad"],
  "pending-review": [],
};

const THEMATIC_MATCH_LEVELS: ReadonlySet<StrategicElement["level"]> = new Set([
  "line",
  "program",
  "objective",
]);

// ── Public entry point ─────────────────────────────────────────────────────
// PSL-C1: el Plan de Acción recibe el PSL que lo origina y conserva una
// referencia ligera a su estado en el momento de generación.
// Esto garantiza que cualquier plan pueda responder: ¿con qué PSL fue
// construido?, ¿estaba validado?, ¿quién lo validó?, ¿sigue vigente?

export function generateActionPlanDraft(
  epvsa: EPVSATranslationResult,
  strategicFrameworks: readonly StrategicElement[],
  psl: LocalHealthProfile,
  pslIsStale: boolean,
): ActionPlanDraft {
  const pslReference: PSLReference = {
    pslId: psl.id,
    status: psl.status,
    generatedAt: psl.generatedAt,
    validatedAt: psl.validatedAt,
    validatedBy: psl.validatedBy,
    isStale: pslIsStale,
  };

  const enriched = epvsa.suggestions.map((suggestion, index) => {
    const alignments = findFrameworkAlignments(suggestion, strategicFrameworks);
    return {
      objective: buildObjective(suggestion, index + 1, alignments),
      action: null as ActionPlanAction | null, // filled below
      alignments,
    };
  });

  const objectives = enriched.map((e) => e.objective);

  const actions = epvsa.suggestions.map((suggestion, index) =>
    buildAction(
      suggestion,
      objectives[index].id,
      index + 1,
      enriched[index].alignments
    )
  );

  const indicators = actions.flatMap((action, index) =>
    buildIndicators(action, index + 1)
  );

  const frameworkCaution =
    strategicFrameworks.length > 0
      ? "Los encajes estratégicos con múltiples marcos (EPVSA, ESCA, MAYORES, BUENA_EDAD, RELAS) son orientativos y requieren revisión técnica e institucional antes de formalizar el Plan."
      : null;

  return {
    title: "Borrador inicial de Plan de Acción Local en Salud",
    pslReference,
    objectives,
    actions,
    indicators,
    cautions: [
      ...epvsa.generalCautions,
      "Este plan es un borrador técnico inicial y no sustituye aprobación institucional.",
      "Las acciones deben revisarse con responsables municipales, ciudadanía y profesionales.",
      "Los indicadores son preliminares y deben concretarse con fuentes, línea base, periodicidad y responsables.",
      "No se genera agenda anual hasta que las acciones hayan sido validadas.",
      ...(frameworkCaution !== null ? [frameworkCaution] : []),
    ],
    requiresHumanValidation: true,
  };
}

// ── Framework alignment resolver ──────────────────────────────────────────

function findFrameworkAlignments(
  suggestion: StrategicLineSuggestion,
  frameworks: readonly StrategicElement[]
): FrameworkAlignment[] {
  if (frameworks.length === 0) return [];

  const alignments: FrameworkAlignment[] = [];

  // 1. Direct EPVSA registry element lookup
  //    Maps "LE2" → "EPVSA-LE2" — the canonical ID format used in the registry.
  if (suggestion.suggestedLine !== "pending-review") {
    const epvsaRegistryId = `EPVSA-${suggestion.suggestedLine}`;
    const epvsaEl = frameworks.find((e) => e.id === epvsaRegistryId);
    if (epvsaEl !== undefined) {
      alignments.push({
        frameworkId: epvsaEl.framework,
        elementId: epvsaEl.id,
        elementLabel: epvsaEl.label,
        level: epvsaEl.level,
        alignmentType: "direct",
        relevanceNote:
          "Encaje directo: línea EPVSA asignada por el motor de traducción estratégica (EPVSATranslator).",
        sourceTrace: epvsaEl.sourceTrace,
        indicators: epvsaEl.indicators ?? [],
      });
    }
  }

  // 2. Cross-framework thematic matching
  //    Only run for known lines (pending-review has empty keywords).
  const lineKeywords = EPVSA_LINE_KEYWORDS[suggestion.suggestedLine];
  if (lineKeywords.length > 0) {
    for (const el of frameworks) {
      if (el.framework === "EPVSA") continue; // already covered above
      if (!THEMATIC_MATCH_LEVELS.has(el.level)) continue;

      const searchText = `${el.label} ${el.description ?? ""}`.toLowerCase();
      const matched = lineKeywords.some((kw) => searchText.includes(kw));

      if (matched) {
        alignments.push({
          frameworkId: el.framework,
          elementId: el.id,
          elementLabel: el.label,
          level: el.level,
          alignmentType: "thematic",
          relevanceNote:
            "Posible encaje temático derivado de análisis de palabras clave. Requiere revisión técnica antes de incorporarlo al Plan.",
          sourceTrace: el.sourceTrace,
          indicators: el.indicators ?? [],
        });
      }
    }
  }

  return alignments;
}

// ── Builders ──────────────────────────────────────────────────────────────

function buildObjective(
  suggestion: StrategicLineSuggestion,
  order: number,
  frameworkAlignments: FrameworkAlignment[]
): ActionPlanObjective {
  return {
    id: `objective-${order}-${suggestion.id}`,
    title: `Objetivo ${order}: abordar ${suggestion.candidateTitle}`,
    linkedStrategicLine: suggestion.suggestedLineLabel,
    rationale:
      "Objetivo preliminar derivado de una candidata priorizada y traducida de forma prudente a EPVSA.",
    frameworkAlignments,
  };
}

function buildAction(
  suggestion: StrategicLineSuggestion,
  linkedObjectiveId: string,
  order: number,
  frameworkAlignments: FrameworkAlignment[]
): ActionPlanAction {
  return {
    id: `action-${order}-${suggestion.id}`,
    title: `Actuación ${order}: intervención comunitaria sobre ${suggestion.candidateTitle}`,
    description:
      "Diseñar una actuación local revisable que conecte evidencia municipal, activos disponibles, participación comunitaria y marco estratégico autonómico.",
    linkedObjectiveId,
    relatedEvidenceIds: suggestion.relatedEvidenceIds,
    cautions: suggestion.cautions,
    frameworkAlignments,
  };
}

function buildIndicators(
  action: ActionPlanAction,
  order: number
): ActionPlanIndicator[] {
  return [
    {
      id: `indicator-process-${order}-${action.id}`,
      title: "Indicador de proceso",
      type: "process",
      linkedActionId: action.id,
      measurementNote:
        "Definir actividades realizadas, sesiones, reuniones, productos generados o hitos de implementación.",
    },
    {
      id: `indicator-output-${order}-${action.id}`,
      title: "Indicador de cobertura/producto",
      type: "output",
      linkedActionId: action.id,
      measurementNote:
        "Definir población, colectivos, activos, entidades o recursos alcanzados por la actuación.",
    },
    {
      id: `indicator-outcome-${order}-${action.id}`,
      title: "Indicador de resultado prudente",
      type: "outcome",
      linkedActionId: action.id,
      measurementNote:
        "Definir cambios esperados observables sin atribuir causalidad automática al plan.",
    },
  ];
}

import type { LecturaEstrategicaLocal } from "../strategic-scenario";
import type { ThematicPrioritisation } from "../thematic-prioritisation";

/**
 * Decisión explícita del Grupo Motor entre la lectura estratégica y el PAI.
 * Conserva por separado las candidaturas técnicas, la evidencia ciudadana
 * disponible y la selección humana. El sistema nunca rellena esta entidad.
 */
/**
 * Prioridad que el Grupo Motor adopta sin que proceda de una recomendación del
 * Perfil: por priorización ciudadana o por su propia deliberación. Excepción
 * regulada a I-LHPM-23 (decisión del responsable de 28/11/2026): se registra
 * con su origen y su motivación, y se presenta siempre como «no procede del
 * Perfil».
 */
export interface GroupMotorOwnPriority {
  id: string;
  title: string;
  origin: "citizen-prioritisation" | "group-motor-deliberation";
  /** Temáticas de la priorización ciudadana en las que se apoya (origen ciudadano). */
  citizenTopicIds: string[];
  /** Líneas del catálogo del Plan de Acción que desarrollan esta prioridad. */
  catalogModuleIds: string[];
  rationale: string;
}

export const OWN_PRIORITY_ORIGIN_LABELS: Record<GroupMotorOwnPriority["origin"], string> = {
  "citizen-prioritisation": "Priorización ciudadana",
  "group-motor-deliberation": "Deliberación del Grupo Motor",
};

export interface DeliberativePrioritySelection {
  id: string;
  municipalityId: string;
  sourceLecturaId: string;
  sourcePSLId: string;
  sourcePSLVersion: string;
  candidateScenarioIds: string[];
  selectedScenarioIds: string[];
  /** Relación explícita y humana entre una prioridad seleccionada y un módulo catalogado. */
  catalogModuleLinks?: Array<{ scenarioId: string; moduleId: string }>;
  /** Prioridades soberanas del Grupo Motor que no proceden del Perfil. */
  ownPriorities?: GroupMotorOwnPriority[];
  citizenTopicIds: string[];
  sourceCitizenPrioritisationUpdatedAt?: string;
  deliberationRationale: string;
  citizenInfluenceStatement: string;
  decidedBy: string;
  decidedByRole: "group-motor";
  decidedAt: string;
  requiresHumanValidation: true;
}

export type CreateDeliberativePrioritySelectionResult =
  | { ok: true; selection: DeliberativePrioritySelection }
  | { ok: false; violations: readonly string[] };

export interface CreateDeliberativePrioritySelectionInput {
  lectura: LecturaEstrategicaLocal;
  citizenPrioritisation?: ThematicPrioritisation;
  selectedScenarioIds: readonly string[];
  catalogModuleLinks?: readonly { scenarioId: string; moduleId: string }[];
  ownPriorities?: readonly Omit<GroupMotorOwnPriority, "id">[];
  deliberationRationale: string;
  citizenInfluenceStatement: string;
  decidedBy: string;
  now?: string;
  /** Fecha en que el Grupo Motor adoptó la decisión (AAAA-MM-DD); si falta, la del registro. */
  decisionDate?: string;
}

export function createDeliberativePrioritySelection(
  input: CreateDeliberativePrioritySelectionInput
): CreateDeliberativePrioritySelectionResult {
  const candidateScenarioIds = input.lectura.escenarios.map((scenario) => scenario.id);
  const candidateIds = new Set(candidateScenarioIds);
  const selectedScenarioIds = [...new Set(input.selectedScenarioIds)];
  const catalogModuleLinks = [...new Map(
    (input.catalogModuleLinks ?? []).map((link) => [`${link.scenarioId}:${link.moduleId}`, { ...link }])
  ).values()];
  const violations: string[] = [];
  const citizenSelected = new Set(input.citizenPrioritisation?.selectedTopicIds ?? []);
  const ownPriorities: GroupMotorOwnPriority[] = (input.ownPriorities ?? []).map((own, index) => ({
    id: `propia-${index + 1}`,
    title: own.title.trim(),
    origin: own.origin,
    citizenTopicIds: own.origin === "citizen-prioritisation" ? [...new Set(own.citizenTopicIds)] : [],
    catalogModuleIds: [...new Set(own.catalogModuleIds)],
    rationale: own.rationale.trim(),
  }));

  if (ownPriorities.length === 0 && (!input.lectura.hasTranslatableContent || candidateScenarioIds.length === 0)) {
    violations.push("G-DPS-1: la Lectura Estratégica no contiene candidaturas seleccionables y no se ha registrado ninguna prioridad propia");
  }
  if (selectedScenarioIds.length === 0 && ownPriorities.length === 0) {
    violations.push("G-DPS-2: el Grupo Motor debe seleccionar al menos una recomendación del Perfil o registrar una prioridad propia");
  }
  if (ownPriorities.some((own) => own.title.length === 0 || own.rationale.length === 0)) {
    violations.push("G-DPS-8: cada prioridad propia necesita un título y su motivación");
  }
  if (ownPriorities.some((own) => own.origin === "citizen-prioritisation" &&
    (own.citizenTopicIds.length === 0 || own.citizenTopicIds.some((id) => !citizenSelected.has(id))))) {
    violations.push("G-DPS-9: una prioridad de origen ciudadano debe apoyarse en temáticas registradas en la priorización ciudadana");
  }
  if (selectedScenarioIds.some((id) => !candidateIds.has(id))) {
    violations.push("G-DPS-3: la selección contiene candidaturas ajenas a la Lectura Estratégica");
  }
  if (catalogModuleLinks.some((link) => !selectedScenarioIds.includes(link.scenarioId))) {
    violations.push("G-DPS-7: todo módulo catalogado debe vincularse a una candidatura seleccionada");
  }
  if (input.deliberationRationale.trim().length === 0) {
    violations.push("G-DPS-4: debe documentarse la motivación de la deliberación");
  }
  if (input.citizenInfluenceStatement.trim().length === 0) {
    violations.push("G-DPS-5: debe documentarse cómo influyó el conocimiento ciudadano, incluida su ausencia");
  }
  if (input.decidedBy.trim().length === 0) {
    violations.push("G-DPS-6: debe identificarse al Grupo Motor que adopta la selección");
  }

  const registeredAt = input.now ?? new Date().toISOString();
  const decisionDate = input.decisionDate?.trim();
  if (decisionDate) {
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(decisionDate)
      && !Number.isNaN(Date.parse(`${decisionDate}T00:00:00Z`))
      && new Date(`${decisionDate}T00:00:00Z`).toISOString().slice(0, 10) === decisionDate;
    if (!valid) {
      violations.push("G-DPS-10: la fecha de la decisión debe ser una fecha válida (AAAA-MM-DD)");
    } else if (decisionDate > registeredAt.slice(0, 10)) {
      violations.push("G-DPS-10: la fecha de la decisión no puede ser posterior a la de su registro");
    }
  }

  if (violations.length > 0) return { ok: false, violations };

  // Mediodía UTC: la fecha se muestra igual en cualquier huso horario español.
  const decidedAt = decisionDate ? `${decisionDate}T12:00:00.000Z` : registeredAt;
  return {
    ok: true,
    selection: {
      id: `priority-selection-${input.lectura.id}-${decidedAt}`,
      municipalityId: input.lectura.municipalityId,
      sourceLecturaId: input.lectura.id,
      sourcePSLId: input.lectura.sourcePSLId,
      sourcePSLVersion: input.lectura.sourcePSLVersion,
      candidateScenarioIds,
      selectedScenarioIds,
      catalogModuleLinks,
      ...(ownPriorities.length > 0 ? { ownPriorities } : {}),
      citizenTopicIds: [...(input.citizenPrioritisation?.selectedTopicIds ?? [])],
      sourceCitizenPrioritisationUpdatedAt: input.citizenPrioritisation?.updatedAt,
      deliberationRationale: input.deliberationRationale.trim(),
      citizenInfluenceStatement: input.citizenInfluenceStatement.trim(),
      decidedBy: input.decidedBy.trim(),
      decidedByRole: "group-motor",
      decidedAt,
      requiresHumanValidation: true,
    },
  };
}

export function isDeliberativePrioritySelectionStale(
  selection: DeliberativePrioritySelection,
  lectura: LecturaEstrategicaLocal,
  citizenPrioritisation?: ThematicPrioritisation
): boolean {
  const currentCandidateIds = lectura.escenarios.map((scenario) => scenario.id);
  return (
    selection.municipalityId !== lectura.municipalityId ||
    selection.sourceLecturaId !== lectura.id ||
    selection.sourcePSLId !== lectura.sourcePSLId ||
    selection.sourcePSLVersion !== lectura.sourcePSLVersion ||
    selection.sourceCitizenPrioritisationUpdatedAt !== citizenPrioritisation?.updatedAt ||
    selection.candidateScenarioIds.length !== currentCandidateIds.length ||
    selection.candidateScenarioIds.some((id, index) => id !== currentCandidateIds[index])
  );
}

export function doesDeliberativePrioritySelectionMatchLectura(
  selection: DeliberativePrioritySelection,
  lectura: LecturaEstrategicaLocal
): boolean {
  const currentCandidateIds = lectura.escenarios.map((scenario) => scenario.id);
  const candidateIds = new Set(currentCandidateIds);
  return (
    selection.municipalityId === lectura.municipalityId &&
    selection.sourceLecturaId === lectura.id &&
    selection.sourcePSLId === lectura.sourcePSLId &&
    selection.sourcePSLVersion === lectura.sourcePSLVersion &&
    selection.candidateScenarioIds.length === currentCandidateIds.length &&
    selection.candidateScenarioIds.every((id, index) => id === currentCandidateIds[index]) &&
    (selection.selectedScenarioIds.length > 0 || (selection.ownPriorities?.length ?? 0) > 0) &&
    selection.selectedScenarioIds.every((id) => candidateIds.has(id))
  );
}

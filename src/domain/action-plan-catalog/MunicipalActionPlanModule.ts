import { HEALTHY_AGING_MODULE, type ActionPlanCatalogModule } from "./ActionPlanCatalog";
import { ZAIDIN_AGING_PROPOSAL, type PlanPreparationDraft } from "./PlanPreparationDraft";

export const ZAGRA_ACTION_PLAN_VERSION = "zagra-cuatro-bloques-2026-10-28";

const territorialText = (text: string) => text
  .replaceAll("del distrito Zaidín", "del municipio de Zagra")
  .replaceAll("del Zaidín", "de Zagra")
  .replaceAll("del distrito", "del municipio");

/** Reuses the four-block architecture, never the other territory's decisions. */
export const ZAGRA_AGING_PROPOSAL: ActionPlanCatalogModule = {
  ...ZAIDIN_AGING_PROPOSAL,
  version: ZAGRA_ACTION_PLAN_VERSION,
  sourceLabel: "Plan de Acción de Zagra · adaptación de la estructura de cuatro bloques del Zaidín",
  sourceDate: "2026-10-28",
  strategicObjective: territorialText(ZAIDIN_AGING_PROPOSAL.strategicObjective),
  generalObjectives: ZAIDIN_AGING_PROPOSAL.generalObjectives.map(general => ({
    ...general,
    // The old nine groups used ENV-OG1…9 with different meanings.
    code: `ZAGRA-${general.code}`,
    title: territorialText(general.title),
    specificObjectives: general.specificObjectives.map(specific => ({
      ...specific,
      title: territorialText(specific.title),
      indicator: {...specific.indicator},
    })),
  })),
};

export function municipalActionPlanModule(municipalityId: string, original: ActionPlanCatalogModule): ActionPlanCatalogModule {
  if (original.id !== HEALTHY_AGING_MODULE.id) return original;
  if (municipalityId === "zagra") return ZAGRA_AGING_PROPOSAL;
  if (municipalityId === "granada-zaidin") return ZAIDIN_AGING_PROPOSAL;
  return original;
}

/** Preserve specific decisions; old general-objective wording remains in history. */
export function regroupZagraActionPlanDraft(previous: PlanPreparationDraft, updatedAt: string): PlanPreparationDraft {
  if (previous.municipalityId !== "zagra" || previous.moduleId !== HEALTHY_AGING_MODULE.id) return previous;
  if (previous.version === ZAGRA_ACTION_PLAN_VERSION) return previous;
  if (previous.version !== HEALTHY_AGING_MODULE.version) throw new Error("Versión de borrador desconocida. Se conserva sin modificar.");
  const decisions = {...previous.decisions};
  for (const general of HEALTHY_AGING_MODULE.generalObjectives) {
    if (previous.decisions[general.code]?.status !== "excluded") continue;
    for (const specific of general.specificObjectives) {
      decisions[specific.code] = {
        ...previous.decisions[specific.code],
        sourceText: previous.decisions[specific.code]?.sourceText ?? specific.title,
        status: "excluded",
        ...(previous.decisions[specific.code]?.status && previous.decisions[specific.code].status !== "excluded"
          ? {excludedDecision: {...previous.decisions[specific.code], status: previous.decisions[specific.code].status as "pending" | "included" | "modified"}}
          : {}),
      };
    }
  }
  // These group codes are new, so no old group's approval or wording is reused.
  for (const general of ZAGRA_AGING_PROPOSAL.generalObjectives) {
    decisions[general.code] = {status: "pending", sourceText: general.title};
  }
  return {...previous, version: ZAGRA_ACTION_PLAN_VERSION, updatedAt, decisions,
    migration: {replacedAt: updatedAt, replacementVersion: ZAGRA_ACTION_PLAN_VERSION,
      draft: JSON.parse(JSON.stringify(previous)) as PlanPreparationDraft},
  };
}

export function prepareMunicipalActionPlanDraft(municipalityId: string, module: ActionPlanCatalogModule, draft: PlanPreparationDraft | undefined, date = new Date().toISOString()): PlanPreparationDraft | undefined {
  if (!draft) return undefined;
  if (draft.municipalityId !== municipalityId || draft.moduleId !== module.id || !draft.decisions) {
    throw new Error("El borrador no pertenece al municipio y módulo abiertos. Se conserva sin modificar.");
  }
  if (draft.version === module.version) return draft;
  if (municipalityId === "zagra" && module.id === HEALTHY_AGING_MODULE.id && module.version === ZAGRA_ACTION_PLAN_VERSION && draft.version === HEALTHY_AGING_MODULE.version) {
    return regroupZagraActionPlanDraft(draft, date);
  }
  throw new Error("La versión del borrador requiere revisión de compatibilidad. Se conserva sin modificar.");
}

/** Recover the underlying wording of drafts regrouped before exclusion metadata existed. */
export function recoverZagraDraftArchive(current: PlanPreparationDraft, original: PlanPreparationDraft, date: string): PlanPreparationDraft {
  if (current.municipalityId !== 'zagra' || current.moduleId !== ZAGRA_AGING_PROPOSAL.id || current.version !== ZAGRA_ACTION_PLAN_VERSION || current.migration) return current;
  if (original.municipalityId !== current.municipalityId || original.moduleId !== current.moduleId || original.version !== HEALTHY_AGING_MODULE.version) return current;
  const decisions = {...current.decisions};
  for (const general of HEALTHY_AGING_MODULE.generalObjectives) {
    if (original.decisions[general.code]?.status !== 'excluded') continue;
    for (const specific of general.specificObjectives) {
      const prior = original.decisions[specific.code];
      const now = decisions[specific.code];
      if (prior?.status === 'modified' && now?.status === 'excluded' && !now.excludedDecision && now.text === prior.text) {
        decisions[specific.code] = {...now, excludedDecision: {status: prior.status, sourceText: prior.sourceText, text: prior.text}};
      }
    }
  }
  return {...current, decisions, updatedAt: date,
    migration: {replacedAt: date, replacementVersion: current.version, draft: JSON.parse(JSON.stringify(original)) as PlanPreparationDraft}};
}

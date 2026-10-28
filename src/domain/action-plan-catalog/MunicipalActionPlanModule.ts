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
  const decisions = {...previous.decisions};
  for (const general of HEALTHY_AGING_MODULE.generalObjectives) {
    if (previous.decisions[general.code]?.status !== "excluded") continue;
    for (const specific of general.specificObjectives) {
      decisions[specific.code] = {
        ...previous.decisions[specific.code],
        sourceText: previous.decisions[specific.code]?.sourceText ?? specific.title,
        status: "excluded",
      };
    }
  }
  // These group codes are new, so no old group's approval or wording is reused.
  for (const general of ZAGRA_AGING_PROPOSAL.generalObjectives) {
    decisions[general.code] = {status: "pending", sourceText: general.title};
  }
  return {...previous, version: ZAGRA_ACTION_PLAN_VERSION, updatedAt, decisions};
}

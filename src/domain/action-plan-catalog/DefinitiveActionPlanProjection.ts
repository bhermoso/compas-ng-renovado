import type { ActionPlanCatalogModule } from "./ActionPlanCatalog";
import {
  cleanActionPlanProposalText,
  compareActionPlanNotation,
  type PlanPreparationDecision,
  type PlanPreparationDraft,
} from "./PlanPreparationDraft";

export interface DefinitiveActionPlanObjectiveRow {
  general: ActionPlanCatalogModule["generalObjectives"][number];
  specific: ActionPlanCatalogModule["generalObjectives"][number]["specificObjectives"][number];
  generalDecision?: PlanPreparationDecision;
  objectiveDecision?: PlanPreparationDecision;
  indicatorDecision?: PlanPreparationDecision;
  indicatorIncluded: boolean;
}

export interface DefinitiveActionPlanModuleProjection {
  module: ActionPlanCatalogModule;
  draft?: PlanPreparationDraft;
  moduleDecision?: PlanPreparationDecision;
  rows: DefinitiveActionPlanObjectiveRow[];
}

export const selectedPlanDecision = (decision: PlanPreparationDecision | undefined) =>
  decision?.status === "included" || decision?.status === "modified";

const excludedPlanDecision = (decision: PlanPreparationDecision | undefined) =>
  decision?.status === "excluded";

export const resolvedPlanDecisionText = (decision: PlanPreparationDecision | undefined, source: string) =>
  cleanActionPlanProposalText(decision?.status === "modified" && decision.text?.trim() ? decision.text.trim() : source);

function allIds(module: ActionPlanCatalogModule) {
  return [
    module.id,
    ...module.generalObjectives.flatMap(general => [
      general.code,
      ...general.specificObjectives.flatMap(specific => [specific.code, specific.indicator.code]),
    ]),
  ];
}

function moduleIsActive(module: ActionPlanCatalogModule, draft: PlanPreparationDraft | undefined) {
  if (!draft) return false;
  return allIds(module).some(id => {
    const status = draft.decisions[id]?.status;
    return status === "included" || status === "modified" || status === "excluded";
  });
}

function excluded(draft: PlanPreparationDraft | undefined, ids: string[]) {
  return ids.some(id => draft?.decisions[id]?.status === "excluded");
}

function cleanedDecision(decision: PlanPreparationDecision | undefined): PlanPreparationDecision | undefined {
  if (!decision) return undefined;
  const text = decision.text !== undefined ? cleanActionPlanProposalText(decision.text) : undefined;
  return {
    ...decision,
    status: decision.status,
    sourceText: cleanActionPlanProposalText(decision.sourceText),
    ...(text !== undefined ? { text } : {}),
  };
}

function cleanedDraft(draft: PlanPreparationDraft | undefined): PlanPreparationDraft | undefined {
  if (!draft) return undefined;
  return {
    ...draft,
    decisions: Object.fromEntries(
      Object.entries(draft.decisions).map(([id, decision]) => [id, cleanedDecision(decision)])
    ) as Record<string, PlanPreparationDecision>,
  };
}

export function pendingPreparationDecisionCount(module: ActionPlanCatalogModule, draft: PlanPreparationDraft | undefined) {
  if (!draft || !moduleIsActive(module, draft)) return 0;
  let count = draft.decisions[module.id]?.status === "pending" || !draft.decisions[module.id] ? 1 : 0;
  for (const general of module.generalObjectives) {
    if (excluded(draft, [module.id])) continue;
    if (!draft.decisions[general.code] || draft.decisions[general.code].status === "pending") count += 1;
    for (const specific of general.specificObjectives) {
      if (excluded(draft, [module.id, general.code])) continue;
      if (!draft.decisions[specific.code] || draft.decisions[specific.code].status === "pending") count += 1;
      if (excluded(draft, [module.id, general.code, specific.code])) continue;
      if (!selectedPlanDecision(draft.decisions[specific.code]) && (!draft.decisions[specific.indicator.code] || draft.decisions[specific.indicator.code].status === "pending")) count += 1;
    }
  }
  return count;
}

export function buildDefinitiveActionPlanProjection(
  municipalityId: string,
  modules: ActionPlanCatalogModule[],
  drafts?: PlanPreparationDraft[]
): DefinitiveActionPlanModuleProjection[] {
  return modules.flatMap(module => {
    const draft = cleanedDraft(drafts?.find(candidate => candidate.municipalityId === municipalityId && candidate.moduleId === module.id));
    if (draft && draft.version !== module.version) return [];
    const rows = module.generalObjectives.flatMap(general => {
      if (excluded(draft, [module.id, general.code])) return [];
      return general.specificObjectives.flatMap(specific => {
        if (excluded(draft, [module.id, general.code, specific.code])) return [];
        const objectiveDecision = cleanedDecision(draft?.decisions[specific.code]);
        const indicatorDecision = cleanedDecision(draft?.decisions[specific.indicator.code]);
        const objectiveIncluded = selectedPlanDecision(objectiveDecision) || selectedPlanDecision(indicatorDecision);
        const indicatorIncluded = selectedPlanDecision(indicatorDecision) || (selectedPlanDecision(objectiveDecision) && !excludedPlanDecision(indicatorDecision));
        if (!objectiveIncluded) return [];
        return [{
          general,
          specific,
          generalDecision: cleanedDecision(draft?.decisions[general.code]),
          objectiveDecision,
          indicatorDecision,
          indicatorIncluded,
        }];
      });
    }).sort((left, right) =>
      module.generalObjectives.indexOf(left.general) - module.generalObjectives.indexOf(right.general) ||
      compareActionPlanNotation(left.specific.displayCode ?? left.specific.code, right.specific.displayCode ?? right.specific.code)
    );
    return [{ module, draft, moduleDecision: cleanedDecision(draft?.decisions[module.id]), rows }];
  }).filter(({ module, draft }) => moduleIsActive(module, draft));
}

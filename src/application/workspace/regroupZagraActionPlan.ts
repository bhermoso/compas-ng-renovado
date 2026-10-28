import type { MunicipalityWorkspace } from "../../domain/workspace/MunicipalityWorkspace";
import { HEALTHY_AGING_MODULE } from "../../domain/action-plan-catalog/ActionPlanCatalog";
import { regroupZagraActionPlanDraft, ZAGRA_AGING_PROPOSAL } from "../../domain/action-plan-catalog/MunicipalActionPlanModule";

export function regroupZagraActionPlan(workspace: MunicipalityWorkspace, date = new Date().toISOString()): MunicipalityWorkspace {
  if (workspace.municipality.identity.id !== "zagra") return workspace;
  const drafts = workspace.planPreparationDrafts ?? [];
  const prior = drafts.filter(draft => draft.municipalityId === "zagra" && draft.moduleId === ZAGRA_AGING_PROPOSAL.id && draft.version === HEALTHY_AGING_MODULE.version);
  if (!prior.length) return workspace;
  return {
    ...workspace,
    planPreparationDraftHistory: [...(workspace.planPreparationDraftHistory ?? []), ...prior.map(draft => ({
      replacedAt: date,
      replacementVersion: ZAGRA_AGING_PROPOSAL.version,
      draft: JSON.parse(JSON.stringify(draft)) as typeof draft,
    }))],
    planPreparationDrafts: drafts.map(draft => prior.includes(draft) ? regroupZagraActionPlanDraft(draft, date) : draft),
    updatedAt: date,
  };
}

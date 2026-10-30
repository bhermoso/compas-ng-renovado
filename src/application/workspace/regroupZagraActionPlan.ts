import type { MunicipalityWorkspace } from "../../domain/workspace/MunicipalityWorkspace";
import { HEALTHY_AGING_MODULE } from "../../domain/action-plan-catalog/ActionPlanCatalog";
import { regroupZagraActionPlanDraft, recoverZagraDraftArchive, ZAGRA_AGING_PROPOSAL } from "../../domain/action-plan-catalog/MunicipalActionPlanModule";

export function regroupZagraActionPlan(workspace: MunicipalityWorkspace, date = new Date().toISOString()): MunicipalityWorkspace {
  if (workspace.municipality.identity.id !== "zagra") return workspace;
  const drafts = workspace.planPreparationDrafts ?? [];
  const prior = drafts.filter(draft => draft.municipalityId === "zagra" && draft.moduleId === ZAGRA_AGING_PROPOSAL.id && draft.version === HEALTHY_AGING_MODULE.version);
  const replacements = drafts.map(draft => {
    if (prior.includes(draft)) return regroupZagraActionPlanDraft(draft, date);
    const archived = [...(workspace.planPreparationDraftHistory ?? [])].reverse().find(entry =>
      entry.replacementVersion === ZAGRA_AGING_PROPOSAL.version && entry.draft.municipalityId === draft.municipalityId && entry.draft.moduleId === draft.moduleId && entry.draft.version === HEALTHY_AGING_MODULE.version);
    return archived ? recoverZagraDraftArchive(draft, archived.draft, date) : draft;
  });
  if (replacements.every((draft, index) => draft === drafts[index])) return workspace;
  return {
    ...workspace,
    planPreparationDraftHistory: [...(workspace.planPreparationDraftHistory ?? []), ...prior.map(draft => ({
      replacedAt: date,
      replacementVersion: ZAGRA_AGING_PROPOSAL.version,
      draft: JSON.parse(JSON.stringify(draft)) as typeof draft,
    }))],
    planPreparationDrafts: replacements,
    updatedAt: date,
  };
}

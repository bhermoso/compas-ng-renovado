import { activeExternalProfile } from "../health-profile/selectExternalProfile";
import { chosenProposals, profileProposals } from "../health-profile/profileChoices";
import { isDeliberativePrioritySelectionStale } from "../../domain/deliberative-prioritisation";
import type { ActionPlanTraceabilityLink } from "../../domain/action-plan-catalog/ActionPlanTraceability";
import type { LecturaEstrategicaLocal } from "../../domain/strategic-scenario";
import type { MunicipalityWorkspace } from "../../domain/workspace";

export interface ProfilePlanLink {
  profileId: string;
  selectionId: string;
  recommendationId: string;
  scenarioId: string;
  worksheetKey: string;
  moduleVersion: string;
  baselineResultId?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface ProfilePlanLinkDetail extends ProfilePlanLink {
  profileTitle: string;
  recommendation: string;
  priority: string;
  selectionDate: string;
  line: string;
  objective: string;
  indicator: string;
  baseline?: { value: string; unit: string; period: string; source: string; locator: string; scope?: string };
}

export const profilePlanLinkKey = (link: ProfilePlanLink) => JSON.stringify([
  link.profileId, link.selectionId, link.recommendationId, link.scenarioId, link.worksheetKey, link.moduleVersion,
]);

type Sources = Pick<MunicipalityWorkspace, "municipality" | "externalProfileLibrary" | "deliberativePrioritySelection" | "thematicPrioritisation">;

export function profilePlanOptions(
  workspace: Sources,
  lectura: LecturaEstrategicaLocal | undefined,
  targets: ActionPlanTraceabilityLink[],
) {
  const profile = activeExternalProfile(workspace);
  const selection = workspace.deliberativePrioritySelection;
  const chosen = profile ? chosenProposals(profile) : new Set<string>();
  const recommendations = profile ? profileProposals(profile).filter(p => p.kind === "recommendation" && chosen.has(p.id)) : [];
  const priorities = profile && lectura && selection && selection.sourcePSLId === profile.id &&
    !isDeliberativePrioritySelectionStale(selection, lectura, workspace.thematicPrioritisation)
    ? lectura.escenarios.filter(s => selection.selectedScenarioIds.includes(s.id)) : [];
  // Solo datos con valor literal exacto y procedencia. La equivalencia con el
  // indicador del Plan la comprueba y declara la persona que guarda el vínculo.
  const baselines = (profile?.results ?? []).filter(r =>
    /^[+−-]?\d+(?:[.,\s]\d+)*\s*%?$/.test(r.value.trim()) && r.unit.trim() && r.period.trim() && r.source.trim());
  return { profile, selection, recommendations, priorities, baselines, targets };
}

export type ProfilePlanOptions = ReturnType<typeof profilePlanOptions>;

export function eligibleProfilePlanTargets(options: ProfilePlanOptions, scenarioId: string) {
  const modules = options.selection?.catalogModuleLinks?.filter(l => l.scenarioId === scenarioId).map(l => l.moduleId) ?? [];
  return options.targets.filter(t => modules.includes(t.moduleId));
}

export function describeProfilePlanLink(options: ProfilePlanOptions, link: ProfilePlanLink): ProfilePlanLinkDetail | undefined {
  const { profile, selection } = options;
  if (!profile || profile.id !== link.profileId || !selection || selection.id !== link.selectionId) return;
  const recommendation = options.recommendations.find(r => r.id === link.recommendationId);
  const priority = options.priorities.find(p => p.id === link.scenarioId && p.areasOrigen.includes(link.recommendationId));
  const target = eligibleProfilePlanTargets(options, link.scenarioId)
    .find(t => t.indicatorWorksheetKey === link.worksheetKey && t.moduleVersion === link.moduleVersion);
  const result = link.baselineResultId ? options.baselines.find(r => r.id === link.baselineResultId) : undefined;
  if (!recommendation || !priority || !target || (link.baselineResultId && !result)) return;
  const baseline = result && { value: result.value, unit: result.unit, period: result.period, source: result.source, locator: result.page, scope: result.scale };
  return {
    ...link, profileTitle: profile.title, recommendation: recommendation.text, priority: priority.tema,
    selectionDate: selection.decidedAt, line: target.moduleTitle, objective: `${target.objectiveCode} · ${target.objectiveTitle}`,
    indicator: `${target.indicatorDisplayCode ?? target.indicatorCode} · ${target.indicatorTitle}`,
    ...(baseline ? { baseline } : {}),
  };
}

export function profilePlanBaselineText(baseline: ProfilePlanLinkDetail["baseline"]): string {
  if (!baseline) return "Sin línea de base vinculada.";
  const literal = baseline.unit === "%" && baseline.value.trimEnd().endsWith("%") ? baseline.value : `${baseline.value} ${baseline.unit}`;
  return [literal, baseline.period, baseline.scope, baseline.source, baseline.locator].filter(Boolean).join(" · ");
}

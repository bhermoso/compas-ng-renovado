import { ACTION_PLAN_CATALOG } from "../../domain/action-plan-catalog/ActionPlanCatalog";
import { buildDefinitiveActionPlanProjection, resolvedPlanDecisionText } from "../../domain/action-plan-catalog/DefinitiveActionPlanProjection";
import { municipalActionPlanModule } from "../../domain/action-plan-catalog/MunicipalActionPlanModule";
import type { PlanPreparationDraft } from "../../domain/action-plan-catalog/PlanPreparationDraft";

/** Indicador del Plan de Acción al que una actuación de la agenda puede declarar que contribuye. */
export interface PlanIndicatorOption { code: string; label: string; line: string; objective: string }

/**
 * Indicadores incorporados en las líneas adoptadas por el Grupo Motor, con su
 * redacción vigente en el territorio. Es la lista que ofrece la ficha de la
 * actuación para declarar su contribución (28/11/2026).
 */
export function planIndicatorOptions(municipalityId: string, adoptedModuleIds: readonly string[], drafts: readonly PlanPreparationDraft[]): PlanIndicatorOption[] {
  const adopted = new Set(adoptedModuleIds);
  const modules = ACTION_PLAN_CATALOG.filter((m) => adopted.has(m.id)).map((m) => municipalActionPlanModule(municipalityId, m));
  return buildDefinitiveActionPlanProjection(municipalityId, modules, [...drafts]).flatMap(({ module, rows }) =>
    rows.filter((row) => row.indicatorIncluded).map((row) => ({
      code: row.specific.indicator.displayCode ?? row.specific.indicator.code,
      label: resolvedPlanDecisionText(row.indicatorDecision, row.specific.indicator.title),
      line: module.title,
      objective: `${row.specific.displayCode ?? row.specific.code} · ${resolvedPlanDecisionText(row.objectiveDecision, row.specific.title)}`,
    })));
}

import { HEALTHY_AGING_MODULE, type ActionPlanCatalogModule } from "./ActionPlanCatalog";
import { AGING_FOUR_BLOCKS_BASE, type PlanPreparationDraft } from "./PlanPreparationDraft";

export const ZAGRA_ACTION_PLAN_VERSION = "zagra-cuatro-bloques-2026-10-28";

/** Plantilla estructural común a todos los expedientes territoriales.
 * No hereda decisiones ni aprobaciones de ningún territorio. Los identificadores
 * estables evitan colisiones con la antigua organización 3.1 en nueve grupos.
 */
export const COMMON_AGING_FOUR_BLOCKS_VERSION = "comun-cuatro-bloques-2026-11-04";

export const COMMON_AGING_FOUR_BLOCKS: ActionPlanCatalogModule = {
  ...AGING_FOUR_BLOCKS_BASE,
  version: COMMON_AGING_FOUR_BLOCKS_VERSION,
  sourceLabel: "Plantilla estructural de envejecimiento en cuatro bloques · adaptación y validación municipal pendientes",
  sourceDate: "2026-11-04",
  cautions: [
    ...AGING_FOUR_BLOCKS_BASE.cautions,
    "Propuesta de catálogo, no diagnóstico ni decisión aprobada del expediente. Seleccionar, adaptar y validar los objetivos e indicadores con las fuentes locales.",
  ],
  generalObjectives: AGING_FOUR_BLOCKS_BASE.generalObjectives.map(general => ({
    ...general,
    code: `COMUN-${general.code}`,
    specificObjectives: general.specificObjectives.map(specific => ({
      ...specific,
      indicator: {...specific.indicator},
    })),
  })),
};

/** Redacción de Zagra para los textos de la plantilla que nombran el territorio. */
const ZAGRA_TERRITORIAL_WORDING: Record<string, [string, string]> = {
  strategic: ["personas mayores del territorio", "personas mayores de Zagra"],
  "ENV-OE6.1": ["agentes del territorio", "agentes del municipio de Zagra"],
  "ENV-OE4.2": ["población mayor del territorio", "población mayor del municipio"],
  "ENV-OE8.2": ["personas mayores del territorio", "personas mayores del municipio de Zagra"],
};
const territorialText = (key: string, text: string) => {
  const wording = ZAGRA_TERRITORIAL_WORDING[key];
  return wording ? text.replace(wording[0], wording[1]) : text;
};

/** Reuses the four-block architecture, never the other territory's decisions. */
export const ZAGRA_AGING_PROPOSAL: ActionPlanCatalogModule = {
  ...AGING_FOUR_BLOCKS_BASE,
  version: ZAGRA_ACTION_PLAN_VERSION,
  sourceLabel: "Plan de Acción de Zagra · adaptación de la plantilla estructural de cuatro bloques",
  sourceDate: "2026-10-28",
  strategicObjective: territorialText("strategic", AGING_FOUR_BLOCKS_BASE.strategicObjective),
  generalObjectives: AGING_FOUR_BLOCKS_BASE.generalObjectives.map(general => ({
    ...general,
    // The old nine groups used ENV-OG1…9 with different meanings.
    code: `ZAGRA-${general.code}`,
    specificObjectives: general.specificObjectives.map(specific => ({
      ...specific,
      title: territorialText(specific.code, specific.title),
      indicator: {...specific.indicator},
    })),
  })),
};

export function municipalActionPlanModule(municipalityId: string, original: ActionPlanCatalogModule): ActionPlanCatalogModule {
  if (original.id !== HEALTHY_AGING_MODULE.id) return original;
  if (municipalityId === "zagra") return ZAGRA_AGING_PROPOSAL;
  return COMMON_AGING_FOUR_BLOCKS;
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

/** Regroup a 3.1 nine-group draft for any other territory.
 * Original document, individual edits, exclusions and evaluation remain
 * preserved; new general blocks explicitly start pending.
 */
export function regroupCommonActionPlanDraft(previous: PlanPreparationDraft, updatedAt: string): PlanPreparationDraft {
  if (previous.moduleId !== HEALTHY_AGING_MODULE.id) return previous;
  if (previous.version === COMMON_AGING_FOUR_BLOCKS_VERSION) return previous;
  if (previous.version !== HEALTHY_AGING_MODULE.version) {
    throw new Error("Versión de borrador desconocida. Se conserva sin modificar.");
  }
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
  for (const general of COMMON_AGING_FOUR_BLOCKS.generalObjectives) {
    decisions[general.code] = {status: "pending", sourceText: general.title};
  }
  return {
    ...previous,
    version: COMMON_AGING_FOUR_BLOCKS_VERSION,
    updatedAt,
    decisions,
    migration: {
      replacedAt: updatedAt,
      replacementVersion: COMMON_AGING_FOUR_BLOCKS_VERSION,
      draft: JSON.parse(JSON.stringify(previous)) as PlanPreparationDraft,
    },
  };
}

export function prepareMunicipalActionPlanDraft(municipalityId: string, module: ActionPlanCatalogModule, draft: PlanPreparationDraft | undefined, date = new Date().toISOString()): PlanPreparationDraft | undefined {
  if (!draft) return undefined;
  if (draft.municipalityId !== municipalityId || draft.moduleId !== module.id || !draft.decisions) {
    throw new Error("El borrador no pertenece al municipio y módulo abiertos. Se conserva sin modificar.");
  }
  if (draft.version === module.version) return draft;
  if (module.id === HEALTHY_AGING_MODULE.id && draft.version === HEALTHY_AGING_MODULE.version) {
    if (municipalityId === "zagra" && module.version === ZAGRA_ACTION_PLAN_VERSION) {
      return regroupZagraActionPlanDraft(draft, date);
    }
    if (municipalityId !== "zagra" && module.version === COMMON_AGING_FOUR_BLOCKS_VERSION) {
      return regroupCommonActionPlanDraft(draft, date);
    }
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

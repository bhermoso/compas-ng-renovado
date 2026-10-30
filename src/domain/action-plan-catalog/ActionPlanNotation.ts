import type { ActionPlanCatalogModule } from "./ActionPlanCatalog";

/** Resolve a persistent identifier to its visible notation within this module version. */
export function actionPlanElementCode(module: ActionPlanCatalogModule, id: string): string {
 if (id === module.id) return module.strategicObjectiveDisplayCode ?? id;
 for (const general of module.generalObjectives) {
  if (id === general.code) return general.displayCode ?? id;
  for (const specific of general.specificObjectives) {
   if (id === specific.code) return specific.displayCode ?? id;
   if (id === specific.indicator.code) return specific.indicator.displayCode ?? id;
  }
 }
 return id;
}

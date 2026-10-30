import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ACTION_PLAN_CATALOG, HEALTHY_AGING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { municipalActionPlanModule, ZAGRA_AGING_PROPOSAL } from "../src/domain/action-plan-catalog/MunicipalActionPlanModule";
import { ZAIDIN_AGING_PROPOSAL, thematicBlockNameFor, type PlanPreparationDraft } from "../src/domain/action-plan-catalog/PlanPreparationDraft";
import { regroupZagraActionPlan } from "../src/application/workspace/regroupZagraActionPlan";
import { createCompleteMunicipalityWorkspace } from "../src/application/workspace";
import { buildDefinitiveActionPlanProjection } from "../src/domain/action-plan-catalog/DefinitiveActionPlanProjection";
import { buildPlanDocument } from "../src/domain/action-plan-catalog/PlanDocument";
import { PlanPreparationPanel } from "../src/ui/components/PlanPreparationPanel";
import { ActionPlanCatalogPanel } from "../src/ui/components/BrowserCanonicalActionPlanPanel";

const referenceCodes = HEALTHY_AGING_MODULE.generalObjectives.flatMap(g => g.specificObjectives.map(s => [s.code, s.indicator.code].join("/"))).sort();

describe("Plan de Acción de Zagra en cuatro bloques", () => {
  it("adapta el territorio y mantiene los 18 objetivos e indicadores y el reparto vigente", () => {
    const module = municipalActionPlanModule("zagra", HEALTHY_AGING_MODULE);
    expect(module.generalObjectives.map(g => thematicBlockNameFor(g.code, module))).toEqual(["Edadismo", "Soledad no deseada", "Autonomía", "Participación"]);
    expect(module.generalObjectives.flatMap(g => g.specificObjectives.map(s => [s.code, s.indicator.code].join("/"))).sort()).toEqual(referenceCodes);
    expect(module.generalObjectives.map(g => g.specificObjectives.length)).toEqual([2, 7, 4, 5]);
    expect(module.generalObjectives[2].specificObjectives.map(s => s.code)).toContain("ENV-OE9.1");
    expect(module.generalObjectives[3].specificObjectives.map(s => s.code)).toContain("ENV-OE8.1");
    expect(module.strategicObjective).toContain("de Zagra");
    expect(JSON.stringify([module.strategicObjective, module.generalObjectives])).not.toMatch(/Zaidín|del distrito|MANY AGES|SENIOR FEST/);
    for (const original of HEALTHY_AGING_MODULE.generalObjectives.flatMap(g => g.specificObjectives)) {
      expect(module.generalObjectives.flatMap(g => g.specificObjectives).find(s => s.code === original.code)?.indicator).toEqual(original.indicator);
    }
  });

  it("no extiende el cambio a Loja, otros ámbitos ni otras líneas", () => {
    expect(municipalActionPlanModule("granada-zaidin", HEALTHY_AGING_MODULE)).toBe(ZAIDIN_AGING_PROPOSAL);
    expect(municipalActionPlanModule("loja", HEALTHY_AGING_MODULE)).toBe(HEALTHY_AGING_MODULE);
    for (const module of ACTION_PLAN_CATALOG.filter(m => m.id !== HEALTHY_AGING_MODULE.id)) {
      expect(municipalActionPlanModule("zagra", module)).toBe(module);
    }
    const empty = createCompleteMunicipalityWorkspace({id: "zagra", name: "Zagra"});
    expect(regroupZagraActionPlan(empty)).toBe(empty);
  });

  it("archiva la versión anterior, conserva adaptaciones, exclusiones y fichas sin aprobar los nuevos bloques", () => {
    const workspace = createCompleteMunicipalityWorkspace({id: "zagra", name: "Zagra"});
    const previous: PlanPreparationDraft = {
      municipalityId: "zagra", moduleId: HEALTHY_AGING_MODULE.id, version: "3.1", updatedAt: "2026-10-01",
      decisions: {
        "ENV-OG1": {status: "excluded", sourceText: "Autonomía anterior"},
        "ENV-OE1.1": {status: "modified", sourceText: "Original", text: "Adaptación propia de Zagra"},
        "ENV-OE2.2": {status: "modified", sourceText: "Original", text: "Soledad: texto propio"},
        "ENV-I2.2": {status: "excluded", sourceText: "Indicador anterior"},
      },
      evaluationFramework: {evaluationQuestions: ["Pregunta local"], evaluationMoments: [], evaluationResponsible: "", baselineNote: ""},
    };
    workspace.planPreparationDrafts = [previous];
    const before = JSON.stringify(workspace);
    const updated = regroupZagraActionPlan(workspace, "2026-10-28");
    const draft = updated.planPreparationDrafts![0];
    expect(updated.planPreparationDraftHistory?.[0].draft).toEqual(previous);
    expect(draft.decisions["ENV-OE1.1"]).toMatchObject({status: "excluded", text: "Adaptación propia de Zagra"});
    expect(draft.decisions["ENV-OE2.2"]).toEqual(previous.decisions["ENV-OE2.2"]);
    expect(draft.decisions["ENV-I2.2"].status).toBe("excluded");
    expect(draft.evaluationFramework).toEqual(previous.evaluationFramework);
    for (const general of ZAGRA_AGING_PROPOSAL.generalObjectives) expect(draft.decisions[general.code].status).toBe("pending");
    expect(updated.indicatorWorksheets).toEqual(workspace.indicatorWorksheets);
    expect(updated.actionPlanModuleReviews).toEqual(workspace.actionPlanModuleReviews);
    expect(updated.evidenceStore).toEqual(workspace.evidenceStore);
    expect(JSON.stringify(workspace)).toBe(before);
    expect(regroupZagraActionPlan(updated)).toBe(updated);
    const restored = JSON.parse(JSON.stringify(updated));
    expect(restored.planPreparationDraftHistory[0].draft).toEqual(previous);
  });

  it("muestra y exporta los cuatro bloques con los textos de Zagra", () => {
    const module = ZAGRA_AGING_PROPOSAL;
    const decisions: PlanPreparationDraft["decisions"] = {};
    const put = (code: string, sourceText: string) => {decisions[code] = {status: "included", sourceText};};
    put(module.id, module.strategicObjective);
    for (const general of module.generalObjectives) {
      put(general.code, general.title);
      for (const specific of general.specificObjectives) {put(specific.code, specific.title); put(specific.indicator.code, specific.indicator.title);}
    }
    const draft: PlanPreparationDraft = {municipalityId: "zagra", moduleId: module.id, version: module.version, updatedAt: "2026-10-28", decisions};
    const html = renderToStaticMarkup(<PlanPreparationPanel module={module} municipalityId="zagra" draft={draft} onChange={() => {}} renderWorksheet={() => null}/>);
    for (const name of ["Edadismo", "Soledad no deseada", "Autonomía", "Participación"]) expect(html).toContain(`<summary>${name}</summary>`);
    expect(html).toContain("4 objetivos generales");
    expect(html).toContain(module.strategicObjective);
    const document = buildPlanDocument("zagra", buildDefinitiveActionPlanProjection("zagra", [module], [draft]), "2026-10-28");
    expect(document.paragraphs.filter(p => p.heading && p.text.startsWith("Bloque temático"))).toHaveLength(4);
    expect(document.status).toBe("draft");
    const workspaceHtml = renderToStaticMarkup(<ActionPlanCatalogPanel municipalityId="zagra" drafts={[draft]} onDraftChange={() => {}} eligibleModules={[]} reviews={[]} worksheets={[]} onWorksheetChange={() => {}} onSave={() => []}/>);
    for (const name of ["Edadismo", "Soledad no deseada", "Autonomía", "Participación"]) expect(workspaceHtml).toContain(`<summary>${name}</summary>`);
    expect(workspaceHtml).toContain("4 objetivos generales");
    expect(workspaceHtml).not.toContain("9 objetivos generales");
    expect(workspaceHtml).toContain("6 objetivos generales");
    expect(workspaceHtml).toContain("Plan de Acción resultante · zagra");
  });
});

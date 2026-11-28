import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EMOTIONAL_WELLBEING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { agendaActuationsForIndicator } from "../src/domain/action-plan-catalog/ActionPlanTraceability";
import { planIndicatorOptions } from "../src/application/action-plan/planIndicatorOptions";
import { ActionPlanCatalogPanel } from "../src/ui/components/BrowserCanonicalActionPlanPanel";
import type { AgendaActuation } from "../src/domain/agenda/AgendaActuation";
import type { PlanPreparationDraft } from "../src/domain/action-plan-catalog/PlanPreparationDraft";

const actuation = (name: string, mainIndicator?: string, secondaryIndicators?: string[]): AgendaActuation => ({
  id: name, municipalityId: "atarfe", setting: null, order: 0, origin: "manual", name,
  identification: {}, strategic: { mainIndicator, secondaryIndicators }, population: {}, responsibles: {},
  tracking: { status: "planificada" }, result: { nextCycleDecision: "no-decidido" }, createdAt: "", updatedAt: "",
});

describe("Plan de Acción · ficha del indicador solo de medición (F5, 28/11/2026)", () => {
  it("una actuación contribuye al indicador que declara, como principal o secundario, por su código", () => {
    const list = [actuation("A", "BEM-I6.1 · Nº de personas"), actuation("B", "BEM-I6.10 · otro"), actuation("C", undefined, ["BEM-I6.1 · Nº"]), actuation("D")];
    expect(agendaActuationsForIndicator(list, "BEM-I6.1").map((a) => a.name)).toEqual(["A", "C"]);
  });

  it("la agenda ofrece solo los indicadores incorporados en las líneas adoptadas", () => {
    const m = EMOTIONAL_WELLBEING_MODULE;
    const g = m.generalObjectives[0]; const s = g.specificObjectives[0];
    const draft: PlanPreparationDraft = { municipalityId: "atarfe", moduleId: m.id, version: m.version, updatedAt: "", decisions: {
      [m.id]: { status: "included", sourceText: m.strategicObjective }, [g.code]: { status: "included", sourceText: g.title },
      [s.code]: { status: "included", sourceText: s.title }, [s.indicator.code]: { status: "included", sourceText: s.indicator.title } } };
    expect(planIndicatorOptions("atarfe", [m.id], [draft]).map((o) => o.code)).toEqual([s.indicator.code]);
    expect(planIndicatorOptions("atarfe", [], [draft])).toEqual([]);
  });

  it("la ficha no crea actuaciones: remite a la Agenda", () => {
    const html = renderToStaticMarkup(<ActionPlanCatalogPanel municipalityId="atarfe" municipalityName="Atarfe" reviews={[]} worksheets={[]} drafts={[]}
      onDraftChange={() => {}} onSave={() => []} section="lineas" eligibleModules={[{ module: EMOTIONAL_WELLBEING_MODULE, sourceScenarioIds: ["x"] }]}
      groupMotor={{ state: "current" }} agendaActuations={[actuation("Formación en prevención", "BEM-I6.1 · Nº")]} />);
    expect(html).not.toContain("Crear ficha de actuación");
    expect(html).not.toContain("Gestionar actuaciones");
    expect(html).toContain("Ficha del indicador · BEM-I6.1 · 1 actuación en la agenda");
  });
});

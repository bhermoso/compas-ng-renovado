import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ACTION_PLAN_CATALOG } from "../src/domain/action-plan-catalog";
import type { PlanPreparationDraft } from "../src/domain/action-plan-catalog/PlanPreparationDraft";
import { addManualActuation } from "../src/application/agenda/agendaActuations";
import { LocalHealthPlanOutline } from "../src/ui/components/LocalHealthPlanOutline";

describe("Esbozo del Plan Local de Salud", () => {
  it("se puede consultar antes de registrar actuaciones", () => {
    const module = ACTION_PLAN_CATALOG[0];
    const general = module.generalObjectives[0];
    const specific = general.specificObjectives[0];
    const draft: PlanPreparationDraft = {
      municipalityId: "granada-zaidin",
      moduleId: module.id,
      version: module.version,
      updatedAt: "2026-09-25T00:00:00.000Z",
      decisions: {
        [module.id]: { status: "included", sourceText: module.strategicObjective },
        [general.code]: { status: "included", sourceText: general.title },
        [specific.code]: { status: "included", sourceText: specific.title },
        [specific.indicator.code]: { status: "included", sourceText: specific.indicator.title },
      },
    };
    const html = renderToStaticMarkup(
      <LocalHealthPlanOutline
        municipalityId="granada-zaidin"
        municipalityName="Granada-Zaidín"
        province="Granada"
        healthReportTitle="Informe de Salud del Distrito Zaidín"
        pslStatus="validated"
        pslCompiled
        selectedPriorities={["Envejecimiento saludable"]}
        drafts={[draft]}
      />
    );
    expect(html).toContain("Plan Local de Salud del Distrito Zaidín");
    expect(html).toContain("Disponible antes de registrar actuaciones");
    expect(html).toContain(module.title);
    expect(html).toContain(specific.displayCode ?? specific.code);
    expect(html).toContain("Actuaciones pendientes de registro");
    expect(html).toContain("Borrador evolutivo");
  });

  const render = (props: Record<string, unknown>) => renderToStaticMarkup(
    <LocalHealthPlanOutline municipalityId="granada-zaidin" municipalityName="Granada-Zaidín" province="Granada" pslStatus="review" pslCompiled {...props} />
  );

  it("traduce el estado del Perfil en lugar de mostrar el valor interno", () => {
    const html = render({});
    expect(html).toContain("Perfil en revisión técnica");
    expect(html).not.toContain("Estado:</strong> review");
  });

  it("lista las actuaciones de la agenda en la sección 5 sin presentarlas como validadas", () => {
    const list = addManualActuation([], { id: "a", municipalityId: "granada-zaidin", name: "Paseos saludables", setting: "comunitario", now: "2026-10-21T00:00:00.000Z" });
    const html = render({ agendaActuations: list });
    expect(html).toContain("1 actuación registrada");
    expect(html).toContain("Paseos saludables");
    expect(html).toContain("Entorno comunitario");
    expect(html).toContain("no está validado");
    expect(html).not.toContain("Actuaciones pendientes de registro");
  });
});

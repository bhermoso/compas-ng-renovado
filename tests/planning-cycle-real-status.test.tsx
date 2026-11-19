import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalHealthPlanningCycle } from "../src/ui/components/LocalHealthPlanningCycle";

const base = {
  healthReportLoaded: false,
  pslHasEvidence: false,
  pslStatus: "draft" as const,
  pslIsStale: false,
  pslCompiled: false,
  thematicPrioritisationDone: false,
};
const render = (extra: Partial<Parameters<typeof LocalHealthPlanningCycle>[0]> = {}) =>
  renderToStaticMarkup(<LocalHealthPlanningCycle {...base} {...extra} onNavigate={() => {}} />);

describe("Estados trazables del ciclo de planificación", () => {
  it("no presenta el informe ausente como disponible ni como fase completada", () => {
    const html = render();
    expect(html).toContain("Sin informe incorporado");
    expect(html).toContain('aria-valuenow="0"');
  });
  it("solo acredita informe incorporado cuando consta el informe en el expediente", () => {
    const html = render({ healthReportLoaded: true });
    expect(html).toContain("Informe incorporado");
    expect(html).toContain('aria-valuenow="1"');
  });
  it("una selección de prioridades no equivale a un Plan de Acción terminado", () => {
    const html = render({ healthReportLoaded: true, prioritySelectionDone: true });
    expect(html).toContain("Prioridades seleccionadas; pendiente de elaborar el Plan");
    expect(html).toContain('aria-valuenow="1"');
  });
  it("un borrador de planificación indica actividad, no conclusión", () => {
    const html = render({ healthReportLoaded: true, planWorkInProgress: true });
    expect(html).toContain("Existe trabajo de planificación sin validar");
    expect(html).toContain('aria-valuenow="1"');
  });
  it("un Plan de Acción validado suma una fase completada", () => {
    const html = render({ healthReportLoaded: true, validatedPlanPresent: true });
    expect(html).toContain("Plan de Acción validado en el expediente");
    expect(html).toContain('aria-valuenow="2"');
  });
  it("la evaluación no se anuncia como disponible mientras su módulo sea informativo", () => {
    const html = render({ prioritySelectionDone: true, validatedPlanPresent: true });
    expect(html).toContain("Módulo de evaluación aún no implementado");
    expect(html).toContain('title="Ir a: Evaluación"');
    expect(html).toContain('aria-valuenow="1"');
  });
});

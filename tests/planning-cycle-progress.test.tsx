import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalHealthPlanningCycle } from "../src/ui/components/LocalHealthPlanningCycle";

const base = {
  healthReportLoaded: true,
  pslHasEvidence: true,
  pslStatus: "generated" as const,
  pslIsStale: false,
  pslCompiled: false,
  thematicPrioritisationDone: false,
};

describe("expediente: navegación y progreso", () => {
  it("cuenta solo las fases realmente completadas", () => {
    const html = renderToStaticMarkup(<LocalHealthPlanningCycle {...base} />);
    expect(html).toContain("1 de 6 fases completadas");
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="6"');
  });

  it("no considera completado un Perfil externo pendiente de validar", () => {
    const html = renderToStaticMarkup(<LocalHealthPlanningCycle {...base} externalProfileStatus="review" pslCompiled />);
    expect(html).toContain("1 de 6 fases completadas");
    expect(html).toContain("Versión vigente pendiente de validación técnica");
  });

  it("acredita el Perfil externo validado, sin dar por completada la priorización", () => {
    const html = renderToStaticMarkup(<LocalHealthPlanningCycle {...base} externalProfileStatus="validated" pslCompiled />);
    expect(html).toContain("2 de 6 fases completadas");
    expect(html).toContain('aria-valuenow="2"');
  });

  it("presenta accesos explícitos y marca la vista activa", () => {
    const html = renderToStaticMarkup(<LocalHealthPlanningCycle {...base} onNavigate={() => {}} currentView="psl" />);
    expect(html).toContain('title="Ir a: Perfil de salud local"');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Abrir ↗");
    expect(html).toContain("lhpc__phase--selected");
  });
});

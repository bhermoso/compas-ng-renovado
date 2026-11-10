import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalHealthPlanningCycle } from "../src/ui/components/LocalHealthPlanningCycle";

const base = { healthReportLoaded: true, pslHasEvidence: true, pslStatus: "draft" as never, pslIsStale: true, pslCompiled: true, thematicPrioritisationDone: true };
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("Expediente local de salud con Perfil externo vigente", () => {
  it("el Perfil vigente en revisión manda sobre el PSL heredado y no arrastra su aviso de evidencia", () => {
    const t = text(renderToStaticMarkup(<LocalHealthPlanningCycle {...base} externalProfileStatus="review" />));
    expect(t).toContain("Perfil de salud local En revisión Versión vigente pendiente de validación técnica");
    expect(t).not.toContain("La evidencia ha cambiado");
  });

  it("la validación técnica del Perfil vigente cierra la fase", () => {
    const t = text(renderToStaticMarkup(<LocalHealthPlanningCycle {...base} externalProfileStatus="validated" />));
    expect(t).toContain("Perfil de salud local Validado técnicamente");
  });

  it("una selección del Grupo Motor anterior a la participación no cierra la priorización", () => {
    const t = text(renderToStaticMarkup(<LocalHealthPlanningCycle {...base} externalProfileStatus="review" prioritySelectionWithoutParticipation />));
    expect(t).toContain("la selección del Grupo Motor es anterior y no la incorpora");
    expect(t).toContain("Plan de acción Pendiente");
  });

  it("sin Perfil externo conserva el comportamiento heredado", () => {
    const t = text(renderToStaticMarkup(<LocalHealthPlanningCycle {...base} />));
    expect(t).toContain("La evidencia ha cambiado");
  });
});

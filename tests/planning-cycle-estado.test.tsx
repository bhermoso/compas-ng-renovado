/**
 * tests/planning-cycle-estado.test.tsx
 *
 * Estado del paso «Perfil de Salud Local» en el Ciclo de Planificación Local:
 * «Completada» exige el artefacto institucional PSL-C compilado/congelado.
 * La validación técnica del borrador, por sí sola, no cierra la fase.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalHealthPlanningCycle } from "../src/ui/components/LocalHealthPlanningCycle";
import type { LocalHealthProfileStatus } from "../src/domain/health-profile";

function render(opts: {
  pslStatus: LocalHealthProfileStatus;
  pslCompiled: boolean;
  pslIsStale?: boolean;
  pslHasEvidence?: boolean;
}): string {
  return renderToStaticMarkup(
    <LocalHealthPlanningCycle
      healthReportLoaded={true}
      pslHasEvidence={opts.pslHasEvidence ?? true}
      pslStatus={opts.pslStatus}
      pslIsStale={opts.pslIsStale ?? false}
      pslCompiled={opts.pslCompiled}
      thematicPrioritisationDone={false}
    />
  );
}

describe("ciclo — fase Perfil de Salud Local", () => {
  it("validado técnicamente sin PSL-C no aparece como «Completada»", () => {
    const html = render({ pslStatus: "validated", pslCompiled: false });
    // El Informe usa «Disponible» y la priorización queda «En curso», así que
    // «Completada» no debe aparecer en ninguna fase del ciclo.
    expect(html).not.toContain("Completada");
    expect(html).toContain("Validado técnicamente");
    expect(html).toContain("Pendiente de compilación institucional");
  });

  it("con artefacto PSL-C compilado la fase sí puede mostrarse «Completada»", () => {
    const html = render({ pslStatus: "validated", pslCompiled: true });
    expect(html).toContain("Completada");
    expect(html).not.toContain("Pendiente de compilación institucional");
  });

  it("un borrador generado sigue «En curso», compile o no", () => {
    const html = render({ pslStatus: "generated", pslCompiled: false });
    expect(html).toContain("En curso");
    expect(html).not.toContain("Completada");
    expect(html).not.toContain("Validado técnicamente");
  });

  it("un PSL validado pero obsoleto mantiene «Revisar» aunque exista PSL-C", () => {
    const html = render({
      pslStatus: "validated",
      pslCompiled: true,
      pslIsStale: true,
    });
    expect(html).toContain("Revisar");
    expect(html).toContain("La evidencia ha cambiado");
    expect(html).not.toContain("Completada");
  });

  it("no altera la semántica de Priorización ni Plan de Acción", () => {
    // Con PSL validado, la priorización pasa a «En curso» y el Plan de acción
    // queda «Pendiente», exista o no el artefacto compilado.
    const sinArtefacto = render({ pslStatus: "validated", pslCompiled: false });
    const conArtefacto = render({ pslStatus: "validated", pslCompiled: true });
    for (const html of [sinArtefacto, conArtefacto]) {
      expect(html).toContain("Priorización");
      expect(html).toContain("Plan de acción");
      expect(html).toContain("En curso");
      expect(html).toContain("Pendiente");
    }
  });
});

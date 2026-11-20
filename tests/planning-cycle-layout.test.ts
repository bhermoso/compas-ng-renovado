import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../src/ui/components/LocalHealthPlanningCycle.css", import.meta.url), "utf8");
const component = readFileSync(new URL("../src/ui/components/LocalHealthPlanningCycle.tsx", import.meta.url), "utf8");

describe("Expediente local: estados compactos y accesibles", () => {
  it("muestra progreso en una sola línea, con detalle desplegable", () => {
    expect(component).toContain('<details className="lhpc lhpc--compact"');
    expect(component).toContain('<summary className="lhpc__compact-summary"');
    expect(css).toContain(".lhpc--compact .lhpc__compact-summary");
    expect(css).toContain(".lhpc__compact-track");
  });
  it("conserva las seis fases y sus notas sin botones de navegación duplicados", () => {
    expect(component).toContain("phases.map((phase)");
    expect(component).toContain("phase.statusLabel ?? STATUS_LABEL[phase.status]");
    expect(component).toContain("phase.note &&");
    expect(component).not.toContain("onNavigate!(phase.navigateTo!)");
  });
  it("permite leer las fases completas en móvil", () => {
    expect(css).toContain(".lhpc__compact-phase-note");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain("@media (max-width: 600px)");
    expect(css).toContain("grid-template-columns: 1fr");
  });
});

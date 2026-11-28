import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Plan de Acción comparte la portada de Inicio y el ritmo de columnas de
// Diagnóstico: cabecera común, una columna de color por sección y una sola
// sección abierta, cuyo contenido se monta al abrirla.
describe("Plan de Acción con el diseño de Inicio", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  const css = readFileSync("src/App.css", "utf8");
  const block = app.slice(app.indexOf('{view === "plan" && (() => {'), app.indexOf("{/* ── ⑧ Plan Local de Salud"));

  it("usa la portada común con la fase 04 y no la caja de título anterior", () => {
    expect(block).toContain('<CompasCover');
    expect(block).toContain('title="Plan de Acción"');
    expect(block).toContain('context="04 · Planificar"');
    expect(block).not.toContain('<WorkspaceDisclosure title="Secciones del Plan de Acción">');
    expect(block).not.toContain('<h2>Plan de Acción · edición directa</h2>');
    expect(block).not.toContain('className="plan-tabs"');
  });

  it("presenta cada sección como columna de fase y monta solo la abierta", () => {
    expect(block).toContain('className={`plan-page__section hp-phase hp-phase--${index + 1}`}');
    expect(block).toContain("open={planTab === section.id}");
    expect(block).toContain('{planTab === section.id && <div className="plan-page__body">{section.body()}</div>}');
    for (const title of ["Líneas e indicadores", "Plan resultante", "Decisión del Grupo Motor"]) {
      expect(block).toContain(`title: "${title}"`);
    }
    // Retiradas del Plan el 28/11/2026 (F3): la lectura automática y la repetición de Priorización.
    expect(block).not.toContain('title: "Lectura estratégica"');
    expect(block).not.toContain('title: "Participación y prioridades"');
    // El borrador automático de actuaciones se retiró el 28/11/2026: COMPÁS no genera actuaciones (Art. 16 bis).
    expect(block).not.toContain('title: "Borrador de actuaciones"');
  });

  it("la sección abierta ocupa el ancho completo y el interior no anida cajas", () => {
    expect(css).toMatch(/\.plan-page > details\[open\] \{ grid-column: 1 \/ -1; \}/);
    expect(css).toMatch(/#root \.hp\.plan-page \.plan-page__body \.workspace-panel \{\s*margin: 0;\s*padding: 0;\s*border: 0;/);
  });

  it("el Plan resultante muestra el nombre del ámbito, no su identificador", () => {
    expect(block).toContain("municipalityName={municipality.name}");
    expect(readFileSync("src/ui/components/DefinitiveActionPlanPreview.tsx", "utf8")).toContain('visibleName ?? municipalityId');
  });
});

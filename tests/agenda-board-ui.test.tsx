/** AgendaBoard y AgendaResultSummary: presentación estática. */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AgendaBoard } from "../src/ui/components/AgendaBoard";
import { AgendaResultSummary } from "../src/ui/components/AgendaResultSummary";
import { addManualActuation } from "../src/application/agenda/agendaActuations";

const noop = () => undefined;
const base = (name: string, setting: "sanitario" | null = null) =>
  addManualActuation([], { id: "a1", municipalityId: "m", name, setting, now: "2026-01-01T00:00:00Z" });

describe("AgendaBoard", () => {
  it("muestra cinco columnas y avisa de plan vacío", () => {
    const html = renderToStaticMarkup(createElement(AgendaBoard, {
      municipalityId: "m", municipalityName: "X", actuations: [], worksheets: [], onChange: noop,
    }));
    for (const c of ["Sin asignar", "Entorno sanitario", "Entorno laboral"]) expect(html).toContain(c);
    expect(html).toContain("El Plan de Acción aún no tiene actuaciones.");
    expect(html).toContain("Nueva actuación");
  });
  it("coloca la tarjeta en su entorno con selector de teclado", () => {
    const html = renderToStaticMarkup(createElement(AgendaBoard, {
      municipalityId: "m", municipalityName: "X", actuations: base("Taller de marcha", "sanitario"), worksheets: [], onChange: noop,
    }));
    expect(html).toContain("Taller de marcha");
    expect(html).toContain('draggable="true"');
    expect(html).toContain("Entorno de Taller de marcha");
  });
});

describe("AgendaResultSummary", () => {
  it("dice que no hay actuaciones y no inventa resultados", () => {
    expect(renderToStaticMarkup(createElement(AgendaResultSummary, { actuations: [], worksheets: [], onOpen: noop })))
      .toContain("aún no tiene actuaciones");
    const html = renderToStaticMarkup(createElement(AgendaResultSummary, { actuations: base("A"), worksheets: [], onOpen: noop }));
    expect(html).toContain("No registrado");
    expect(html).toContain("No decidido");
  });
});

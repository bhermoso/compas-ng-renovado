import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");

describe("plan generado: acceso a la ficha de cada indicador", () => {
  const preview = read("src/ui/components/DefinitiveActionPlanPreview.tsx");
  const panel = read("src/ui/components/PlanPreparationPanel.tsx");
  const css = read("src/App.css");

  it("cada ficha de indicador tiene un id al que enlaza el plan generado", () => {
    expect(panel).toContain("id={`ficha-${indicator.code}`}");
    expect(preview).toContain("document.getElementById(`ficha-${indicatorCode}`)");
  });

  it("el plan generado muestra el estado de la ficha y el botón solo con indicador incluido", () => {
    expect(preview).toContain("row.indicatorIncluded && (() =>");
    expect(preview).toContain("Abrir ficha");
  });

  it("la línea de ficha no sale al imprimir el plan", () => {
    expect(css).toMatch(/\.pcm-generated-plan \.pcm-preview-ficha[\s\S]{0,40}display: none !important/);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../src/ui/components/LocalHealthPlanningCycle.css", import.meta.url), "utf8");

describe("Expediente local: legibilidad de las seis fases", () => {
  it("cada fase mantiene anchura y no comprime su contenido en la franja", () => {
    expect(css).toMatch(/\.lhpc \.lhpc__phase\s*\{[^}]*flex:\s*0 0 225px/s);
    expect(css).toMatch(/\.lhpc \.lhpc__phase\s*\{[^}]*white-space:\s*normal/s);
    expect(css).toMatch(/\.lhpc \.lhpc__phases\s*\{[^}]*overflow-x:\s*auto/s);
  });
  it("separa nombre, estado y enlace en filas distintas", () => {
    expect(css).toMatch(/\.lhpc \.lhpc__phase-btn\s*\{[^}]*display:\s*grid/s);
    expect(css).toMatch(/\.lhpc \.lhpc__phase-label\s*\{[^}]*grid-row:\s*1/s);
    expect(css).toMatch(/\.lhpc \.lhpc__phase-status\s*\{[^}]*grid-row:\s*2/s);
    expect(css).toMatch(/\.lhpc \.lhpc__phase-action\s*\{[^}]*grid-row:\s*3/s);
  });
  it("las notas largas hacen salto de línea en vez de superponerse", () => {
    expect(css).toMatch(/\.lhpc \.lhpc__phase-note\s*\{[^}]*white-space:\s*normal/s);
    expect(css).toMatch(/\.lhpc \.lhpc__phase-note\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  });
});

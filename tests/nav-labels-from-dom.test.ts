import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Inspección 2026-10-21: las etiquetas de la navegación se escribían en el CSS por posición
 *  (nth-child) y, al añadir «Plan Local de Salud», cada pestaña mostraba el nombre de otra. */
describe("navegación principal", () => {
  it("el CSS no escribe etiquetas por posición", () => {
    for (const file of ["src/index.css", "src/App.css"]) {
      const css = readFileSync(file, "utf8");
      expect(css, file).not.toMatch(/\.app-nav__tab:nth-child\([^)]*\)::(before|after)\s*\{[^}]*content:\s*"/);
    }
  });
  it("cada pestaña declara su etiqueta y su fase en App.tsx", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    const block = app.slice(app.indexOf("const NAV_ITEMS"), app.indexOf("];", app.indexOf("const NAV_ITEMS")));
    expect(block).toContain('id: "agenda",        label: "Implantación", phase: "05"');
    expect(block).toContain('id: "evaluacion",    label: "Evaluación", phase: "06"');
    expect(block).toContain('id: "plan-local",    label: "Plan Local de Salud" }');
  });
});

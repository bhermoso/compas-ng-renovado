import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// La incorporación de Proceso amplió la barra a diez accesos.
describe("Navegación principal en escritorio", () => {
  const css = readFileSync("src/App.css", "utf8");
  const app = readFileSync("src/App.tsx", "utf8");

  it("permite filas adicionales en escritorio sin ocultar accesos", () => {
    const block = css.slice(css.indexOf("@media (min-width: 1024px) {\n  .app-nav .app-nav__inner"));
    expect(block).toMatch(/\.app-nav \.app-nav__inner \{ height: auto; min-height: 56px;/);
    expect(block).toMatch(/\.app-nav \.app-nav__tabs \{ flex-wrap: wrap; overflow: visible;/);
    expect(block).toMatch(/@media \(min-width: 1024px\) and \(max-width: 1279px\)/);
  });

  it("en anchos menores conserva Encuestas en el selector «Ir a»", () => {
    expect(css).toMatch(/@media \(max-width: 1023px\) \{\s*\.app-nav \.app-nav__tabs \{ display: none; \}\s*\.app-nav \.app-nav__menu \{ display: flex;/);
    expect(app).toMatch(/\{ id: "ges",\s*label: "Gestor de Encuestas" \}/);
  });

  it("parte las etiquetas largas en dos líneas fijas, nunca en tres", () => {
    for (const [label, a, b] of [
      ["Diagnóstico territorial", "Diagnóstico", "territorial"],
      ["Perfil de Salud Local", "Perfil de", "Salud Local"],
      ["Plan Local de Salud", "Plan Local", "de Salud"],
      ["Gestor de Encuestas", "Gestor de", "Encuestas"],
    ]) expect(app).toContain(`"${label}": ["${a}", "${b}"]`);
    expect(css).toMatch(/\.app-nav__label-line \{ display: block; white-space: nowrap; \}/);
  });
});

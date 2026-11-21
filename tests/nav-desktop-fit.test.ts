import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Las nueve pestañas deben verse en escritorio: ninguna queda escondida tras
// un desplazamiento horizontal de la barra (regresión observada a 1280–1920 px).
describe("Navegación principal en escritorio", () => {
  const css = readFileSync("src/App.css", "utf8");
  const app = readFileSync("src/App.tsx", "utf8");

  it("no oculta pestañas tras un desplazamiento horizontal a partir de 961 px", () => {
    const block = css.slice(css.indexOf("@media (min-width: 761px) {\n  .app-nav .app-nav__inner"));
    expect(block).toMatch(/\.app-nav \.app-nav__tabs \{ overflow: visible;/);
    expect(block).toMatch(/min-width: min-content;/);
  });

  it("entre 761 y 960 px usa el selector «Ir a» en lugar de la fila de pestañas", () => {
    expect(css).toMatch(/@media \(min-width: 761px\) and \(max-width: 960px\) \{\s*\.app-nav \.app-nav__tabs \{ display: none; \}/);
  });

  it("parte las etiquetas largas en dos líneas fijas, nunca en tres", () => {
    for (const [label, a, b] of [
      ["Diagnóstico territorial", "Diagnóstico", "territorial"],
      ["Perfil de Salud Local", "Perfil de", "Salud Local"],
      ["Plan Local de Salud", "Plan Local", "de Salud"],
      ["Gestor de Encuestas", "Gestor de", "Encuestas"],
    ]) expect(app).toContain(`"${label}": ["${a}", "${b}"]`);
    expect(css).toMatch(/\.app-nav__label-line \{ white-space: nowrap; \}/);
  });
});

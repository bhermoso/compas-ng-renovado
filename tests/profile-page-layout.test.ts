import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Perfil de Salud Local con el diseño de Inicio: portada común con la fase 02
// y una columna de fase por espacio del Perfil.
describe("Perfil de Salud Local con el diseño de Inicio", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  const profile = readFileSync("src/ui/components/ExternalProfileDashboard.tsx", "utf8");
  const css = readFileSync("src/App.css", "utf8");
  const block = app.slice(app.indexOf('{view === "psl" && (() => {'), app.indexOf("{/* ── ⑤ Priorizaciones"));

  it("usa la portada común con la fase 02 y el estado de la versión vigente", () => {
    expect(block).toContain('title="Perfil de Salud Local"');
    expect(block).toContain('context="02 · Perfilar"');
    expect(block).toContain("Vigente: <strong>{active.title}</strong>");
    expect(block).toContain('className="hp profile-page workspace-page"');
  });

  it("presenta los espacios como columnas de fase con su línea de estado", () => {
    expect(profile).toContain('className={`ep-space hp-phase hp-phase--${(index % 6) + 1}`}');
    expect(profile).toContain("aria-expanded={tab===key}");
    expect(profile).toContain('<summary><strong>Comprobar PDF original</strong>');
    expect(profile).toContain('<summary><strong>Incorporar un perfil</strong>');
  });

  it("la rejilla prevalece sobre la regla general de las pestañas de trabajo", () => {
    expect(css).toContain(".hp.workspace-page.profile-page:not(.diagnosis-page) {");
    expect(css).toMatch(/\.profile-page \.external-profile--compact,\s*\.profile-page \.external-profile--compact \.ep-spaces \{ display: contents; \}/);
  });
});

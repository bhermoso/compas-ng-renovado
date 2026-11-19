import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../src/App.css", import.meta.url),"utf8");
const profile = readFileSync(new URL("../src/ui/components/ExternalProfileDashboard.css", import.meta.url),"utf8");
const cover = readFileSync(new URL("../src/ui/components/HomePortada.css", import.meta.url),"utf8");

describe("Densidad compartida de COMPÁS", () => {
  it("mantiene la portada con su propio diseño, sin aplicar el shell compacto encima", () => {
    expect(cover).toContain(".app-shell.app-shell--home");
    expect(css).toContain(".app-shell:not(.app-shell--home)");
  });
  it("compacta márgenes de panel y tarjetas conservando espacio para texto", () => {
    expect(css).toMatch(/\.workspace-panel\s*\{\s*padding:\s*clamp\(/);
    expect(css).toMatch(/\.card\s*\{\s*padding:\s*clamp\(/);
    expect(css).toContain("min-width: 0;");
  });
  it("conserva el flujo de navegación móvil y los textos largos", () => {
    expect(css).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(profile).toContain(".external-profile .ep-tabs");
    expect(profile).toContain("flex-wrap: wrap");
  });
  it("no limita alturas del contenido completo o de la tabla de resultados", () => {
    const last = css.slice(css.lastIndexOf("/* COMPÁS — densidad editorial compartida"));
    expect(last).not.toMatch(/max-height:|overflow-y:\s*hidden|height:\s*100vh/);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// El marco estratégico común es el mismo en todos los expedientes: tiene acceso
// propio en Diagnóstico y no depende de que el expediente guarde copias.
describe("Acceso al marco estratégico común en Diagnóstico", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  it("es un acceso de primer nivel, fuera de «Otras herramientas»", () => {
    const access = app.indexOf('data-testid="diagnosis-common-framework"');
    const tools = app.indexOf('id="diagnosis-tools-drawer"');
    expect(access).toBeGreaterThan(0);
    expect(access).toBeLessThan(tools);
    expect(app).toContain("<summary><strong>Marco estratégico común</strong>");
    expect(app).toContain("<CommonStrategicFramework />");
  });
  it("el PESMAA se conserva en COMPÁS y se incluye en la compilación", () => {
    const access = readFileSync("src/ui/components/documentAccessUtils.ts", "utf8");
    expect(access).toContain("'docs/source-material/strategic-frameworks/PESMAA 2026-2029.pdf': pesmaa");
  });
});

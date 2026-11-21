import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../src/ui/components/ExternalProfileDashboard.tsx", import.meta.url), "utf8");

describe("Reordenación de estadística territorial hacia Diagnóstico", () => {
  it("diagnóstico aloja la herramienta oficial con contexto y guardado del expediente", () => {
    expect(app).toContain('data-testid="diagnosis-territorial-statistics"');
    expect(app).toContain("<TerritorialStatisticsPanel");
    expect(app).toContain("onSave={handleSaveTerritorialStatistics}");
    expect(app).toContain("snapshots={workspace.territorialStatistics}");
  });
  it("la estadística se ofrece directamente antes de las herramientas secundarias", () => {
    const otherTools = app.indexOf('<details id="diagnosis-tools-drawer"');
    expect(otherTools).toBeGreaterThan(0);
    expect(app.slice(0, otherTools)).toContain('data-testid="diagnosis-territorial-statistics"');
  });
  it("el Perfil ya no reproduce la pestaña de descarga estadística", () => {
    expect(profile).not.toContain("['statistics','Estadística territorial']");
    expect(profile).not.toContain("statisticsPanel");
    expect(profile).toContain("['versions','Gestión y versiones']");
  });
  it("la revisión viaja al Perfil sin alterar el vigente directamente", () => {
    expect(app).toContain("setPendingStatisticsRevision({municipalityId: municipality.id, results, note})");
    expect(profile).toContain("revisionOf: current.id");
    expect(profile).toContain("status: 'review'");
    expect(profile).toContain("results: structuredClone(incomingTerritorialRevision.results)");
    expect(profile).toContain("onIncomingTerritorialRevisionConsumed?.()");
  });
});

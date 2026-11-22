import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MUNICIPALITY_SEEDS } from "../src/infrastructure/seeds/municipalitySeeds";

// Granada-Zaidín se retiró de COMPÁS el 21/11/2026: no se ofrece, no se abre por
// defecto y su expediente de partida no se carga. No hay ámbito por defecto.
describe("Retirada de Granada-Zaidín y ausencia de ámbito por defecto", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  const catalog = app.slice(app.indexOf("const DEMO_MUNICIPALITIES"), app.indexOf("const DEMO_MUNICIPALITY_IDS"));

  it("no figura entre los ámbitos ni entre los expedientes de partida", () => {
    expect(catalog).not.toContain("granada-zaidin");
    expect(Object.keys(MUNICIPALITY_SEEDS)).not.toContain("granada-zaidin");
    expect(app).toContain('const RETIRED_MUNICIPALITY_IDS: readonly string[] = ["granada-zaidin"];');
  });

  it("no hay ámbito por defecto: sin elección previa se abre el selector", () => {
    expect(app).not.toContain("DEFAULT_MUNICIPALITY_ID");
    expect(app).toContain("const [showMunicipalitySelector, setShowMunicipalitySelector] = useState(() => !municipalityChosen);");
    expect(app).toContain('{municipalityChosen ? municipality.name : "Elige un ámbito"}');
  });

  it("no queda rótulo de demostración", () => {
    expect(app).not.toContain("SYNTHETIC_DEMO_MUNICIPALITY_ID");
  });

  it("sus datos, originales y código propio ya no están en el repositorio", () => {
    for (const path of [
      "public/seeds/compas-ng-workspace-granada-zaidin.json",
      "municipalities/granada-zaidin",
      "docs/source-material/health-reports/informe-salud-zaidin-abril-2023.pdf",
      "fixtures/workspaces/granada-zaidin-synthetic-test.json",
      "src/application/workspace/correctZaidinHealthReport.ts",
      "src/application/workspace/removeNonObservedZaidinStudies.ts",
      "src/application/workspace/replaceZaidinFinalDraft.ts",
      "src/ui/components/CoordinatorPreview.tsx",
    ]) expect(existsSync(path), path).toBe(false);
    expect(readFileSync("src/main.tsx", "utf8")).not.toContain("coordinacion-zaidin");
    expect(readFileSync("src/ui/components/documentAccessUtils.ts", "utf8")).not.toContain("zaidin");
  });

  it("las propuestas de actuación de la ficha no nombran el Zaidín en otros expedientes", () => {
    expect(readFileSync("src/domain/action-plan-catalog/ActionWorksheetProposal.ts", "utf8")).not.toMatch(/zaid/i);
  });
});

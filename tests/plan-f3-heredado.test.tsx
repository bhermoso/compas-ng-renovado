import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { EMOTIONAL_WELLBEING_MODULE } from "../src/domain/action-plan-catalog/ActionPlanCatalog";
import { ActionPlanCatalogPanel } from "../src/ui/components/BrowserCanonicalActionPlanPanel";

describe("Plan de Acción · retirada de lo heredado (F3, 28/11/2026)", () => {
  const html = renderToStaticMarkup(<ActionPlanCatalogPanel municipalityId="m" municipalityName="M" reviews={[]} worksheets={[]} drafts={[]}
    onDraftChange={() => {}} onSave={() => []} section="lineas" eligibleModules={[{ module: EMOTIONAL_WELLBEING_MODULE, sourceScenarioIds: ["x"] }]} groupMotor={{ state: "current" }} />);

  it("las necesidades no priorizadas no se piden en cada línea", () => {
    expect(html).not.toContain("Necesidades diagnosticadas no priorizadas");
    expect(html).toContain("se documentan una sola vez, para todo el Plan, en «Plan resultante»");
  });

  it("el Plan resultante no tiene «Generar» ni «Imprimir»: el documento sale de las descargas", () => {
    const preview = readFileSync("src/ui/components/DefinitiveActionPlanPreview.tsx", "utf8");
    expect(preview).not.toContain("Generar Plan de Acción");
    expect(preview).not.toContain("window.print");
  });
});
